import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/wm-logo.svg'
import { Notification } from '../components/Notification'
import { requiredLabelStyle, requiredAsteriskStyle, type as typeScale } from '../constants/uiStyles'
import { HiArrowLeft } from 'react-icons/hi'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ message: '', type: 'success' })
  const navigate = useNavigate()
  const location = useLocation() 

  // 1. Determine which button was clicked on Landing Page (Default to 'personal')
  const loginType = location.state?.type || 'personal'
  
  // 2. Set dynamic title based on the button clicked
  let pageTitle = "System Login"
  if (loginType === 'admin') pageTitle = "Admin System Login"
  if (loginType === 'pos') pageTitle = "POS System Login"
  if (loginType === 'personal') pageTitle = "Employee Personal Login"

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
  }

  const clearNotification = () => {
    setNotification({ message: '', type: 'success' })
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    
    // A. Authenticate with Supabase Auth (Email/Pass)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (authError) {
      showNotification("Login failed: " + authError.message, 'error')
      setLoading(false)
      return
    }

    // B. Fetch User Role from Public 'User' Table
    const userId = authData.user.id
    
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('RoleName')
      .eq('UserID', userId)
      .maybeSingle() // Prevents crash if user missing

    if (userError) {
      showNotification("Database Error: " + userError.message, 'error')
      setLoading(false)
      return
    }

    // C. Handle Missing Profile (e.g. Old accounts or sync issues)
    if (!userData) {
      showNotification("Login successful, but no User Profile was found in the database. Please contact HR to set up your profile.", 'warning')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // C1. Check if Employee is Archived/Inactive
    const { data: employeeData, error: employeeError } = await supabase
      .from('Employee')
      .select('EmployeeID, EmployeeStatus') // <-- UPDATED THIS LINE: Added EmployeeID
      .eq('UserID', userId)
      .maybeSingle()

    if (employeeError) {
      showNotification("Database Error: " + employeeError.message, 'error')
      setLoading(false)
      return
    }

    if (employeeData && employeeData.EmployeeStatus === 'Inactive') {
      showNotification("Account Disabled: Your account has been archived and is no longer active. Please contact HR to reactivate your account.", 'error')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // --- NEW: Unhide from Quick Login ---
    // If they successfully logged in with email, remove their ID from the hidden list!
    if (employeeData) {
      const hidden = JSON.parse(localStorage.getItem('wm_hidden_profiles')) || []
      const updatedHidden = hidden.filter(id => id !== employeeData.EmployeeID)
      localStorage.setItem('wm_hidden_profiles', JSON.stringify(updatedHidden))
    }
    // ------------------------------------

    // D. ROUTING LOGIC (The Traffic Controller)
    
    if (loginType === 'admin') {
        // --- ADMIN BUTTON CLICKED ---
        // Let all active employees through to the menu. 
        // We will lock the specific HR tab inside the Sidebar component instead!
        navigate('/admin-menu')
    } 
    else if (loginType === 'pos') {
        // --- POS BUTTON CLICKED ---
        navigate('/pos')
    }
    else {
        // --- PERSONAL BUTTON CLICKED (Default) ---
        navigate('/personal-view')
    }
    
    setLoading(false)
  }

  return (
<div style={{ minHeight: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "linear-gradient(165deg, #6B7C65 0%, #4A5D4B 100%)", color: "white", boxSizing: "border-box" }}>

      {/* 1. REPLACED 'WM.' TEXT WITH LOGO */}
      <img
        src={logo}
        alt="WeekendMatcha Logo"
        style={{ width: "min(180px, 40vw)", marginBottom: "16px" }}
      />

      {/* 2. Login Box Starts Here */}
      <div className="fade-in-card" style={{ background: "white", padding: "clamp(28px, 4vw, 40px)", borderRadius: "18px", width: "min(350px, 90vw)", color: "#333", boxShadow: "0 18px 45px rgba(0,0,0,0.28)", boxSizing: "border-box" }}>

        {/* Dynamic Header */}
        <h2 style={{ textAlign: "center", marginTop: 0, color: "#4A5D4B", fontSize: typeScale.h2, fontWeight: 800 }}>{pageTitle}</h2>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={requiredLabelStyle}>Email<span style={requiredAsteriskStyle}>*</span></label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: typeScale.body, outline: "none", boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={requiredLabelStyle}>Password<span style={requiredAsteriskStyle}>*</span></label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: typeScale.body, outline: "none", boxSizing: "border-box" }}
              required
            />
          </div>

          <button
            className="btn-animated"
            type="submit"
            disabled={loading}
            style={{
              padding: "12px", background: "#6B7C65", color: "white",
              border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: typeScale.body
            }}
          >
            {loading ? "Verifying..." : "Log In"}
          </button>
        </form>

        <p style={{textAlign: "center", marginTop: "20px", fontSize: typeScale.small, color: "#666", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"}} onClick={() => navigate('/')}>
          <HiArrowLeft size={13} /> Back to Landing Page
        </p>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={clearNotification}
      />
    </div>
  )
}

export default Login