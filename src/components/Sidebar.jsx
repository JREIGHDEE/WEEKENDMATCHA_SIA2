function Sidebar({ colors, navigate, logo }) {
  return (
    <div style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      <div style={{ paddingBottom: "10px", textAlign: "center" }}>
        <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
      </div>
      <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
      <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/inventory-system')}>Inventory System</div>
      <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/sales-system')}>Sales System</div>
      <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}}>Human Resource ➤</div>
      <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
    </div>
  )
}

export default Sidebar
