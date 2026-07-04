// --- COLOR PALETTE ---
// Single source of truth for color across the app (Sales/Inventory style
// files re-export these so every page stays visually consistent).
export const colors = {
  green: "#6B7C65",
  darkGreen: "#4A5D4B",
  beige: "#E8DCC6",
  purple: "#7D4E99",
  red: "#D9534F",
  blue: "#337AB7",
  gold: "#d3af37",
  yellow: "#D4AF37",
  orange: "#E67E22",
  white: "#ffffff",
  lightGray: "#ccc",
  darkGray: "#888",
  lightGrayBorder: "#f0f0f0",
  ink: "#2f362d",
  muted: "#6b6b6b"
}

// --- ELEVATION / SHADOW SCALE ---
export const shadows = {
  sm: "0 1px 3px rgba(30, 35, 25, 0.08)",
  md: "0 4px 12px rgba(30, 35, 25, 0.10)",
  lg: "0 10px 28px rgba(30, 35, 25, 0.14)",
  xl: "0 18px 45px rgba(30, 35, 25, 0.22)",
  inset: "inset 0 1px 2px rgba(0,0,0,0.06)"
}

// --- RESPONSIVE TYPE SCALE (fluid via clamp, scales cleanly on tablets) ---
export const type = {
  h1: "clamp(20px, 1.6vw + 14px, 30px)",
  h2: "clamp(17px, 1vw + 12px, 22px)",
  h3: "clamp(15px, 0.6vw + 11px, 18px)",
  body: "clamp(13px, 0.35vw + 11px, 15px)",
  small: "clamp(11px, 0.25vw + 9px, 13px)",
  micro: "clamp(10px, 0.2vw + 8px, 11px)",
  stat: "clamp(18px, 1.2vw + 12px, 26px)"
}

// --- RESPONSIVE BREAKPOINTS (for use with the useMediaQuery hook) ---
export const breakpoints = {
  tabletSmall: 834,   // iPad mini / small Android tablets (portrait)
  tablet: 1024,       // standard tablet landscape
  desktop: 1280
}

// --- BUTTON STYLES ---
export const btnStyle = {
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  color: "white",
  fontSize: type.body,
  boxShadow: shadows.sm,
  letterSpacing: "0.2px"
}

// --- INPUT STYLES ---
export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  margin: "5px 0",
  borderRadius: "8px",
  border: "1px solid #d8d2c4",
  boxSizing: "border-box",
  fontSize: type.body,
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease"
}

export const requiredLabelStyle = {
  fontSize: type.small,
  fontWeight: "bold",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px"
}

export const requiredAsteriskStyle = {
  color: "#D9534F"
}

// --- PILL BUTTON STYLE GENERATOR ---
export const pillBtnStyle = (active, colorsArg = colors) => ({
  padding: "6px 16px",
  borderRadius: "20px",
  border: active ? "1px solid transparent" : "1px solid #d8d2c4",
  background: active ? colorsArg.green : "white",
  color: active ? "white" : "#444",
  cursor: "pointer",
  fontSize: type.micro,
  fontWeight: 700,
  transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease"
})

// --- MODAL OVERLAY STYLE ---
export const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(20, 24, 18, 0.55)",
  backdropFilter: "blur(2px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
}

// --- MODAL CONTENT STYLE ---
export const modalContentStyle = {
  background: "white",
  padding: "28px",
  borderRadius: "18px",
  width: "550px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: shadows.xl
}

// --- SIDEBAR STYLE ---
export const sidebarStyle = (colorsArg = colors) => ({
  width: "250px",
  flexShrink: 0,
  background: `linear-gradient(180deg, ${colorsArg.green} 0%, ${colorsArg.darkGreen} 100%)`,
  padding: "24px 18px",
  color: "white",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  boxShadow: "2px 0 12px rgba(0,0,0,0.15)"
})

// --- MAIN CONTENT STYLE ---
export const mainContentStyle = (colorsArg = colors) => ({
  flex: 1,
  background: `linear-gradient(180deg, ${colorsArg.beige} 0%, #f3ead9 100%)`,
  padding: "clamp(16px, 2vw, 30px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
})

// --- TABLE HEADER STYLE ---
export const tableHeaderStyle = (colorsArg = colors) => ({
  position: "sticky",
  top: 0,
  background: colorsArg.green,
  color: "white",
  zIndex: 1
})

// --- TABLE ROW STYLE ---
export const tableRowStyle = {
  borderBottom: "1px solid #eee",
  textAlign: "center",
  height: "50px"
}

// --- CARD STYLE (metric/stat cards) ---
export const cardStyle = {
  flex: 1,
  padding: "18px 20px",
  borderRadius: "14px",
  textAlign: "center",
  color: "white"
}
