// --- COLOR PALETTE ---
export const colors = {
  green: "#6B7C65",
  beige: "#E8DCC6",
  purple: "#7D4E99",
  darkGreen: "#4A5D4B",
  red: "#D9534F",
  blue: "#337AB7",
  gold: "#d3af37",
  orange: "#FF9800",
  white: "#ffffff",
  lightGray: "#ccc",
  darkGray: "#888",
  lightGrayBorder: "#f0f0f0"
}

// --- BUTTON STYLES ---
export const btnStyle = {
  padding: "8px 16px",
  borderRadius: "5px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  color: "white",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
}

// --- INPUT STYLES ---
export const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "5px 0",
  borderRadius: "5px",
  border: "1px solid #ccc",
  boxSizing: "border-box"
}

// --- PILL BUTTON STYLE GENERATOR ---
export const pillBtnStyle = (active, colors) => ({
  padding: "5px 15px",
  borderRadius: "20px",
  border: "1px solid #666",
  background: active ? colors.green : "white",
  color: active ? "white" : "black",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "bold"
})

// --- MODAL OVERLAY STYLE ---
export const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
}

// --- MODAL CONTENT STYLE ---
export const modalContentStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "15px",
  width: "550px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
}

// --- SIDEBAR STYLE ---
export const sidebarStyle = (colors) => ({
  width: "250px",
  flexShrink: 0,
  background: colors.green,
  padding: "30px 20px",
  color: "white",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box"
})

// --- MAIN CONTENT STYLE ---
export const mainContentStyle = (colors) => ({
  flex: 1,
  background: colors.beige,
  padding: "30px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
})

// --- TABLE HEADER STYLE ---
export const tableHeaderStyle = (colors) => ({
  position: "sticky",
  top: 0,
  background: colors.green,
  color: "white",
  zIndex: 1
})

// --- TABLE ROW STYLE ---
export const tableRowStyle = {
  borderBottom: "1px solid #eee",
  textAlign: "center",
  height: "50px"
}
