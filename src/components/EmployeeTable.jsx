function EmployeeTable({ filteredEmployees, currentPage, itemsPerPage, selectedEmpId, setSelectedEmpId, colors, PaginationControls }) {
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  return (
    <div style={{ background: "white", borderRadius: "15px", flex: 1, boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: colors.green, color: "white", zIndex: 1 }}>
            <tr><th style={{ padding: "15px" }}>Select</th><th>ID</th><th>Full Name</th><th>Role</th><th>Status</th><th>Date Hired</th><th>Contact</th></tr>
          </thead>
          <tbody>
            {paginate(filteredEmployees, currentPage, itemsPerPage).map(emp => (
              <tr key={emp.EmployeeID} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "50px" }}>
                <td><input type="radio" name="empSelect" onChange={() => setSelectedEmpId(emp.EmployeeID)} style={{ transform: "scale(1.5)", cursor: "pointer" }} /></td>
                <td>{emp.EmployeeID}</td>
                <td style={{ fontWeight: "bold" }}>{emp.User?.FirstName} {emp.User?.LastName}</td>
                <td>{emp.User?.RoleName}</td>
                <td style={{ color: "green", fontWeight: "bold" }}>{emp.EmployeeStatus}</td>
                <td>{emp.DateHired}</td>
                <td>{emp.User?.ContactNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls total={filteredEmployees.length} page={currentPage} perPage={itemsPerPage} />
    </div>
  )
}

export default EmployeeTable
