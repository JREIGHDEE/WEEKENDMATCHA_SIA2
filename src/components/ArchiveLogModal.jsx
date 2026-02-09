function ArchiveLogModal({ archiveLogs, archivePage, setArchivePage, archivePerPage, executeRestore, setModals, modals, colors, btnStyle, PaginationControls }) {
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const modalContent = { background: "white", padding: "25px", borderRadius: "15px", width: "550px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }

  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  return (
    <div style={modalOverlay}>
      <div style={{...modalContent, width: "800px", display: "flex", flexDirection: "column", height: "80vh"}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h2 style={{ margin: 0, color: colors.blue }}>Archive Log</h2>
          <button 
            onClick={() => setModals({...modals, archiveLog: false})} 
            style={{...btnStyle, background: "#ccc", color: "black", padding: "5px 10px"}}
          >
            Close
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: colors.blue, color: "white", position: "sticky", top: 0 }}>
              <tr><th>LogID</th><th>Employee Name</th><th>Archived Date</th><th>Auto-Delete Date</th><th>Reason</th><th>Action</th></tr>
            </thead>
            <tbody>
              {paginate(archiveLogs, archivePage, archivePerPage).map(log => {
                const archivedDate = new Date(log.ArchivedDate)
                const deleteDate = new Date(archivedDate.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
                return (
                  <tr key={log.LogID} style={{ borderBottom: "1px solid #ddd", textAlign: "center", height: "40px" }}>
                    <td>{log.LogID}</td>
                    <td>{log.Employee?.User?.FirstName} {log.Employee?.User?.LastName}</td>
                    <td>{log.ArchivedDate}</td>
                    <td style={{ color: new Date() > deleteDate ? "#d32f2f" : "#f57c00", fontWeight: "bold" }}>{deleteDate.toISOString().split('T')[0]}</td>
                    <td>{log.ReasonArchived}</td>
                    <td><button onClick={() => executeRestore(log.LogID, log.EmployeeID)} style={{ padding: "5px 15px", background: "#337AB7", color: "white", border: "none", borderRadius: "15px", cursor: "pointer", fontWeight: "bold" }}>Restore</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <PaginationControls total={archiveLogs.length} page={archivePage} setPage={setArchivePage} perPage={archivePerPage} />
      </div>
    </div>
  )
}

export default ArchiveLogModal
