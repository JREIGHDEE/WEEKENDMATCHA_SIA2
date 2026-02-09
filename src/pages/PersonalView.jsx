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

  useEffect(() => {
    fetchPersonalData(navigate, setNotification)
  }, [])

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
    padding: "15px 20px", cursor: "pointer", fontWeight: "bold",
    background: activeTab === name ? "#5a6955" : "transparent",
    borderRadius: activeTab === name ? "0 25px 25px 0" : "0"
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
              <div style={{ flex: 1, background: colors.white, padding: "30px", borderRadius: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                <h2 style={{ color: "#5a6955", marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Job Details</h2>
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Date Hired</label><div style={{fontWeight:"bold", fontSize:"18px"}}>{employee?.DateHired}</div></div>
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Employee ID</label><div style={{fontWeight:"bold", fontSize:"18px"}}>{employee?.EmployeeID}</div></div>
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Shift Schedule</label><div style={{fontWeight:"bold", fontSize:"18px"}}>{employee?.ShiftSchedule} ({employee?.SchedulePattern})</div></div>
                
                {/* DISPLAY NEXT SHIFT */}
                <div style={{ marginBottom: "20px" }}><label style={{display:"block", color:"#999", fontSize:"12px"}}>Next Scheduled Shift</label><div style={{fontWeight:"bold", fontSize:"20px", color: colors.red}}>{employee?.NextShift || "Pending Assignment"}</div></div>
              </div>

              <div style={{ flex: 1, background: colors.white, padding: "30px", borderRadius: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
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
            <div style={{ background: colors.white, borderRadius: "20px", flex: 1, display: "flex", flexDirection: "column", padding: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", minHeight: 0 }}>
              
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
          </div>
        )}

      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={clearNotification}
      />
    </div>
  )
}

export default PersonalView