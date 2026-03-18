// 1. Add setCurrentPage to the props at the top
function EmployeeTable({ filteredEmployees, currentPage, setCurrentPage, itemsPerPage, prepareUpdate, prepareArchive, openAttendanceModal, colors, PaginationControls}) {
  
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  return (
    <div style={{ background: "white", borderRadius: "15px", flex: 1, boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: colors.green, color: "white", zIndex: 1 }}>
            <tr><th style={{ padding: "15px" }}>ID</th><th>Full Name</th><th>Role</th><th>Status</th><th>Date Hired</th><th>Contact</th><th style={{ width: "150px", paddingRight: "15px" }}>Actions</th></tr>
          </thead>
          <tbody>
            {paginate(filteredEmployees, currentPage, itemsPerPage).map(emp => (
              <tr key={emp.EmployeeID} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "50px" }}>
                <td>{emp.EmployeeID}</td>
                <td style={{ fontWeight: "bold" }}>{emp.User?.FirstName} {emp.User?.LastName}</td>
                <td>{emp.User?.RoleName}</td>
                <td style={{ color: "green", fontWeight: "bold" }}>{emp.EmployeeStatus}</td>
                <td>{emp.DateHired}</td>
                <td>{emp.User?.ContactNumber}</td>
                
                <td style={{ width: "150px", paddingRight: "15px" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button onClick={() => openAttendanceModal(emp.EmployeeID)} style={{ padding: "6px 10px", background: colors.purple, color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }} title="View Attendance">Attendance</button>
                    <button onClick={() => prepareUpdate(emp.EmployeeID)} style={{ padding: "6px 10px", background: "#d3af37", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }} title="Update Employee">Update</button>
                    <button onClick={() => prepareArchive(emp.EmployeeID)} style={{ padding: "6px 10px", background: colors.red, color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }} title="Archive Employee">Archive</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 2. Pass the setCurrentPage prop down to the controls here */}
      <PaginationControls total={filteredEmployees.length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
    </div>
  )
}

export default EmployeeTable