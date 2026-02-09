function AttendanceModal({ attendanceLogs, attendancePage, setAttendancePage, attendancePerPage, setModals, modals, colors, btnStyle, PaginationControls }) {
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const modalContent = { background: "white", padding: "25px", borderRadius: "15px", width: "550px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }

  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  return (
    <div style={modalOverlay}>
      <div style={{...modalContent, width: "650px", display: "flex", flexDirection: "column", height: "70vh"}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2 style={{ margin: 0 }}>Attendance Log</h2>
          <button 
            onClick={() => setModals({...modals, attendance: false})} 
            style={{...btnStyle, background: "#ccc", color: "black", padding: "5px 10px"}}
          >
            Back
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc" }}>
          <table style={{width: "100%"}}>
            <thead style={{background:colors.green, color:"white", position: "sticky", top: 0}}>
              <tr><th style={{padding:"10px"}}>Date</th><th>In</th><th>Out</th><th>Hours Worked</th></tr>
            </thead>
            <tbody>
              {paginate(attendanceLogs, attendancePage, attendancePerPage).map(l => (
                <tr key={l.AttendanceID} style={{textAlign: "center", borderBottom: "1px solid #eee"}}>
                  <td style={{padding:"8px"}}>{l.Date}</td>
                  <td>{new Date(l.TimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td>{l.TimeOut ? new Date(l.TimeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                  <td>{l.TimeOut ? ((new Date(l.TimeOut) - new Date(l.TimeIn)) / 36e5).toFixed(2) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls total={attendanceLogs.length} page={attendancePage} setPage={setAttendancePage} perPage={attendancePerPage} />
      </div>
    </div>
  )
}

export default AttendanceModal
