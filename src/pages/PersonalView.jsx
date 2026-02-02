import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/wm-logo.svg'
import { Notification } from '../components/Notification'

function PersonalView() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Profile') 
  
  // Data States
  const [employee, setEmployee] = useState(null)
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [todayRecord, setTodayRecord] = useState(null) 
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false) 
  const [notification, setNotification] = useState({ message: '', type: 'success' })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7

  useEffect(() => {
    fetchPersonalData()
  }, [])

  async function fetchPersonalData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    // 1. CHECK IF ADMIN
    const ADMIN_ROLES = ['HR Admin', 'Inventory Admin', 'Sales Admin']
    const { data: userData } = await supabase.from('User').select('RoleName').eq('UserID', user.id).maybeSingle()
    
    if (userData && ADMIN_ROLES.includes(userData.RoleName)) {
        setIsAdmin(true)
    }

    // 2. Fetch Employee Details
    const { data: empData, error: empError } = await supabase
      .from('Employee')
      .select('*, User(*)')
      .eq('UserID', user.id)
      .maybeSingle()

    if (empError) {
      setNotification({ message: "Error fetching profile.", type: 'error' })
      return
    }
    
    if (!empData) {
        if(userData && ADMIN_ROLES.includes(userData.RoleName)) {
            setNotification({ message: "You are an Admin, but you don't have an Employee Record yet. Please go to HR System -> Add Employee and create a profile for yourself.", type: 'warning' })
            setTimeout(() => navigate('/admin-menu'), 3000)
            return
        } else {
            setNotification({ message: "Profile not found.", type: 'error' })
            return
        }
    }

    setEmployee(empData)
    fetchAttendance(empData.EmployeeID)
    setLoading(false)
  }

  async function fetchAttendance(empId) {
    const { data } = await supabase
      .from('Attendance')
      .select('*')
      .eq('EmployeeID', empId)
      .order('Date', { ascending: false })

    setAttendanceLogs(data || [])
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
    const todayLog = data.find(log => log.Date === todayStr)
    setTodayRecord(todayLog || null)
  }

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
  async function handleTimeIn() {
    const todayStr = new Date().toLocaleDateString('en-CA')
    const now = new Date().toISOString()

    const { error } = await supabase.from('Attendance').insert([{
      EmployeeID: employee.EmployeeID,
      Date: todayStr,
      TimeIn: now
    }])

    if (error) {
      setNotification({ message: error.message, type: 'error' })
    } else {
      setNotification({ message: "Timed In Successfully!", type: 'success' })
      fetchAttendance(employee.EmployeeID)
    }
  }

  async function handleTimeOut() {
    if (!todayRecord) return
    const now = new Date().toISOString()
    
    // 1. Update Time Out
    const { error } = await supabase.from('Attendance').update({ TimeOut: now }).eq('AttendanceID', todayRecord.AttendanceID)
    if (error) {
      setNotification({ message: error.message, type: 'error' })
      return
    }

    // 2. CALCULATE & UPDATE NEXT SHIFT
    let nextDateMsg = ""
    if (employee.SchedulePattern) {
        const nextDate = getNextDateForDay(employee.SchedulePattern)
        if (nextDate) {
            await supabase.from('Employee').update({ NextShift: nextDate }).eq('EmployeeID', employee.EmployeeID)
            // Update local state immediately
            setEmployee(prev => ({...prev, NextShift: nextDate}))
            nextDateMsg = ` See you on ${nextDate}!`
        }
    }

    setNotification({ message: "Timed Out Successfully!" + nextDateMsg, type: 'success' })
    fetchAttendance(employee.EmployeeID)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
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

  // --- STYLES ---
  const colors = { green: "#6B7C65", beige: "#E8DCC6", white: "#fff", text: "#333", red: "#FF6B6B" }
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
            
            <div style={{ background: colors.white, padding: "25px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#6B7C65", display: "flex", justifyContent: "center", alignItems: "center", color: "white", fontSize: "30px" }}>
                {employee?.User?.FirstName?.charAt(0)}
              </div>
              <div>
                <h1 style={{ margin: 0, color: "#4A5D4B", fontSize: "24px" }}>{employee?.User?.FirstName?.charAt(0).toUpperCase() + employee?.User?.FirstName?.slice(1)} {employee?.User?.LastName?.charAt(0).toUpperCase() + employee?.User?.LastName?.slice(1)}</h1>
                <p style={{ margin: "5px 0 0", color: "#888", fontSize: "14px" }}>{employee?.User?.RoleName}</p>
              </div>
            </div>

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
            <h1 style={{ color: "#5a6955", margin: "0 0 20px 0" }}>My Attendance Log</h1>
            
            {/* CONTAINER WITH FLEX to ensure pagination stays at bottom */}
            <div style={{ background: colors.white, borderRadius: "20px", flex: 1, display: "flex", flexDirection: "column", padding: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", minHeight: 0 }}>
              
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#6B7C65", color: "white", position: "sticky", top: 0 }}>
                    <tr>
                      <th style={{ padding: "15px", borderRadius: "10px 0 0 10px" }}>Date</th>
                      <th style={{ padding: "15px" }}>Time In</th>
                      <th style={{ padding: "15px" }}>Time Out</th>
                      <th style={{ padding: "15px", borderRadius: "0 10px 10px 0" }}>Hours Worked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ROW 1: TODAY'S ACTION (Only if it's the correct day) */}
                    {!todayRecord && (
                      <tr style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "60px", background: canTimeIn() ? "#fff" : "#f9f9f9" }}>
                        <td style={{color: canTimeIn() ? "black" : "#999"}}>{new Date().toLocaleDateString('en-CA')}</td>
                        <td>
                          {canTimeIn() ? (
                            <button onClick={handleTimeIn} style={{ padding: "8px 20px", background: colors.red, color: "white", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>
                              TIME IN
                            </button>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>
                               Scheduled: {employee?.NextShift || "None"}
                            </span>
                          )}
                        </td>
                        <td>-</td>
                        <td>-</td>
                      </tr>
                    )}

                    {/* EXISTING LOGS */}
                    {paginate(attendanceLogs, currentPage, itemsPerPage).map(log => (
                      <tr key={log.AttendanceID} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "60px" }}>
                        <td>{log.Date}</td>
                        <td>{new Date(log.TimeIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                        <td>
                          {(!log.TimeOut && log.Date === new Date().toLocaleDateString('en-CA')) ? (
                             <button onClick={handleTimeOut} style={{ padding: "8px 20px", background: colors.red, color: "white", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>
                               TIME OUT
                             </button>
                          ) : (
                             log.TimeOut ? new Date(log.TimeOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'
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
          </div>
        )}

      </div>

      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: 'success' })} 
      />
    </div>
  )
}

export default PersonalView