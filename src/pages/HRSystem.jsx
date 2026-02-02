import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/wm-logo.svg' 
import { Notification } from '../components/Notification'
import EmployeeForm from '../components/EmployeeForm'

function HRSystem() {
  const navigate = useNavigate()
  
  // --- ROLES CONFIGURATION ---
  const ADMIN_ROLES = ['HR Admin', 'Inventory Admin', 'Sales Admin']
  const EMPLOYEE_ROLES = ['Barista', 'Cashier', 'Kitchen Staff', 'Server']
  const ALL_ROLES = [...ADMIN_ROLES, ...EMPLOYEE_ROLES]

  // --- STATE VARIABLES ---
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState(null)
  
  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('Name') 
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const searchContainerRef = useRef(null)

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8 

  const [archivePage, setArchivePage] = useState(1)
  const archivePerPage = 5

  const [attendancePage, setAttendancePage] = useState(1)
  const attendancePerPage = 5

  // Modals
  const [modals, setModals] = useState({
    add: false, update: false, archive: false, archiveLog: false, attendance: false,
    confirmation: false, success: false
  })

  // Data Holders
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', address: '', contact: '', dob: '',
    email: '', password: '', role: 'Barista', status: 'Active', 
    shiftStart: '08:00 AM', shiftEnd: '05:00 PM', 
    dateHired: new Date().toISOString().split('T')[0],
    schedulePattern: 'Saturday' 
  })
  
  const [archiveReason, setArchiveReason] = useState('')
  const [archiveLogs, setArchiveLogs] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [attendanceSearchDate, setAttendanceSearchDate] = useState('')
  const [notification, setNotification] = useState({ message: '', type: 'success' })
  const [confirmationAction, setConfirmationAction] = useState(null)

  // --- 1. INITIAL LOAD ---
  useEffect(() => { 
    const checkSecurity = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }
        const { data } = await supabase.from('User').select('RoleName').eq('UserID', user.id).maybeSingle()
        if (!data || !ADMIN_ROLES.includes(data.RoleName)) { navigate('/personal-view') }
    }
    checkSecurity()
    fetchEmployees() 
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowFilterMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchContainerRef])

  useEffect(() => {
    let result = employees
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      result = result.filter(e => {
        if (filterCategory === 'Name') {
          return (e.User?.FirstName?.toLowerCase().includes(lowerTerm) || e.User?.LastName?.toLowerCase().includes(lowerTerm))
        } else if (filterCategory === 'ID') {
          return e.EmployeeID?.toString().includes(lowerTerm)
        } else if (filterCategory === 'Role') {
          return e.User?.RoleName?.toLowerCase().includes(lowerTerm)
        } else if (filterCategory === 'Status') {
          return e.EmployeeStatus?.toLowerCase().includes(lowerTerm)
        } else if (filterCategory === 'Date Hired') {
          return e.DateHired?.includes(searchTerm) 
        }
        return false
      })
    }
    setFilteredEmployees(result)
    setCurrentPage(1) 
  }, [employees, searchTerm, filterCategory])

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from('Employee')
      .select('*, User(*)') 
      .neq('EmployeeStatus', 'Inactive') 
      .order('EmployeeID', { ascending: true })

    if (error) console.error(error)
    else {
      setEmployees(data)
      setFilteredEmployees(data)
    }
  }

  // --- HELPERS ---
  const fetchRoleId = async (roleName) => {
    const { data, error } = await supabase
        .from('UserRole')
        .select('UserRoleID')
        .eq('RoleName', roleName)
        .maybeSingle()
    
    if (error) console.error("Error fetching role:", error)
    if (!data) return 1
    return data.UserRoleID
  }

  // --- PAGINATION ---
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  const PaginationControls = ({ total, page, setPage, perPage }) => {
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "15px", gap: "15px", alignItems: "center", color: "#888", fontWeight: "bold", marginTop: "auto", borderTop: "1px solid #f0f0f0" }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
          <span key={num} onClick={() => setPage(num)} style={{ cursor: "pointer", color: page === num ? "#333" : "#ccc", transform: page === num ? "scale(1.2)" : "scale(1)", fontSize: "16px" }}>{num}</span>
        ))}
        <span onClick={() => setPage(p => Math.min(p + 1, totalPages))} style={{ cursor: "pointer", fontSize: "18px" }}>&gt;</span>
      </div>
    )
  }

  // --- ADD EMPLOYEE ---
  const prepareAdd = () => {
    setFormData({
      firstName: '', lastName: '', address: '', contact: '', dob: '',
      email: '', password: '', role: 'Barista', status: 'Active', 
      shiftStart: '08:00 AM', shiftEnd: '05:00 PM', 
      dateHired: new Date().toISOString().split('T')[0],
      schedulePattern: 'Saturday' 
    })
    setModals({...modals, add: true})
  }

  const executeAddEmployee = async () => {
    const correctRoleId = await fetchRoleId(formData.role)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email, password: formData.password,
      options: { data: { full_name: `${formData.firstName} ${formData.lastName}`, role: formData.role } }
    })
    
    if (authError) { setNotification({ message: "Auth Error: " + authError.message, type: 'error' }); return }

    const { data: userData, error: userError } = await supabase
      .from('User')
      .upsert([{ 
        UserID: authData.user ? authData.user.id : undefined,
        FirstName: formData.firstName, LastName: formData.lastName, Address: formData.address, 
        ContactNumber: formData.contact, RoleName: formData.role, 
        Email: formData.email, Password: formData.password, 
        UserRoleID: correctRoleId
      }], { onConflict: 'UserID' })
      .select()

    if (userError) { setNotification({ message: "Database User Error: " + userError.message, type: 'error' }); return }

    const fullShift = `${formData.shiftStart} - ${formData.shiftEnd}`
    const { error: empError } = await supabase.from('Employee').insert([{
        UserID: userData[0].UserID, DateHired: formData.dateHired, ShiftSchedule: fullShift,
        EmployeeStatus: formData.status, DateOfBirth: formData.dob,
        SchedulePattern: formData.schedulePattern 
    }])

    if (empError) setNotification({ message: "Employee Error: " + empError.message, type: 'error' })
    else showSuccess("Account Created & Employee Added!")
  }

  // --- UPDATE EMPLOYEE ---
  const prepareUpdate = () => {
    if (!selectedEmpId) { setNotification({ message: 'Select an employee first', type: 'warning' }); return }
    const emp = employees.find(e => e.EmployeeID === selectedEmpId)
    const [start, end] = emp.ShiftSchedule ? emp.ShiftSchedule.split(' - ') : ["08:00 AM", "05:00 PM"]

    setFormData({
      firstName: emp.User?.FirstName, lastName: emp.User?.LastName, address: emp.User?.Address,
      contact: emp.User?.ContactNumber, dob: emp.DateOfBirth, 
      email: emp.User?.Email || '', password: emp.User?.Password || '',
      role: emp.User?.RoleName, status: emp.EmployeeStatus, 
      shiftStart: start, shiftEnd: end, dateHired: emp.DateHired,
      schedulePattern: emp.SchedulePattern || 'Saturday'
    })
    setModals({...modals, update: true})
  }

  const executeUpdateEmployee = async () => {
    const emp = employees.find(e => e.EmployeeID === selectedEmpId)
    const fullShift = `${formData.shiftStart} - ${formData.shiftEnd}`
    const correctRoleId = await fetchRoleId(formData.role)

    await supabase.from('User').update({
        FirstName: formData.firstName, LastName: formData.lastName, Address: formData.address, 
        ContactNumber: formData.contact, RoleName: formData.role, Email: formData.email, Password: formData.password,
        UserRoleID: correctRoleId 
    }).eq('UserID', emp.UserID)

    await supabase.from('Employee').update({
        ShiftSchedule: fullShift, EmployeeStatus: formData.status, 
        DateOfBirth: formData.dob, DateHired: formData.dateHired,
        SchedulePattern: formData.schedulePattern
    }).eq('EmployeeID', selectedEmpId)

    showSuccess("Employee Updated Successfully!")
  }

  // --- ARCHIVE & LOGS ---
  const prepareArchive = () => {
    if (!selectedEmpId) { setNotification({ message: 'Select an employee first', type: 'warning' }); return }
    setArchiveReason(''); setModals({...modals, archive: true})
  }
  
  const executeArchive = async () => {
    if (!archiveReason) { setNotification({ message: 'Reason is required', type: 'warning' }); return }
    await supabase.from('Employee').update({ EmployeeStatus: 'Inactive' }).eq('EmployeeID', selectedEmpId);
    const emp = employees.find(e => e.EmployeeID === selectedEmpId);
    await supabase.from('ArchiveLog').insert([{ EmployeeID: selectedEmpId, UserID: emp.UserID, ArchivedDate: new Date().toISOString().split('T')[0], ReasonArchived: archiveReason }]);
    showSuccess("Employee Archived.")
  }

  const openArchiveLogModal = async () => {
    const { data } = await supabase.from('ArchiveLog').select('*, EmployeeID, Employee(User(FirstName, LastName))').order('ArchivedDate', { ascending: false });
    setArchiveLogs(data || []); setArchivePage(1); setModals({...modals, archiveLog: true})
  }

  const executeRestore = async (logID, empID) => {
    const { error: updateError } = await supabase.from('Employee').update({ EmployeeStatus: 'Active' }).eq('EmployeeID', empID);
    if (updateError) { setNotification({ message: 'Error restoring: ' + updateError.message, type: 'error' }); return }
    await supabase.from('ArchiveLog').delete().eq('LogID', logID);
    setNotification({ message: 'Employee Restored!', type: 'success' }); fetchEmployees(); setModals({...modals, archiveLog: false})
  }

  // --- ATTENDANCE ---
  const openAttendanceModal = async () => {
    if (!selectedEmpId) { setNotification({ message: 'Please select an employee first.', type: 'warning' }); return }
    const { data } = await supabase.from('Attendance').select('*').eq('EmployeeID', selectedEmpId).order('Date', { ascending: false });
    setAttendanceLogs(data || []); setAttendancePage(1); setModals({...modals, attendance: true})
  }

  // --- HELPERS ---
  const triggerConfirmation = (action) => { setConfirmationAction(() => action); setModals(prev => ({...prev, confirmation: true})) }
  const confirmAction = () => { if (confirmationAction) confirmationAction() }
  
  const showSuccess = (msg) => { 
    fetchEmployees()
    setNotification({ message: msg, type: 'success' })
    setModals(prev => ({ ...prev, add: false, update: false, archive: false, confirmation: false })) 
  }

  const showError = (msg) => setNotification({ message: msg, type: 'error' })

  // --- STYLES ---
  const colors = { green: "#6B7C65", beige: "#E8DCC6", purple: "#7D4E99", darkGreen: "#4A5D4B", red: "#D9534F", blue: "#337AB7" }
  const btnStyle = { padding: "8px 16px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", color: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }
  const inputStyle = { width: "100%", padding: "10px", margin: "5px 0", borderRadius: "5px", border: "1px solid #ccc", boxSizing: "border-box" }
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const confirmOverlay = { ...modalOverlay, zIndex: 2000 } 
  const modalContent = { background: "white", padding: "25px", borderRadius: "15px", width: "550px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }
  const pillBtn = (active) => ({ padding: "5px 15px", borderRadius: "20px", border: "1px solid #666", background: active ? colors.green : "white", color: active ? "white" : "black", cursor: "pointer", fontSize: "12px", fontWeight: "bold" })

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/inventory-system')}>Inventory System</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/sales-system')}>Sales System</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}}>Human Resource ➤</div>
        <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: colors.beige, padding: "30px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: colors.darkGreen }}>Employee Management</h1>
          <button style={{...btnStyle, background: colors.purple}} onClick={openAttendanceModal}>VIEW ATTENDANCE LOG</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", position: "relative" }} ref={searchContainerRef}>
          <input placeholder={`🔍 Search by ${filterCategory}...`} style={{ padding: "8px", borderRadius: "20px", border: "1px solid #ccc", width: "250px", cursor: "pointer" }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setShowFilterMenu(true)} />
          {showFilterMenu && (
            <div style={{ position: "absolute", top: "110%", left: 0, background: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", zIndex: 50, border: "1px solid #ddd", width: "380px" }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold", color: "#555" }}>Filter by Category:</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {['ID', 'Name', 'Role', 'Status', 'Date Hired'].map(cat => (
                  <button key={cat} style={pillBtn(filterCategory === cat)} onClick={() => { setFilterCategory(cat); setShowFilterMenu(false) }}>{cat.toUpperCase()}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button style={{...btnStyle, background: colors.darkGreen}} onClick={prepareAdd}>ADD</button>
          <button style={{...btnStyle, background: "#d3af37"}} onClick={prepareUpdate}>UPDATE</button>
          <button style={{...btnStyle, background: colors.red}} onClick={prepareArchive}>ARCHIVE</button>
          <button style={{...btnStyle, background: "#337AB7"}} onClick={openArchiveLogModal}>VIEW ARCHIVE LOG</button>
        </div>

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
          <PaginationControls total={filteredEmployees.length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
        </div>

        {/* MODALS */}
        {modals.confirmation && (
          <div style={confirmOverlay}>
            <div style={{...modalContent, width: "350px", textAlign: "center", border: "2px solid #444", background: "#fff"}}>
              <h3 style={{marginTop: 0}}>Are you sure?</h3>
              <p>Do you want to proceed with this action?</p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
                <button onClick={() => setModals({...modals, confirmation: false})} style={{...btnStyle, background: "#ccc", color: "#333"}}>Cancel</button>
                <button onClick={confirmAction} style={{...btnStyle, background: colors.green}}>Confirm</button>
              </div>
            </div>
          </div>
        )}

        {(modals.add || modals.update) && (
          <div style={modalOverlay}>
            <EmployeeForm
                formData={formData}
                setFormData={setFormData}
                ALL_ROLES={ALL_ROLES}
                modals={modals}
                setModals={setModals}
                triggerConfirmation={triggerConfirmation}
                executeAddEmployee={executeAddEmployee}
                executeUpdateEmployee={executeUpdateEmployee}
                setNotification={setNotification}
                showError={showError}
                inputStyle={inputStyle}
                btnStyle={btnStyle}
                colors={colors}
            />
          </div>
        )}

        {modals.archive && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h2 style={{ color: colors.red, marginTop: 0 }}>Archive Employee</h2>
              <textarea style={{ ...inputStyle, height: "100px", resize: "none" }} placeholder="Reason for Archiving (Required)" value={archiveReason} onChange={e => setArchiveReason(e.target.value)} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button onClick={() => setModals({...modals, archive: false})} style={{...btnStyle, background: "#ccc", color: "#333"}}>Cancel</button>
                <button onClick={() => triggerConfirmation(executeArchive)} style={{...btnStyle, background: colors.red}}>Confirm Archive</button>
              </div>
            </div>
          </div>
        )}

        {modals.archiveLog && (
          <div style={modalOverlay}>
            <div style={{...modalContent, width: "800px", display: "flex", flexDirection: "column", height: "80vh"}}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h2 style={{ margin: 0, color: colors.blue }}>Archive Log</h2>
                <button onClick={() => setModals({...modals, archiveLog: false})} style={{...btnStyle, background: "#ccc", color: "black", padding: "5px 10px"}}>Close</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: colors.blue, color: "white", position: "sticky", top: 0 }}>
                    <tr><th>LogID</th><th>Employee Name</th><th>Archived Date</th><th>Reason</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {paginate(archiveLogs, archivePage, archivePerPage).map(log => (
                      <tr key={log.LogID} style={{ borderBottom: "1px solid #ddd", textAlign: "center", height: "40px" }}>
                        <td>{log.LogID}</td>
                        <td>{log.Employee?.User?.FirstName} {log.Employee?.User?.LastName}</td>
                        <td>{log.ArchivedDate}</td>
                        <td>{log.ReasonArchived}</td>
                        <td><button onClick={() => executeRestore(log.LogID, log.EmployeeID)} style={{ padding: "5px 15px", background: "#337AB7", color: "white", border: "none", borderRadius: "15px", cursor: "pointer", fontWeight: "bold" }}>Restore</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls total={archiveLogs.length} page={archivePage} setPage={setArchivePage} perPage={archivePerPage} />
            </div>
          </div>
        )}
        
        {modals.attendance && (
          <div style={modalOverlay}>
             <div style={{...modalContent, width: "650px", display: "flex", flexDirection: "column", height: "70vh"}}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h2 style={{ margin: 0 }}>Attendance Log</h2>
                <button onClick={() => setModals({...modals, attendance: false})} style={{...btnStyle, background: "#ccc", color: "black", padding: "5px 10px"}}>Back</button>
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
export default HRSystem