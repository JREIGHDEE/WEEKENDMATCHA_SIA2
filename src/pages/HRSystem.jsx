import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/wm-logo.svg' 
import { Notification } from '../components/Notification'
import EmployeeForm from '../components/EmployeeForm'
import EmployeeTable from '../components/EmployeeTable'
import SearchFilterBar from '../components/SearchFilterBar'
import ArchiveModal from '../components/ArchiveModal'
import ArchiveLogModal from '../components/ArchiveLogModal'
import AttendanceModal from '../components/AttendanceModal'
import Sidebar from '../components/Sidebar'
import ConfirmationModal from '../components/ConfirmationModal'
import { useEmployeeFiltering } from '../hooks/useEmployeeFiltering'
import { useEmployeeForm } from '../hooks/useEmployeeForm'
import { useModalState } from '../hooks/useModalState'
import { useNotification } from '../hooks/useNotification'
import * as employeeService from '../services/employeeService'
import { ADMIN_ROLES, ALL_ROLES, PAGINATION } from '../constants/appConstants'
import { colors, btnStyle, inputStyle } from '../constants/uiStyles.js'

function HRSystem() {
  const navigate = useNavigate()
  const searchContainerRef = useRef(null)
  
  // State for UI
  const [showFilterMenuState, setShowFilterMenuState] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [archivePage, setArchivePage] = useState(1)
  const [attendancePage, setAttendancePage] = useState(1)
  const [archiveLogs, setArchiveLogs] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])

  // Custom Hooks
  const employeeFiltering = useEmployeeFiltering()
  const employeeForm = useEmployeeForm()
  const modalState = useModalState()
  const notificationState = useNotification()

  // Destructure hook returns
  const { employees, setEmployees, filteredEmployees, searchTerm, setSearchTerm, filterCategory, setFilterCategory, updateFilteredEmployees } = employeeFiltering
  const { formData, setFormData, archiveReason, setArchiveReason, prepareAddForm, populateUpdateForm } = employeeForm
  const { modals, closeModal, closeMultipleModals, triggerConfirmation, confirmAction, selectedEmpId, setSelectedEmpId } = modalState
  const { notification, showSuccess, showError, showWarning, clearNotification } = notificationState

  // --- 1. INITIAL LOAD ---
  useEffect(() => { 
    const initializeApp = async () => {
      const isAuthorized = await employeeService.checkUserSecurity(navigate, ADMIN_ROLES)
      if (!isAuthorized) return
      fetchEmployees() 
    }
    initializeApp()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowFilterMenuState(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchContainerRef])

  useEffect(() => {
    updateFilteredEmployees()
    setCurrentPage(1) 
  }, [employees, searchTerm, filterCategory, updateFilteredEmployees])

  async function fetchEmployees() {
    const { data, error } = await employeeService.fetchAllEmployees()
    if (error) console.error(error)
    else {
      setEmployees(data)
    }
  }

  // --- HELPERS ---
  const fetchRoleId = async (roleName) => {
    return await employeeService.fetchRoleId(roleName)
  }

  // --- PAGINATION ---
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  // --- ADD EMPLOYEE ---
  const prepareAdd = () => {
    prepareAddForm()
    modalState.openModal('add')
  }

  const executeAddEmployee = async () => {
    const signResult = await employeeService.signUpEmployee(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      formData.role
    )

    // If signUp failed but an existing user was found, use that user's ID
    if (signResult.authError && signResult.existingUser) {
      const existingId = signResult.existingUser.UserID
      const { data, error } = await employeeService.createEmployee(formData, null, existingId)
      if (error) showError("Employee Error: " + error.message)
      else {
        fetchEmployees()
        showSuccess("Account Linked & Employee Added!")
        closeMultipleModals(['add', 'confirmation'])
      }
      return
    }

    if (signResult.authError) {
      showError("Auth Error: " + signResult.authError.message)
      return
    }

    const { data, error } = await employeeService.createEmployee(formData, signResult.authData)
    if (error) {
      showError("Employee Error: " + error.message)
    } else {
      fetchEmployees()
      showSuccess("Account Created & Employee Added!")
      closeMultipleModals(['add', 'confirmation'])
    }
  }

  // --- UPDATE EMPLOYEE ---
  const prepareUpdate = () => {
    if (!selectedEmpId) { 
      showWarning('Select an employee first')
      return 
    }
    const emp = employees.find(e => e.EmployeeID === selectedEmpId)
    populateUpdateForm(emp)
    modalState.openModal('update')
  }

  const executeUpdateEmployee = async () => {
    const emp = employees.find(e => e.EmployeeID === selectedEmpId)
    const { userUpdate, empUpdate } = await employeeService.updateEmployee(selectedEmpId, formData, emp.UserID)
    
    if (userUpdate.error || empUpdate.error) {
      showError("Error updating employee")
    } else {
      fetchEmployees()
      showSuccess("Employee Updated Successfully!")
      closeMultipleModals(['update', 'confirmation'])
    }
  }

  // --- ARCHIVE & LOGS ---
  const prepareArchive = () => {
    if (!selectedEmpId) { 
      showWarning('Select an employee first')
      return 
    }
    setArchiveReason('')
    modalState.openModal('archive')
  }
  
  const executeArchive = async () => {
    if (!archiveReason) { 
      showWarning('Reason is required')
      return 
    }
    const emp = employees.find(e => e.EmployeeID === selectedEmpId)
    await employeeService.archiveEmployee(selectedEmpId, emp.UserID, archiveReason)
    fetchEmployees()
    showSuccess("Employee Archived.")
    closeMultipleModals(['archive', 'confirmation'])
  }

  const openArchiveLogModal = async () => {
    const { data } = await employeeService.fetchArchiveLogs()
    setArchiveLogs(data || [])
    setArchivePage(1)
    modalState.openModal('archiveLog')
  }

  const executeRestore = async (logID, empID) => {
    const { error } = await employeeService.restoreEmployee(logID, empID)
    if (error) { 
      showError('Error restoring: ' + error.message)
      return 
    }
    showSuccess('Employee Restored!')
    fetchEmployees()
    closeModal('archiveLog')
  }

  // --- ATTENDANCE ---
  const openAttendanceModal = async () => {
    if (!selectedEmpId) { 
      showWarning('Please select an employee first.')
      return 
    }
    const { data } = await employeeService.fetchAttendanceLogs(selectedEmpId)
    setAttendanceLogs(data || [])
    setAttendancePage(1)
    modalState.openModal('attendance')
  }

  // --- HELPERS ---
  const triggerConfirmationAction = (action) => {
    triggerConfirmation(action)
  }
  
  const handleRefresh = () => {
    fetchEmployees()
    showSuccess('Data refreshed')
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
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const confirmOverlay = { ...modalOverlay, zIndex: 2000 } 
  const modalContent = { background: "white", padding: "25px", borderRadius: "15px", width: "550px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }
  const pillBtn = (active) => ({ padding: "5px 15px", borderRadius: "20px", border: "1px solid #666", background: active ? colors.green : "white", color: active ? "white" : "black", cursor: "pointer", fontSize: "12px", fontWeight: "bold" })

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <Sidebar colors={colors} navigate={navigate} logo={logo} />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: colors.beige, padding: "30px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: colors.darkGreen }}>Employee Management</h1>
          <button style={{...btnStyle, background: colors.purple}} onClick={openAttendanceModal}>VIEW ATTENDANCE LOG</button>
        </div>

        <SearchFilterBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          showFilterMenu={showFilterMenuState}
          setShowFilterMenu={setShowFilterMenuState}
          searchContainerRef={searchContainerRef}
          colors={colors}
        />

        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button style={{...btnStyle, background: colors.darkGreen}} onClick={prepareAdd}>ADD</button>
          <button style={{...btnStyle, background: "#d3af37"}} onClick={prepareUpdate}>UPDATE</button>
          <button style={{...btnStyle, background: colors.red}} onClick={prepareArchive}>ARCHIVE</button>
          <button style={{...btnStyle, background: "#337AB7"}} onClick={openArchiveLogModal}>VIEW ARCHIVE LOG</button>
          <button style={{...btnStyle, background: "#FF9800", marginLeft: "auto"}} onClick={handleRefresh}>REFRESH</button>
        </div>

        <EmployeeTable 
          filteredEmployees={filteredEmployees}
          currentPage={currentPage}
          itemsPerPage={PAGINATION.employees}
          selectedEmpId={selectedEmpId}
          setSelectedEmpId={setSelectedEmpId}
          colors={colors}
          PaginationControls={PaginationControls}
        />

        {/* MODALS */}
        <ConfirmationModal 
          isOpen={modals.confirmation}
          onConfirm={confirmAction}
          onCancel={() => closeModal('confirmation')}
          colors={colors}
          btnStyle={btnStyle}
        />

        {(modals.add || modals.update) && (
          <div style={{position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000}}>
            <EmployeeForm
                formData={formData}
                setFormData={setFormData}
                ALL_ROLES={ALL_ROLES}
                modals={modals}
                setModals={modalState.setModals}
                triggerConfirmation={triggerConfirmationAction}
                executeAddEmployee={executeAddEmployee}
                executeUpdateEmployee={executeUpdateEmployee}
                setNotification={notificationState.setNotification}
                showError={showError}
                inputStyle={inputStyle}
                btnStyle={btnStyle}
                colors={colors}
            />
          </div>
        )}

        {modals.archive && (
          <ArchiveModal 
            archiveReason={archiveReason}
            setArchiveReason={setArchiveReason}
            triggerConfirmation={triggerConfirmationAction}
            executeArchive={executeArchive}
            setModals={modalState.setModals}
            modals={modals}
            colors={colors}
            btnStyle={btnStyle}
            inputStyle={inputStyle}
          />
        )}

        {modals.archiveLog && (
          <ArchiveLogModal 
            archiveLogs={archiveLogs}
            archivePage={archivePage}
            setArchivePage={setArchivePage}
            archivePerPage={PAGINATION.archive}
            executeRestore={executeRestore}
            setModals={modalState.setModals}
            modals={modals}
            colors={colors}
            btnStyle={btnStyle}
            PaginationControls={PaginationControls}
          />
        )}
        
        {modals.attendance && (
          <AttendanceModal 
            attendanceLogs={attendanceLogs}
            attendancePage={attendancePage}
            setAttendancePage={setAttendancePage}
            attendancePerPage={PAGINATION.attendance}
            setModals={modalState.setModals}
            modals={modals}
            colors={colors}
            btnStyle={btnStyle}
            PaginationControls={PaginationControls}
          />
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
export default HRSystem