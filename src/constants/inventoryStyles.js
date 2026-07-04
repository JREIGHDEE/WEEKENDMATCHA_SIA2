// Re-exports the shared design tokens from constants/uiStyles.js so the
// whole app stays visually consistent instead of maintaining separate copies.
import { colors, btnStyle, inputStyle, modalOverlayStyle, modalContentStyle, pillBtnStyle } from './uiStyles'

export { colors, btnStyle, inputStyle }

export const modalOverlay = modalOverlayStyle
export const modalContent = modalContentStyle

export const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }

export const pillBtn = (active) => pillBtnStyle(active, colors)
