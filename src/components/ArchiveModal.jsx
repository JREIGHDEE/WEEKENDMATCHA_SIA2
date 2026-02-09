function ArchiveModal({ archiveReason, setArchiveReason, triggerConfirmation, executeArchive, setModals, modals, colors, btnStyle, inputStyle }) {
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const modalContent = { background: "white", padding: "25px", borderRadius: "15px", width: "550px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <h2 style={{ color: colors.red, marginTop: 0 }}>Archive Employee</h2>
        <textarea 
          style={{ ...inputStyle, height: "100px", resize: "none" }} 
          placeholder="Reason for Archiving (Required)" 
          value={archiveReason} 
          onChange={e => setArchiveReason(e.target.value)} 
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
          <button 
            onClick={() => setModals({...modals, archive: false})} 
            style={{...btnStyle, background: "#ccc", color: "#333"}}
          >
            Cancel
          </button>
          <button 
            onClick={() => triggerConfirmation(executeArchive)} 
            style={{...btnStyle, background: colors.red}}
          >
            Confirm Archive
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArchiveModal
