import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() 

  // 1. Determine which button was clicked on Landing Page (Default to 'personal')
  const loginType = location.state?.type || 'personal'
  
  // 2. Set dynamic title based on the button clicked
  let pageTitle = "System Login"
  if (loginType === 'admin') pageTitle = "Admin System Login"
  if (loginType === 'pos') pageTitle = "POS System Login"
  if (loginType === 'personal') pageTitle = "Employee Personal Login"

  // 3. Define Admin Roles
  const ADMIN_ROLES = ['HR Admin', 'Inventory Admin', 'Sales Admin']

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    
    // A. Authenticate with Supabase Auth (Email/Pass)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (authError) {
      alert("Login failed: " + authError.message)
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
      alert("Database Error: " + userError.message)
      setLoading(false)
      return
    }

    // C. Handle Missing Profile (e.g. Old accounts or sync issues)
    if (!userData) {
      alert("Login successful, but no User Profile was found in the database.\n\nPlease contact HR to set up your profile.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    const isAdmin = ADMIN_ROLES.includes(userData.RoleName)

    // D. ROUTING LOGIC (The Traffic Controller)
    
    if (loginType === 'admin') {
        // --- ADMIN BUTTON CLICKED ---
        // Strictly allow ONLY Admins. Kick out employees.
        if (isAdmin) {
            navigate('/admin-menu')
        } else {
            await supabase.auth.signOut()
            alert("⛔ ACCESS DENIED\n\nYou are attempting to access the Admin System with an Employee account.\nPlease use the 'Personal' or 'POS' option.")
        }
    } 
    else if (loginType === 'pos') {
        // --- POS BUTTON CLICKED ---
        // Allow Admins AND Employees (Barista, Cashier, etc)
        // You can add extra checks here if you want to block specific roles (e.g. 'Janitor')
        navigate('/pos')
    }
    else {
        // --- PERSONAL BUTTON CLICKED (Default) ---
        // Allow Everyone to see their own profile
        navigate('/personal-view')
    }
    
    setLoading(false)
  }

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#4A5D4B", color: "white", flexDirection: "column" }}>
      <h1 style={{fontSize: "3rem", marginBottom: "20px"}}>WM.</h1>
      
      <div style={{ background: "white", padding: "40px", borderRadius: "15px", width: "350px", color: "#333", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
        
        {/* Dynamic Header */}
        <h2 style={{ textAlign: "center", marginTop: 0, color: "#4A5D4B", fontSize: "22px" }}>{pageTitle}</h2>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc" }}
            required
          />
          
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc" }}
            required
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: "12px", background: "#6B7C65", color: "white", 
              border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" 
            }}
          >
            {loading ? "Verifying..." : "Log In"}
          </button>
        </form>
        
        <p style={{textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#666", cursor: "pointer"}} onClick={() => navigate('/')}>
          ← Back to Landing Page
        </p>
      </div>
    </div>
  )
}

export default Login