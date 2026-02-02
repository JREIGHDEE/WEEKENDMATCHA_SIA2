import { useNavigate } from 'react-router-dom'
// Import the images from your assets folder
import logo from '../assets/wm-logo.svg'
import adminIcon from '../assets/admin-sys.svg'
import posIcon from '../assets/pos.svg'
import personalIcon from '../assets/personal.svg'

function LandingPage() {
  const navigate = useNavigate()

  const cardStyle = {
    width: "220px", height: "220px", background: "#FFF8E7", 
    border: "2px solid #333", borderRadius: "20px",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    cursor: "pointer", margin: "20px", fontWeight: "bold", color: "#333",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
  }

  // Style for the icons inside the cards
  const iconStyle = {
    width: "80px", 
    height: "80px", 
    marginBottom: "15px"
  }

  return (
    <div style={{ background: "#4A5D4B", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "140px", color: "white" }}>
      
      {/* 1. REPLACED 'WM.' TEXT WITH LOGO */}
      <img 
        src={logo} 
        alt="WeekendMatcha Logo" 
        style={{ width: "180px", marginBottom: "5px" }} 
      />

      <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", justifyContent: "center" }}>
        
        {/* ADMIN BUTTON - STRICT MODE */}
        <div 
          style={cardStyle} 
          onClick={() => navigate('/login', { state: { type: 'admin' } })} 
        >
          {/* 2. REPLACED EMOJI WITH SVG */}
          <img src={adminIcon} alt="Admin System" style={iconStyle} />
          <span>ADMIN SYSTEMS</span>
        </div>

        {/* PERSONAL VIEW BUTTON */}
        <div 
          style={cardStyle} 
          onClick={() => navigate('/personal-view')}
        >
          <img src={personalIcon} alt="Personal View" style={iconStyle} />
          <span>PERSONAL VIEW</span>
        </div>

        {/* POS BUTTON - ENABLED */}
        <div 
          style={cardStyle} 
          onClick={() => navigate('/login', { state: { type: 'pos' } })}
        >
          <img src={posIcon} alt="POS System" style={iconStyle} />
          <span>POS SYSTEM</span>
        </div>

      </div>
    </div>
  )
}
export default LandingPage