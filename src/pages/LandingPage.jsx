import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  const cardStyle = {
    width: "220px", height: "220px", background: "#FFF8E7", 
    border: "2px solid #333", borderRadius: "20px",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    cursor: "pointer", margin: "20px", fontWeight: "bold", color: "#333",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
  }

  return (
    <div style={{ background: "#4A5D4B", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>WM.</h1>
      <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", justifyContent: "center" }}>
        
        {/* ADMIN BUTTON - STRICT MODE */}
        <div 
          style={cardStyle} 
          onClick={() => navigate('/login', { state: { type: 'admin' } })} // <--- PASSING THE SIGNAL
        >
          <div style={{ fontSize: "60px", marginBottom: "10px" }}>👤</div>
          <span>ADMIN SYSTEMS</span>
        </div>

        {/* PERSONAL BUTTON - OPEN MODE */}
        <div 
          style={cardStyle} 
          onClick={() => navigate('/login', { state: { type: 'personal' } })} // <--- PASSING THE SIGNAL
        >
          <div style={{ fontSize: "60px", marginBottom: "10px" }}>👤</div>
          <span>PERSONAL</span>
        </div>

        {/* POS - Disabled */}
        <div style={{ ...cardStyle, opacity: 0.6, cursor: "not-allowed" }}>
          <div style={{ fontSize: "60px", marginBottom: "10px" }}>👤</div>
          <span>POS SYSTEM</span>
        </div>

      </div>
    </div>
  )
}
export default LandingPage