import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/wm-logo.svg'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() // <--- Hooks to read the signal

  // Determine what mode we are in (Default to 'personal' if accessed directly)
  const loginType = location.state?.type || 'personal'
  
  // Dynamic Title based on which button they clicked
  const pageTitle = loginType === 'admin' ? 'Admin System Login' : 'Employee Personal Login'

  const ADMIN_ROLES = ['HR Admin', 'Inventory Admin', 'Sales Admin']

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    
    // 1. Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (authError) {
      alert("Login failed: " + authError.message)
      setLoading(false)
      return
    }

    // 2. Check User Role
    const userId = authData.user.id
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('RoleName')
      .eq('UserID', userId)
      .maybeSingle()

    if (userError || !userData) {
      alert("Error: User profile not found.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    const isAdmin = ADMIN_ROLES.includes(userData.RoleName)

    // --- STRICT ROUTING LOGIC ---

    if (loginType === 'admin') {
        // CASE: User clicked "ADMIN SYSTEMS"
        if (isAdmin) {
            // ✅ Success
            navigate('/admin-menu')
        } else {
            // ⛔ Blocked (Employee trying to enter Admin)
            await supabase.auth.signOut()
            alert("⛔ ACCESS DENIED\n\nYou are attempting to access the Admin System with an Employee account.\nPlease use the 'Personal' option on the main menu.")
        }
    } 
    else {
        // CASE: User clicked "PERSONAL" (or direct link)
        // Everyone goes to Personal View (Even Admins, if they clicked Personal)
        navigate('/personal-view')
    }
    
    setLoading(false)
  }

  return (
    <div style={{ background: "#4A5D4B", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "140px", color: "white" }}>
      
      {/* 1. REPLACED 'WM.' TEXT WITH LOGO */}
      <img 
        src={logo} 
        alt="WeekendMatcha Logo" 
        style={{ width: "180px", marginBottom: "5px" }} 
      />

      <div style={{ background: "white", padding: "40px", borderRadius: "15px", width: "350px", color: "#333", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
        
        {/* Dynamic Header */}
        <h2 style={{ textAlign: "center", marginTop: 0, color: "#4A5D4B" }}>{pageTitle}</h2>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc" }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc" }} required />
          <button type="submit" disabled={loading} style={{ padding: "12px", background: "#6B7C65", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>
            {loading ? "Verifying..." : "Log In"}
          </button>
        </form>
        <p style={{textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#666", cursor: "pointer"}} onClick={() => navigate('/')}>← Back to Landing Page</p>
      </div>
    </div>
  )
}

export default Login