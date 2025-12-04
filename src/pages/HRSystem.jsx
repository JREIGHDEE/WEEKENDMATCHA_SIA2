import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/wm-logo.svg' // <-- Update the filename to yours!

// --- HELPER: TIME PICKER ---
const TimePicker = ({ label, value, onChange }) => {
  const [time, setTime] = useState(value || "12:00 AM")
  useEffect(() => { setTime(value || "12:00 AM") }, [value])

  const [hour, rest] = time.split(':')
  const [minute, ampm] = rest ? rest.split(' ') : ["00", "AM"]

  const updateTime = (h, m, ap) => {
    const newTime = `${h}:${m} ${ap}`
    setTime(newTime)
    onChange(newTime)
  }

  const inputStyle = { padding: "5px", borderRadius: "5px", border: "1px solid #ccc", marginRight: "5px" }

  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: "10px" }}>
      <span style={{ fontSize: "12px", fontWeight: "bold", color: "#555", marginBottom: "5px" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center" }}>
        <select style={inputStyle} value={hour} onChange={(e) => updateTime(e.target.value, minute, ampm)}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h < 10 ? `0${h}` : `${h}`}>{h}</option>
          ))}
        </select>
        :
        <select style={inputStyle} value={minute} onChange={(e) => updateTime(hour, e.target.value, ampm)}>
          {["00", "15", "30", "45"].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={inputStyle} value={ampm} onChange={(e) => updateTime(hour, minute, e.target.value)}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
}

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
  const [successMessage, setSuccessMessage] = useState('')
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

  // --- NEW HELPER: FETCH ROLE ID ---
  const fetchRoleId = async (roleName) => {
    console.log("Searching for Role:", roleName)
    const { data, error } = await supabase
        .from('UserRole')
        .select('UserRoleID')
        .eq('RoleName', roleName)
        .maybeSingle() // Use maybeSingle to avoid crashes
    
    if (error) console.error("Error fetching role:", error)
    
    if (!data) {
        console.warn(`Role '${roleName}' not found in UserRole table. Defaulting to 1.`)
        return 1
    }
    console.log("Found Role ID:", data.UserRoleID)
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

  // --- 2. ADD EMPLOYEE ---
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

  const handleAddConfirmation = (e) => {
    e.preventDefault()
    triggerConfirmation(() => executeAddEmployee())
  }

  const executeAddEmployee = async () => {
    // 1. Get Correct Role ID
    const correctRoleId = await fetchRoleId(formData.role)

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email, password: formData.password,
      options: { data: { full_name: `${formData.firstName} ${formData.lastName}`, role: formData.role } }
    })
    
    if (authError) { alert("Auth Error: " + authError.message); return }

    // 3. Create/Update Public User (Using UPSERT to prevent conflicts)
    const { data: userData, error: userError } = await supabase
      .from('User')
      .upsert([{ 
        UserID: authData.user ? authData.user.id : undefined,
        FirstName: formData.firstName, LastName: formData.lastName, Address: formData.address, 
        ContactNumber: formData.contact, RoleName: formData.role, 
        Email: formData.email, Password: formData.password, 
        UserRoleID: correctRoleId // Saving the correct ID
      }], { onConflict: 'UserID' }) // If UserID exists, update it instead of failing
      .select()

    if (userError) return alert("Database User Error: " + userError.message)

    // 4. Create Employee
    const fullShift = `${formData.shiftStart} - ${formData.shiftEnd}`
    const { error: empError } = await supabase.from('Employee').insert([{
        UserID: userData[0].UserID, DateHired: formData.dateHired, ShiftSchedule: fullShift,
        EmployeeStatus: formData.status, DateOfBirth: formData.dob,
        SchedulePattern: formData.schedulePattern 
    }])

    if (empError) alert("Employee Error: " + empError.message)
    else {
      showSuccess("Account Created & Employee Added!")
    }
  }

  // --- 3. UPDATE EMPLOYEE ---
  const prepareUpdate = () => {
    if (!selectedEmpId) return alert("Select an employee first")
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

  const handleUpdateConfirmation = (e) => {
    e.preventDefault()
    triggerConfirmation(() => executeUpdateEmployee())
  }

  const executeUpdateEmployee = async () => {
    const emp = employees.find(e => e.EmployeeID === selectedEmpId)
    const fullShift = `${formData.shiftStart} - ${formData.shiftEnd}`
    
    // Fetch ID again in case role changed
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

  // --- 4. ARCHIVE & LOGS ---
  const prepareArchive = () => { if (!selectedEmpId) return alert("Select an employee first"); setArchiveReason(''); setModals({...modals, archive: true}) }
  
  const executeArchive = async () => {
    if (!archiveReason) return alert("Reason is required");
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
    if(!empID) return alert("Error: Could not find Employee ID.");
    const { error: updateError } = await supabase.from('Employee').update({ EmployeeStatus: 'Active' }).eq('EmployeeID', empID);
    if (updateError) { alert("Error restoring: " + updateError.message); return }
    const { error: deleteError } = await supabase.from('ArchiveLog').delete().eq('LogID', logID);
    if (deleteError) { alert("Error deleting log: " + deleteError.message); return }
    alert("Employee Restored!"); setArchiveLogs(prev => prev.filter(log => log.LogID !== logID)); fetchEmployees() 
  }

  // --- 5. ATTENDANCE ---
  const openAttendanceModal = async () => {
    if (!selectedEmpId) { alert("⚠️ Please select an employee from the list first to view their attendance."); return }
    const { data } = await supabase.from('Attendance').select('*').eq('EmployeeID', selectedEmpId).order('Date', { ascending: false });
    setAttendanceLogs(data || []); setAttendancePage(1); setAttendanceSearchDate(''); setModals({...modals, attendance: true})
  }
  const filterAttendance = () => {
    if(!attendanceSearchDate) return openAttendanceModal();
    const filtered = attendanceLogs.filter(log => log.Date === attendanceSearchDate);
    setAttendanceLogs(filtered); setAttendancePage(1)
  }

  // --- 6. DEBUG RESET ---
  const handleHardReset = async () => {
    if (!window.confirm("⚠️ DANGER: This will delete ALL Attendance Records, Archive Logs, and Employee Data.\n\nThis is for testing purposes only. Are you sure?")) return;
    await supabase.from('Attendance').delete().neq('AttendanceID', 0);
    await supabase.from('ArchiveLog').delete().neq('LogID', 0);
    const { error } = await supabase.from('Employee').delete().neq('EmployeeID', 0);
    await supabase.from('User').delete().neq('RoleName', 'Super Admin'); 
    if (error) alert("Error resetting: " + error.message)
    else { alert("♻️ System Reset Complete."); fetchEmployees(); }
  }

  // --- HELPERS ---
  const triggerConfirmation = (action) => { setConfirmationAction(() => action); setModals(prev => ({...prev, confirmation: true})) }
  const confirmAction = () => { if (confirmationAction) confirmationAction() }
  
  const showSuccess = (msg) => { 
    fetchEmployees()
    setSuccessMessage(msg)
    setModals(prev => ({
        ...prev, 
        add: false, 
        update: false, 
        archive: false, 
        confirmation: false, 
        success: true 
    })) 
  }

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

        {/* LOGO ADDED HERE */}
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>

        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "rgba(255,255,255,0.2)" }} onClick={() => navigate('/personal-view')}>👤 My Personal View</div>
        <div style={{borderTop: "1px solid rgba(255,255,255,0.3)", margin: "10px 0"}}></div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/inventory-system')}>Inventory System</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/sales-system')}>Sales System</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}}>Human Resource ➤</div>
        <div onClick={handleHardReset} style={{ marginTop: "20px", padding: "10px", background: "rgba(200, 0, 0, 0.5)", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", textAlign: "center", fontSize: "12px", color: "#ffdada" }}>⚠️ RESET DATA</div>
        <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: colors.beige, padding: "30px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* HEADER & FILTER */}
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

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button style={{...btnStyle, background: colors.darkGreen}} onClick={prepareAdd}>ADD</button>
          <button style={{...btnStyle, background: "#d3af37"}} onClick={prepareUpdate}>UPDATE</button>
          <button style={{...btnStyle, background: colors.red}} onClick={prepareArchive}>ARCHIVE</button>
          <button style={{...btnStyle, background: "#337AB7"}} onClick={openArchiveLogModal}>VIEW ARCHIVE LOG</button>
        </div>

        {/* TABLE */}
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

        {modals.success && (
          <div style={confirmOverlay}>
            <div style={{...modalContent, width: "300px", textAlign: "center"}}>
              <h1 style={{ fontSize: "50px", margin: "0" }}>✅</h1><h3>Success!</h3><p>{successMessage}</p>
              <button onClick={() => setModals({...modals, success: false})} style={{...btnStyle, background: colors.green, marginTop: "20px"}}>Okay</button>
            </div>
          </div>
        )}

        {(modals.add || modals.update) && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h2 style={{ marginTop: 0 }}>{modals.add ? "Add Employee" : "Update Employee"}</h2>
              <form onSubmit={modals.add ? handleAddConfirmation : handleUpdateConfirmation}>
                <h4 style={{ margin: "10px 0", borderBottom: "1px solid #eee" }}>Personal Information</h4>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input style={inputStyle} placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                  <input style={inputStyle} placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                </div>
                <input style={inputStyle} placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <input style={inputStyle} placeholder="Contact" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                  <input type="date" style={inputStyle} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>
                <h4 style={{ margin: "15px 0 10px", borderBottom: "1px solid #eee" }}>Account Details</h4>
                <input style={inputStyle} placeholder="Email (For Login)" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <input style={inputStyle} placeholder="Password" type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                <h4 style={{ margin: "15px 0 10px", borderBottom: "1px solid #eee" }}>Job Details</h4>
                <div style={{ display: "flex", gap: "10px" }}>
                   <div style={{flex: 1}}>
                     <label style={{fontSize:"12px", fontWeight:"bold"}}>Role</label>
                     <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                       {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                   </div>
                   <div style={{flex: 1}}>
                     <label style={{fontSize:"12px", fontWeight:"bold"}}>Status</label>
                     <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                       <option value="Active">Active</option> <option value="On Leave">On Leave</option> <option value="Inactive">Inactive</option>
                     </select>
                   </div>
                </div>
                <input type="date" style={inputStyle} value={formData.dateHired} onChange={e => setFormData({...formData, dateHired: e.target.value})} />
                <label style={{ fontSize: "12px", fontWeight: "bold", marginTop: "10px", display: "block" }}>Recurring Schedule Day</label>
                <select style={inputStyle} value={formData.schedulePattern} onChange={e => setFormData({...formData, schedulePattern: e.target.value})}>
                    <option value="Monday">Every Monday</option>
                    <option value="Tuesday">Every Tuesday</option>
                    <option value="Wednesday">Every Wednesday</option>
                    <option value="Thursday">Every Thursday</option>
                    <option value="Friday">Every Friday</option>
                    <option value="Saturday">Every Saturday</option>
                    <option value="Sunday">Every Sunday</option>
                </select>

                <label style={{ fontSize: "12px", fontWeight: "bold", marginTop: "10px", display: "block" }}>Shift Time (Flexible)</label>
                <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", padding: "10px", borderRadius: "5px", border: "1px solid #eee" }}>
                  <TimePicker label="Start Time" value={formData.shiftStart} onChange={(val) => setFormData({...formData, shiftStart: val})} />
                  <span style={{ margin: "0 10px", fontWeight: "bold" }}>TO</span>
                  <TimePicker label="End Time" value={formData.shiftEnd} onChange={(val) => setFormData({...formData, shiftEnd: val})} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" }}>
                  <button type="button" onClick={() => setModals({...modals, add: false, update: false})} style={{...btnStyle, background: "#ccc", color: "#333"}}>Cancel</button>
                  <button type="submit" style={{...btnStyle, background: colors.green}}>Confirm</button>
                </div>
              </form>
            </div>
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
                        {/* ✅ UPDATED: Added color: colors.blue */}
                        <h2 style={{ margin: 0, color: colors.blue }}>Archive Log</h2>
                        <button onClick={() => setModals({...modals, archiveLog: false})} style={{...btnStyle, background: "#ccc", color: "black", padding: "5px 10px"}}>Close</button>
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          {/* ✅ UPDATED: Changed background from colors.green to colors.blue */}
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
                      {attendanceLogs.length === 0 && <tr><td colSpan="4" style={{padding:"20px", textAlign:"center"}}>No records found.</td></tr>}
                    </tbody>
                  </table>
              </div>
              <PaginationControls total={attendanceLogs.length} page={attendancePage} setPage={setAttendancePage} perPage={attendancePerPage} />
             </div>
          </div>
        )}

      </div>
    </div>
  )
}
export default HRSystem