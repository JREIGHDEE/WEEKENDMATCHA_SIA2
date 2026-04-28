import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/wm-logo.svg'
import { Notification } from '../components/Notification'
import { useNotification } from '../hooks/useNotification'
import { usePersonal } from '../hooks/usePersonal'
import ProfileCard from '../components/ProfileCard'
import AttendanceTable from '../components/AttendanceTable'
import { colors } from '../constants/uiStyles'

function PersonalView() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Profile') 
  
  // Data States
  const notificationState = useNotification()
  const { notification, setNotification, showSuccess, showError, clearNotification } = notificationState

  const personal = usePersonal()
  const { employee, attendanceLogs, todayRecord, loading, isAdmin, fetchPersonalData, refreshAttendance, doTimeIn, doTimeOut, setNextShift } = personal

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7
  
  // Shift-end reminder
  const [showShiftEndReminder, setShowShiftEndReminder] = useState(false)
  const [minutesUntilShiftEnd, setMinutesUntilShiftEnd] = useState(null)

  useEffect(() => {
    fetchPersonalData(navigate, setNotification)
  }, [])
  // --- SHIFT END REMINDER CHECK ---
  useEffect(() => {
    if (!employee?.ShiftSchedule || !personal.employee) return
    
    const checkShiftEnd = async () => {
      const status = await (await import('../services/personalService')).getEmployeeAttendanceStatus(employee.EmployeeID)
      if (!status.isTimedIn) {
        setShowShiftEndReminder(false)
        return
      }
      
      const parsed = (await import('../services/personalService')).parseShiftEndTime(employee.ShiftSchedule)
      if (!parsed) return
      
      const now = new Date()
      const shiftEnd = new Date()
      shiftEnd.setHours(parsed.endHour, parsed.endMinute, 0, 0)
      
      const minutesLeft = Math.floor((shiftEnd - now) / 60000)
      
      if (minutesLeft > 0 && minutesLeft <= 30 && minutesLeft > -30) {
        setMinutesUntilShiftEnd(minutesLeft)
        setShowShiftEndReminder(true)
      } else {
        setShowShiftEndReminder(false)
      }
    }
    
    checkShiftEnd()
    const interval = setInterval(checkShiftEnd, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [employee?.ShiftSchedule, employee?.EmployeeID, activeTab])
  // --- AUTOMATIC SCHEDULING LOGIC ---
  const getNextDateForDay = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const targetIndex = days.indexOf(dayName)
    if (targetIndex === -1) return null

    const date = new Date()
    // Calculate difference to next occurrence
    let diff = (targetIndex - date.getDay() + 7) % 7
    if (diff === 0) diff = 7 // If today is the day, schedule for next week
    
    date.setDate(date.getDate() + diff)
    return date.toLocaleDateString('en-CA')
  }

  // --- ATTENDANCE ACTIONS ---
  const handleTimeIn = async () => {
    const { error } = await doTimeIn(employee.EmployeeID)
    if (error) showError(error.message)
    else {
      showSuccess('Timed In Successfully!')
      await refreshAttendance(employee.EmployeeID)
    }
  }

  const handleTimeOut = async () => {
    if (!todayRecord) return
    const { error } = await doTimeOut(todayRecord.AttendanceID)
    if (error) { showError(error.message); return }

    // update next shift
    let nextDateMsg = ''
    if (employee.SchedulePattern) {
      const nextDate = getNextDateForDay(employee.SchedulePattern)
      if (nextDate) {
        await setNextShift(employee.EmployeeID, nextDate)
        // reflect locally
        // setEmployee not exposed from hook; using fetchPersonalData to refresh entire profile
        nextDateMsg = ` See you on ${nextDate}!`
      }
    }

    showSuccess('Timed Out Successfully!' + nextDateMsg)
    await refreshAttendance(employee.EmployeeID)
    // refresh profile to get NextShift
    await fetchPersonalData(navigate, setNotification)
  }

  async function handleLogout() {
    const { signOut } = await import('../services/personalService')
    await signOut()
    navigate('/')
  }

  // --- LOGIC: CAN USER TIME IN? ---
  const canTimeIn = () => {
    if (todayRecord) return false; // Already timed in today
    
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    // If no NextShift is set (New Employee), allow Time In
    if (!employee?.NextShift) return true;

    // If NextShift matches Today, allow Time In
    if (employee.NextShift === todayStr) return true;

    // Otherwise (Schedule is for a different day), block it
    return false;
  }

  const sidebarItem = (name) => ({
    padding: "10px", 
    cursor: "pointer", 
    fontWeight: "bold",
    borderRadius: "8px",
    marginBottom: "10px",
    fontSize: "16px",
    color: "white",
    background: activeTab === name ? "#5a6955" : "transparent"
  })

  // --- PAGINATION HELPER ---
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  const PaginationControls = ({ total, page, setPage, perPage }) => {
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    return (
      <div style={{ 
        display: "flex", justifyContent: "center", padding: "20px", gap: "10px", alignItems: "center", fontWeight: "bold", color: "#666",
        marginTop: "auto", borderTop: "1px solid #eee"
      }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
          <span key={num} onClick={() => setPage(num)} style={{ cursor: "pointer", color: page === num ? "#333" : "#ccc", fontSize: page === num ? "18px" : "16px", transform: page === num ? "scale(1.2)" : "scale(1)" }}>
            {num}
          </span>
        ))}
        <span onClick={() => setPage(p => Math.min(p + 1, totalPages))} style={{ cursor: "pointer" }}>&gt;</span>
      </div>
    )
  }

  if (loading) return <div style={{background: colors.green, height: "100vh", color: "white", display: "flex", justifyContent: "center", alignItems: "center"}}>Loading Profile...</div>

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "sans-serif", overflow: "hidden" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", flexShrink: 0, background: colors.green, color: "white", display: "flex", flexDirection: "column", padding: "30px 20px", boxSizing: "border-box" }}>
        
        {/* LOGO ADDED HERE */}
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        
        <div style={sidebarItem('Profile')} onClick={() => setActiveTab('Profile')}>My Profile</div>
        <div style={sidebarItem('Attendance')} onClick={() => setActiveTab('Attendance')}>Attendance Log</div>
        <div style={sidebarItem('Security')} onClick={() => setActiveTab('Security')}>Security Settings</div>

        <div style={{ marginTop: "auto", padding: "20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }} onClick={handleLogout}>
          <span>↪</span> Log Out
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: colors.beige, padding: "30px", display: "flex", flexDirection: "column" }}>
        
        {/* VIEW: MY PROFILE */}
        {activeTab === 'Profile' && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
            <h1 style={{ color: "#5a6955", margin: "0" }}>Employee Account</h1>
            
            <ProfileCard employee={employee} colors={colors} />

            <div style={{ display: "flex", gap: "20px", flex: 1 }}>
              <div style={{ flex: 1, background: colors.white, padding: "30px", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                <h2 style={{ color: "#5a6955", marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Job Details</h2>
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Date Hired</label><div style={{fontWeight:"bold", fontSize:"18px"}}>{employee?.DateHired}</div></div>
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Employee ID</label><div style={{fontWeight:"bold", fontSize:"18px"}}>{employee?.EmployeeID}</div></div>
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Shift Schedule</label><div style={{fontWeight:"bold", fontSize:"18px"}}>{employee?.ShiftSchedule} ({employee?.SchedulePattern})</div></div>
                
                {/* DISPLAY NEXT SHIFT */}
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Next Scheduled Shift</label><div style={{fontWeight:"bold", fontSize:"20px", color: colors.red}}>{employee?.NextShift || "Pending Assignment"}</div></div>
              </div>

              <div style={{ flex: 1, background: colors.white, padding: "30px", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                <h2 style={{ color: "#5a6955", marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Contact Information</h2>
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Contact Number</label><div style={{fontWeight:"bold", fontSize:"18px"}}>{employee?.User?.ContactNumber}</div></div>
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Email</label><div style={{fontWeight:"bold", fontSize:"18px"}}>{employee?.User?.Email}</div></div>
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Address</label><div style={{fontWeight:"bold", fontSize:"15px", lineHeight: "1.6", color: "#333"}}>{employee?.User?.Address || "Not provided"}</div></div>
                <div><label style={{display:"block", color:"#999", fontSize:"12px"}}>Date of Birth</label><div style={{fontWeight:"bold", fontSize:"18px"}}>{employee?.DateOfBirth}</div></div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: ATTENDANCE LOG */}
        {activeTab === 'Attendance' && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h1 style={{ color: "#5a6955", margin: 0 }}>My Attendance Log</h1>
              <button onClick={async () => { await refreshAttendance(employee?.EmployeeID); showSuccess('Data refreshed') }} style={{ background: "#FF9800", color: "white", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>REFRESH</button>
            </div>
            
            {/* CONTAINER WITH FLEX to ensure pagination stays at bottom */}
            <AttendanceTable
              attendanceLogs={attendanceLogs}
              todayRecord={todayRecord}
              canTimeIn={canTimeIn}
              handleTimeIn={handleTimeIn}
              handleTimeOut={handleTimeOut}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              colors={colors}
              PaginationControls={PaginationControls}
            />
          </div>
        )}

        {/* VIEW: SECURITY SETTINGS */}
        {activeTab === 'Security' && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", justifyContent: "flex-start", alignItems: "center" }}>
            <h1 style={{ color: "#5a6955", margin: "0", alignSelf: "flex-start" }}>Security Settings</h1>
            
            <div style={{ background: colors.white, padding: "25px", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.08)", width: "100%", maxWidth: "500px" }}>
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ color: "#5a6955", margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold" }}>Employee PIN</h3>
                <p style={{ color: "#666", margin: "0", fontSize: "13px", lineHeight: "1.5" }}>
                  4-6 digit numeric PIN for secure time in/out operations.
                </p>
              </div>
              
              <div style={{ background: personal.hasPIN ? "#E8F5E9" : "#FFF3E0", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: `2px solid ${personal.hasPIN ? "#4CAF50" : "#FF9800"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "28px", color: personal.hasPIN ? "#4CAF50" : "#FF9800", fontWeight: "bold" }}>
                    {personal.hasPIN ? '✓' : '•'}
                  </div>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "15px", color: personal.hasPIN ? "#2E7D32" : "#E65100" }}>
                      {personal.hasPIN ? 'PIN is Set' : 'No PIN Set'}
                    </div>
                    <div style={{ color: personal.hasPIN ? "#558B2F" : "#BF360C", fontSize: "12px", marginTop: "2px" }}>
                      {personal.hasPIN ? 'Secured and active' : 'Set a PIN to continue'}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => personal.openPINModal(personal.hasPIN ? 'change' : 'setup')}
                style={{ 
                  width: "100%", 
                  padding: "12px 20px", 
                  background: "#5a6955", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  fontWeight: "bold", 
                  cursor: "pointer", 
                  fontSize: "14px",
                  transition: "background 0.2s"
                }}
              >
                {personal.hasPIN ? 'Change PIN' : 'Set PIN'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* PIN MODAL */}
      {personal.showPINModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ background: colors.white, padding: "30px", borderRadius: "15px", width: "380px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
            <h2 style={{ color: "#5a6955", margin: "0 0 8px 0", fontSize: "22px", textAlign: "center" }}>
              {personal.pinMode === 'setup' ? 'Set Up Your PIN' : 'Change Your PIN'}
            </h2>
            <p style={{ color: "#999", margin: "0 0 20px 0", fontSize: "12px", textAlign: "center" }}>
              {personal.pinMode === 'setup' ? 'Create a 4-6 digit PIN for secure access' : 'Update your 4-6 digit PIN'}
            </p>
            
            {personal.pinMode === 'change' && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px", color: "#5a6955", fontSize: "13px" }}>Current PIN</label>
                <input
                  type="password"
                  placeholder="Enter current PIN"
                  value={personal.currentPIN}
                  onChange={(e) => personal.setCurrentPIN(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
            )}

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px", color: "#5a6955", fontSize: "13px" }}>New PIN (4-6 digits)</label>
              <input
                type="password"
                placeholder="Enter new PIN"
                value={personal.newPIN}
                onChange={(e) => personal.setNewPIN(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "6px", color: "#5a6955", fontSize: "13px" }}>Confirm PIN</label>
              <input
                type="password"
                placeholder="Confirm new PIN"
                value={personal.confirmPIN}
                onChange={(e) => personal.setConfirmPIN(e.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
              />
            </div>

            {personal.pinError && (
              <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "12px", fontWeight: "bold", textAlign: "center" }}>
                {personal.pinError}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={personal.closePINModal}
                disabled={personal.pinLoading}
                style={{ flex: 1, padding: "10px", background: "#ddd", color: "#333", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: personal.pinLoading ? "default" : "pointer", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                onClick={() => personal.handleSavePIN(() => showSuccess(personal.pinMode === 'setup' ? 'PIN set successfully!' : 'PIN changed successfully!'))}
                disabled={personal.pinLoading}
                style={{ flex: 1, padding: "10px", background: personal.pinLoading ? "#999" : "#5a6955", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: personal.pinLoading ? "default" : "pointer", fontSize: "14px", transition: "background 0.2s" }}
              >
                {personal.pinLoading ? 'Saving...' : personal.pinMode === 'setup' ? 'Set PIN' : 'Update PIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT END REMINDER */}
      {showShiftEndReminder && (
        <div style={{ 
          position: 'fixed', 
          top: '80px', 
          right: '20px', 
          background: '#FFB74D', 
          color: '#E65100', 
          padding: '15px 20px', 
          borderRadius: '8px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
          zIndex: 100,
          fontWeight: 'bold',
          maxWidth: '300px'
        }}>
          <div style={{ marginBottom: '8px' }}>Reminder: Shift Ending Soon</div>
          <div style={{ fontSize: '13px', color: '#BF360C' }}>
            {minutesUntilShiftEnd > 0 ? `${minutesUntilShiftEnd} minutes remaining` : 'Shift has ended - please time out'}
          </div>
        </div>
      )}

      {/* INACTIVE EMPLOYEE NOTICE */}
      {employee?.EmployeeStatus !== 'Active' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#d32f2f',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 100
        }}>
          You are marked as {employee?.EmployeeStatus}. Contact HR to reactivate your account.
        </div>
      )}

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={clearNotification}
      />
    </div>
  )
}

export default PersonalView