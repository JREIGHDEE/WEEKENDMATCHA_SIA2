export const colors = { 
  green: "#6B7C65", 
  beige: "#E8DCC6", 
  darkGreen: "#4A5D4B", 
  red: "#D9534F", 
  yellow: "#D4AF37", 
  orange: "#E67E22", 
  blue: "#337AB7" 
};

export const btnStyle = { padding: "8px 16px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", color: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" };
export const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
export const modalContent = { background: "white", padding: "30px", borderRadius: "15px", width: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", position: "relative" };
export const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "14px", outline: "none", marginBottom: "15px" };
export const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" };

export const pillBtn = (active) => ({ 
  padding: "5px 15px", 
  borderRadius: "20px", 
  border: "1px solid #666", 
  background: active ? colors.green : "white", 
  color: active ? "white" : "black", 
  cursor: "pointer", 
  fontSize: "12px", 
  fontWeight: "bold" 
});