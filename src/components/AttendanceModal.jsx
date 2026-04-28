import React, { useState, useEffect } from 'react'
import * as personalService from '../services/personalService'

function AttendanceModal({ attendanceLogs, attendancePage, setAttendancePage, attendancePerPage, setModals, modals, colors, btnStyle, PaginationControls, employeeId, isAdmin = false }) {
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [monthlySummary, setMonthlySummary] = useState(null)
  const [showIncompleteCorrection, setShowIncompleteCorrection] = useState(false)
  const [selectedIncomplete, setSelectedIncomplete] = useState(null)
  const [correctionTime, setCorrectionTime] = useState('')
  
  useEffect(() => {
    if (employeeId) {
      loadMonthlySummary()
    }
  }, [monthFilter, yearFilter, employeeId])
  
  const loadMonthlySummary = async () => {
    const summary = await personalService.getMonthlyAttendanceSummary(employeeId, yearFilter, monthFilter)
    setMonthlySummary(summary)
  }
  
  const handleCorrectIncomplete = async () => {
    if (!correctionTime || !selectedIncomplete) return
    const { success, error } = await personalService.updateIncompleteAttendanceTimeOut(selectedIncomplete.AttendanceID, correctionTime)
    if (success) {
      setCorrectionTime('')
      setShowIncompleteCorrection(false)
      setSelectedIncomplete(null)
      setMonthlySummary(null) // Force refresh
      loadMonthlySummary()
    }
  }
  
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const modalContent = { background: "white", padding: "25px", borderRadius: "15px", width: "550px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }

  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }
  
  const incompleteRecords = attendanceLogs.filter(l => l.status === 'Incomplete')

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
        
        {/* MONTHLY SUMMARY SECTION */}
        {monthlySummary && (
          <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #eee" }}>
            <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "10px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#666" }}>Month/Year:</label>
              <select value={monthFilter} onChange={(e) => setMonthFilter(parseInt(e.target.value))} style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ddd" }}>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(yearFilter, m - 1).toLocaleString('en-US', {month: 'long'})}</option>)}
              </select>
              <select value={yearFilter} onChange={(e) => setYearFilter(parseInt(e.target.value))} style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ddd" }}>
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
              <div><span style={{ color: "#999" }}>Present:</span> <strong style={{ color: "#4CAF50" }}>{monthlySummary.present}</strong></div>
              <div><span style={{ color: "#999" }}>Incomplete:</span> <strong style={{ color: "#FF9800" }}>{monthlySummary.incomplete}</strong></div>
              <div><span style={{ color: "#999" }}>Absent:</span> <strong style={{ color: "#d32f2f" }}>{monthlySummary.absent}</strong></div>
              <div><span style={{ color: "#999" }}>Total Days:</span> <strong>{monthlySummary.totalDays}</strong></div>
            </div>
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc" }}>
          <table style={{width: "100%"}}>
            <thead style={{background:colors.green, color:"white", position: "sticky", top: 0}}>
              <tr><th style={{padding:"10px"}}>Date</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th>{isAdmin && <th>Action</th>}</tr>
            </thead>
            <tbody>
              {paginate(attendanceLogs, attendancePage, attendancePerPage).map(l => (
                <tr key={l.AttendanceID} style={{textAlign: "center", borderBottom: "1px solid #eee", background: l.status === 'Incomplete' ? '#FFF3E0' : 'transparent'}}>
                  <td style={{padding:"8px"}}>{l.Date}</td>
                  <td>{new Date(l.TimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td>{l.TimeOut ? new Date(l.TimeOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                  <td>{l.TimeOut ? ((new Date(l.TimeOut) - new Date(l.TimeIn)) / 36e5).toFixed(2) : '-'}</td>
                  <td style={{padding: "8px"}}><span style={{padding: "2px 8px", borderRadius: "3px", fontSize: "11px", fontWeight: "bold", background: l.status === 'Incomplete' ? '#FFF3E0' : '#E8F5E9', color: l.status === 'Incomplete' ? '#E65100' : '#2E7D32'}}>{l.status || 'Completed'}</span></td>
                  {isAdmin && <td style={{padding: "8px"}}>{l.status === 'Incomplete' && <button onClick={() => {setSelectedIncomplete(l); setShowIncompleteCorrection(true)}} style={{padding: '3px 10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'}}>Fix</button>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls total={attendanceLogs.length} page={attendancePage} setPage={setAttendancePage} perPage={attendancePerPage} />
        
        {/* ADMIN CORRECTION MODAL */}
        {showIncompleteCorrection && selectedIncomplete && (
          <div style={{position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000}}>
            <div style={{background: "white", padding: "25px", borderRadius: "10px", width: "350px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"}}>
              <h3 style={{margin: "0 0 15px 0", color: "#5a6955"}}>Correct Time Out</h3>
              <div style={{marginBottom: "15px"}}>
                <label style={{display: "block", fontSize: "12px", color: "#666", marginBottom: "5px"}}>Date: {selectedIncomplete.Date}</label>
                <label style={{display: "block", fontSize: "12px", color: "#666", marginBottom: "5px"}}>Time In: {new Date(selectedIncomplete.TimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</label>
              </div>
              <div style={{marginBottom: "15px"}}>
                <label style={{display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "5px", color: "#333"}}>Time Out (ISO format or HH:MM)</label>
                <input type="text" placeholder="2026-04-28T17:30:00" value={correctionTime} onChange={(e) => setCorrectionTime(e.target.value)} style={{width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", fontSize: "12px"}} />
              </div>
              <div style={{display: "flex", gap: "10px"}}>
                <button onClick={() => {setShowIncompleteCorrection(false); setSelectedIncomplete(null); setCorrectionTime('')}} style={{flex: 1, padding: "8px", background: "#ddd", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold"}}>Cancel</button>
                <button onClick={handleCorrectIncomplete} style={{flex: 1, padding: "8px", background: "#5a6955", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold"}}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceModal
