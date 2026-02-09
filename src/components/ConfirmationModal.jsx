function ConfirmationModal({ isOpen, onConfirm, onCancel, colors, btnStyle }) {
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }
  const modalContent = { background: "white", padding: "25px", borderRadius: "15px", width: "550px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }

  if (!isOpen) return null

  return (
    <div style={modalOverlay}>
      <div style={{...modalContent, width: "350px", textAlign: "center", border: "2px solid #444", background: "#fff"}}>
        <h3 style={{marginTop: 0}}>Are you sure?</h3>
        <p>Do you want to proceed with this action?</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          <button onClick={onCancel} style={{...btnStyle, background: "#ccc", color: "#333"}}>Cancel</button>
          <button onClick={onConfirm} style={{...btnStyle, background: colors.green}}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal
