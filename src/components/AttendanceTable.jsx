import React from 'react'

export default function AttendanceTable({ attendanceLogs, todayRecord, canTimeIn, handleTimeIn, handleTimeOut, currentPage, setCurrentPage, itemsPerPage, colors, PaginationControls }) {
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  return (
    <div style={{ background: colors.white, borderRadius: 20, flex: 1, display: 'flex', flexDirection: 'column', padding: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#6B7C65', color: 'white', position: 'sticky', top: 0 }}>
            <tr><th style={{ padding: 15 }}>Date</th><th>Time In</th><th>Time Out</th><th>Hours Worked</th></tr>
          </thead>
          <tbody>
            {!todayRecord && (
              <tr style={{ borderBottom: '1px solid #eee', textAlign: 'center', height: 60, background: canTimeIn() ? '#fff' : '#f9f9f9' }}>
                <td style={{ color: canTimeIn() ? 'black' : '#999' }}>{new Date().toLocaleDateString('en-CA')}</td>
                <td>
                  {canTimeIn() ? (
                    <button onClick={handleTimeIn} style={{ padding: '8px 20px', background: colors.red, color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 'bold' }}>TIME IN</button>
                  ) : (
                    <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>Scheduled</span>
                  )}
                </td>
                <td>-</td>
                <td>-</td>
              </tr>
            )}

            {paginate(attendanceLogs, currentPage, itemsPerPage).map(log => (
              <tr key={log.AttendanceID} style={{ borderBottom: '1px solid #eee', textAlign: 'center', height: 60 }}>
                <td>{log.Date}</td>
                <td>{new Date(log.TimeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                  {(!log.TimeOut && log.Date === new Date().toLocaleDateString('en-CA')) ? (
                    <button onClick={handleTimeOut} style={{ padding: '8px 20px', background: colors.red, color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 'bold' }}>TIME OUT</button>
                  ) : (
                    log.TimeOut ? new Date(log.TimeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
                  )}
                </td>
                <td>{log.TimeOut ? ((new Date(log.TimeOut) - new Date(log.TimeIn)) / 36e5).toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls total={attendanceLogs.length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
    </div>
  )
}
