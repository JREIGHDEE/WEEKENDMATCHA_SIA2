function CancelConfirmationModal({ isOpen, onConfirm, onCancel, colors, btnStyle }) {
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }
  const modalContent = { background: "white", padding: "25px", borderRadius: "15px", width: "550px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }

  if (!isOpen) return null

  return (
    <div style={modalOverlay}>
      <div style={{...modalContent, width: "400px", textAlign: "center", border: "2px solid #444", background: "#fff"}}>
        <h3 style={{marginTop: 0, color: "#333"}}>Cancel Operation?</h3>
        <p style={{color: "#666", fontSize: "14px"}}>Are you sure you want to cancel? Unsaved changes may be lost.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          <button onClick={onCancel} style={{...btnStyle, background: colors.green || "#6B7C65", padding: "10px 20px"}}>No, Stay</button>
          <button onClick={onConfirm} style={{...btnStyle, background: colors.red || "#D9534F", padding: "10px 20px"}}>Yes, Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default CancelConfirmationModal
