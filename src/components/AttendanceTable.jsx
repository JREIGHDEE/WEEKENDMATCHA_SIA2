import React from 'react'

export default function AttendanceTable({ attendanceLogs, todayRecord, canTimeIn, handleTimeIn, handleTimeOut, currentPage, setCurrentPage, itemsPerPage, colors, PaginationControls }) {
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  return (
    <div style={{ background: colors.white, borderRadius: 15, flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: colors.green, color: 'white', position: 'sticky', top: 0, zIndex: 1 }}>
            <tr><th style={{ padding: '15px' }}>Date</th><th style={{ padding: '15px' }}>Time In</th><th style={{ padding: '15px' }}>Time Out</th><th style={{ padding: '15px' }}>Hours Worked</th></tr>
          </thead>
          <tbody>
            {!todayRecord && (
              <tr style={{ borderBottom: '1px solid #eee', textAlign: 'center', height: 50, background: canTimeIn() ? '#fff' : '#f9f9f9' }}>
                <td style={{ padding: '10px', color: canTimeIn() ? 'black' : '#999' }}>{new Date().toLocaleDateString('en-CA')}</td>
                <td style={{ padding: '10px' }}>
                  {canTimeIn() ? (
                    <button onClick={handleTimeIn} style={{ padding: '8px 20px', background: colors.red, color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>TIME IN</button>
                  ) : (
                    <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>Scheduled</span>
                  )}
                </td>
                <td style={{ padding: '10px' }}>-</td>
                <td style={{ padding: '10px' }}>-</td>
              </tr>
            )}

            {paginate(attendanceLogs, currentPage, itemsPerPage).map(log => (
              <tr key={log.AttendanceID} style={{ borderBottom: '1px solid #eee', textAlign: 'center', height: 50 }}>
                <td style={{ padding: '10px' }}>{log.Date}</td>
                <td style={{ padding: '10px' }}>{new Date(log.TimeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td style={{ padding: '10px' }}>
                  {(!log.TimeOut && log.Date === new Date().toLocaleDateString('en-CA')) ? (
                    <button onClick={handleTimeOut} style={{ padding: '8px 20px', background: colors.red, color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>TIME OUT</button>
                  ) : (
                    log.TimeOut ? new Date(log.TimeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
                  )}
                </td>
                <td style={{ padding: '10px' }}>{log.TimeOut ? ((new Date(log.TimeOut) - new Date(log.TimeIn)) / 36e5).toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls total={attendanceLogs.length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
    </div>
  )
}
