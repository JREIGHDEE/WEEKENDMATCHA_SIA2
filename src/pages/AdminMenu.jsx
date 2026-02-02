import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import logo from '../assets/wm-logo.svg' 
import cafePhoto from '../assets/cafe-photo.png'

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

  // --- STYLES (MATCHED WITH SALES SYSTEM) ---
  const sidebarStyle = {
    width: "250px", // Changed from 280px to match Sales
    background: "#6B7C65", 
    height: "100vh", 
    flexShrink: 0,
    boxSizing: "border-box", 
    padding: "30px 20px", 
    color: "white", 
    display: "flex", 
    flexDirection: "column", 
    // Removed gap: "25px" to match Sales spacing logic
  }
  
  // Standard Item Style (from Sales System)
  const itemStyle = { 
    padding: "10px", 
    fontSize: "16px", 
    fontWeight: "bold", 
    borderRadius: "8px", 
    marginBottom: "10px", 
    color: "white", 
    cursor: "pointer" 
  }

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      
      <div style={sidebarStyle}>
        
        {/* LOGO ADDED HERE */}
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        
        {/* --- NAVIGATION LINKS --- */}
        <div style={{ ...itemStyle, opacity: 0.5 }} onClick={() => navigate('/inventory-system')}>
          Inventory System
        </div>
        
        {/* Sales System Link */}
        <div style={{ ...itemStyle, opacity: 0.5 }} onClick={() => navigate('/sales-system')}>
            Sales System
        </div>
        
        <div style={{ ...itemStyle, opacity: 0.5 }} onClick={() => navigate('/hr-system')}>
            Human Resource
        </div>
        
        {/* --- LOG OUT BUTTON --- */}
        <div 
          style={{ marginTop: "auto", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "18px", opacity: 0.8 }} 
          onClick={() => { supabase.auth.signOut(); navigate('/') }}
        >
          <span>↪</span> Log Out
        </div>
      </div>

          <div style={{ 
              flex: 1, 
              // Set the background image
              backgroundImage: `url(${cafePhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              
              // Add the 80% color overlay (using the same #DD571C color)
              boxShadow: `inset 0 0 0 1000px rgba(221, 87, 28, 0.3)` 
          }}>
              <img
                src={logo}
                alt="WeekendMatcha Logo Center"
                // Set opacity to 1.0 so the logo is crisp on the overlay
                style={{ width: "600px", height: "auto", opacity: 1.0 }} 
              />
          </div>

          
    </div>
  )
}
export default AdminMenu