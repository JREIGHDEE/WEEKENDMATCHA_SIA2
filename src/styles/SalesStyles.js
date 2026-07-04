// Re-exports the shared design tokens from constants/uiStyles.js so the
// whole app stays visually consistent instead of maintaining separate copies.
import { colors, btnStyle, cardStyle, inputStyle, modalOverlayStyle, modalContentStyle, shadows, type } from '../constants/uiStyles'

export { colors, btnStyle, cardStyle, inputStyle, type, shadows }

export const formInput = {
  width: "100%",
  padding: "10px 12px",
  margin: "5px 0 15px",
  borderRadius: "8px",
  border: "1px solid #d8d2c4",
  boxSizing: "border-box",
  fontSize: "14px",
  outline: "none"
}

export const modalOverlay = modalOverlayStyle
export const modalContent = modalContentStyle

export const confirmOverlay = {
  ...modalOverlayStyle,
  zIndex: 2000
}

export const confirmContent = {
  ...modalContentStyle,
  width: "400px",
  textAlign: "center",
  boxShadow: shadows.xl
}
