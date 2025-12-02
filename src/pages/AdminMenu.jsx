import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function AdminMenu() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // SECURITY CHECK
  useEffect(() => {
    const checkSecurity = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      const { data } = await supabase
        .from('User')
        .select('RoleName')
        .eq('UserID', user.id)
        .maybeSingle()

      const ALLOWED = ['HR Admin', 'Inventory Admin', 'Sales Admin']

      if (!data || !ALLOWED.includes(data.RoleName)) {
        alert("⛔ ACCESS DENIED: You are not an Admin.")
        navigate('/personal-view') 
      } else {
        setLoading(false) 
      }
    }
    checkSecurity()
  }, [])

  if (loading) return <div style={{height:"100vh", background:"#6B7C65"}}></div>

  const sidebarStyle = {
    width: "280px", 
    background: "#6B7C65", 
    height: "100vh", 
    // FIX: This ensures padding doesn't push content off-screen
    boxSizing: "border-box", 
    padding: "30px 20px", 
    color: "white", 
    display: "flex", 
    flexDirection: "column", 
    gap: "25px"
  }
  
  const menuItemStyle = { cursor: "pointer", padding: "10px", fontSize: "20px", fontWeight: "500" }

  return (
    // FIX: Overflow hidden ensures no double scrollbars
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      
      <div style={sidebarStyle}>
        <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>WeekendMatcha</h2>
        
        {/* --- NAVIGATION LINKS --- */}
        <div style={{...menuItemStyle, background: "rgba(255,255,255,0.2)", borderRadius: "8px"}} onClick={() => navigate('/personal-view')}>
          👤 My Personal View
        </div>
        
        <div style={{borderTop: "1px solid rgba(255,255,255,0.3)", margin: "10px 0"}}></div>

        <div style={{...menuItemStyle, opacity: 0.5}}>Inventory System</div>
        <div style={{...menuItemStyle, opacity: 0.5}}>Sales System</div>
        <div style={{...menuItemStyle, background: "#5a6955", borderRadius: "8px"}} onClick={() => navigate('/hr-system')}>Human Resource ➤</div>
        
        {/* --- LOG OUT BUTTON --- */}
        <div 
          style={{ marginTop: "auto", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "18px", paddingBottom: "10px" }} 
          onClick={() => { supabase.auth.signOut(); navigate('/') }}
        >
          <span>↪</span> Log Out
        </div>
      </div>

      <div style={{ flex: 1, background: "linear-gradient(to bottom right, #E8DCC6, #D4B499)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h1 style={{ fontSize: "150px", color: "white", opacity: 0.8 }}>WM.</h1>
      </div>
    </div>
  )
}
export default AdminMenu