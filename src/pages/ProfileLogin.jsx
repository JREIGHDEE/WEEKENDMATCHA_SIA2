import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { verifyPIN, saveNewPIN } from '../services/employeeService'
import { useNavigate, useLocation } from 'react-router-dom'
import { type as typeScale } from '../constants/uiStyles'
import { Notification } from '../components/Notification'

export default function ProfileLogin() {
  const [employees, setEmployees] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalMode, setModalMode] = useState('none')
  const [pinInput, setPinInput] = useState('')
  const [confirmPinInput, setConfirmPinInput] = useState('')
  const [oldPinInput, setOldPinInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ message: '', type: 'success' })
  
  // --- NEW: Load hidden profiles from the tablet's local memory ---
  const [hiddenProfiles, setHiddenProfiles] = useState(() => {
    const saved = localStorage.getItem('wm_hidden_profiles')
    return saved ? JSON.parse(saved) : []
  })
  
  const navigate = useNavigate()
  const location = useLocation()
  const destinationType = location.state?.type || 'personal' 

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('Employee')
        // <-- UPDATED: Added Email and Password to this list
        .select('EmployeeID, EmployeeStatus, User(UserID, FirstName, RoleName, PIN, Email, Password)')
        .eq('EmployeeStatus', 'Active')
        
      if (!error && data) setEmployees(data)
    }
    fetchProfiles()
  }, [])

  const handleProfileClick = (emp) => {
    setSelectedUser(emp)
    setPinInput('')
    setConfirmPinInput('')
    setOldPinInput('')
    if (emp.User.PIN) setModalMode('enter')
    else setModalMode('create')
  }

  // --- NEW: Hide profile when 'X' is clicked ---
  const handleHideProfile = (e, empId) => {
    e.stopPropagation() // Stops the card click event from triggering the PIN modal
    const updatedHidden = [...hiddenProfiles, empId]
    setHiddenProfiles(updatedHidden)
    localStorage.setItem('wm_hidden_profiles', JSON.stringify(updatedHidden))
  }

  const handleSubmit = async () => {
    setLoading(true)
    const userId = selectedUser.User.UserID

    if (modalMode === 'create' || modalMode === 'change') {
      if (pinInput.length !== 4) {
        setNotification({ message: 'PIN must be exactly 4 digits.', type: 'error' })
        setLoading(false); return
      }
      if (pinInput !== confirmPinInput) {
        setNotification({ message: 'PINs do not match!', type: 'error' })
        setLoading(false); return
      }
      if (modalMode === 'change') {
        const check = await verifyPIN(userId, oldPinInput)
        if (!check.success) {
          setNotification({ message: 'Old PIN is incorrect.', type: 'error' })
          setLoading(false); return
        }
      }

      const { error } = await saveNewPIN(userId, pinInput)
      if (!error) {
        const updatedEmployees = employees.map(e => 
          e.User.UserID === userId ? { ...e, User: { ...e.User, PIN: pinInput } } : e
        )
        setEmployees(updatedEmployees)
        setNotification({ message: 'PIN saved successfully! Please log in.', type: 'success' })
        setModalMode('enter')
        setPinInput('')
      }
      
    } else if (modalMode === 'enter') {
      const check = await verifyPIN(userId, pinInput)
      if (check.success) {
        
        // --- NEW: INVISIBLE SUPABASE LOGIN ---
        // This actually creates the secure session so the next page doesn't kick you out!
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: selectedUser.User.Email,
          password: selectedUser.User.Password
        })

        if (authError) {
          setNotification({ message: 'System Error: Could not establish session.', type: 'error' })
          setLoading(false); return;
        }
        // -------------------------------------

        setNotification({ message: `Welcome back, ${selectedUser.User.FirstName}!`, type: 'success' })
        
        setTimeout(() => {
          if (destinationType === 'admin') navigate('/admin-menu')
          else if (destinationType === 'pos') navigate('/pos')
          else navigate('/personal-view')
        }, 1000)
      } else {
        setNotification({ message: 'Incorrect PIN.', type: 'error' })
      }
    }
    setLoading(false)
  }

  // Filter out any employees that are in the hidden array
  const visibleEmployees = employees.filter(emp => !hiddenProfiles.includes(emp.EmployeeID))

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7f4", padding: "40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 style={{ color: "#4A5D4B", fontSize: "32px", marginBottom: "40px" }}>Choose a Profile</h1>

      {/* THE GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", width: "100%", maxWidth: "900px" }}>
        {visibleEmployees.map(emp => (
          <div 
            key={emp.EmployeeID} 
            onClick={() => handleProfileClick(emp)}
            style={{ 
              background: "white", borderRadius: "16px", padding: "30px 15px", display: "flex", flexDirection: "column", alignItems: "center", 
              cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "2px solid transparent", transition: "all 0.2s",
              position: "relative" // Needed for the X button
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = "#6B7C65"}
            onMouseOut={e => e.currentTarget.style.borderColor = "transparent"}
          >
            {/* THE X BUTTON */}
            <button 
              onClick={(e) => handleHideProfile(e, emp.EmployeeID)}
              style={{ position: "absolute", top: "10px", right: "12px", background: "none", border: "none", color: "#ccc", fontSize: "16px", cursor: "pointer", padding: "5px" }}
              onMouseOver={e => e.currentTarget.style.color = "#FF6B6B"}
              onMouseOut={e => e.currentTarget.style.color = "#ccc"}
              title="Remove from quick login"
            >
              ✕
            </button>

            <div style={{ width: "65px", height: "65px", borderRadius: "50%", background: "#4A5D4B", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "28px", fontWeight: "bold", marginBottom: "15px" }}>
              {emp.User.FirstName.charAt(0)}
            </div>
            <div style={{ fontWeight: "bold", fontSize: "18px", color: "#333" }}>{emp.User.FirstName}</div>
            <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>ID: {emp.EmployeeID}</div>
            <div style={{ fontSize: "12px", color: "#6B7C65", fontWeight: "bold", marginTop: "8px" }}>{emp.User.RoleName}</div>
          </div>
        ))}
      </div>

      {/* NEW: NOT YET SIGNED IN BUTTON */}
      <div style={{ marginTop: "50px" }}>
        <button 
          onClick={() => navigate('/login', { state: { type: destinationType } })}
          style={{ background: "transparent", color: "#6B7C65", border: "2px solid #6B7C65", padding: "12px 24px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "15px", transition: "0.2s" }}
          onMouseOver={e => { e.currentTarget.style.background = "#6B7C65"; e.currentTarget.style.color = "white"; }}
          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7C65"; }}
        >
          Not listed? Log in with Email
        </button>
      </div>

      {/* THE SMART MODAL */}
      {modalMode !== 'none' && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "40px", borderRadius: "20px", width: "350px", textAlign: "center", position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <button onClick={() => setModalMode('none')} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#999" }}>✕</button>
            
            <h2 style={{ color: "#4A5D4B", margin: "0 0 20px 0" }}>
              {modalMode === 'enter' ? `Welcome, ${selectedUser?.User.FirstName}` : 
               modalMode === 'create' ? 'Create Your PIN' : 'Change Your PIN'}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "20px" }}>
              {modalMode === 'change' && (
                <input type="password" maxLength="4" placeholder="Old 4-Digit PIN" value={oldPinInput} onChange={e => setOldPinInput(e.target.value.replace(/\D/g, ''))} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", textAlign: "center", fontSize: "18px", letterSpacing: "5px" }} />
              )}
              
              <input type="password" maxLength="4" placeholder={modalMode === 'enter' ? "Enter 4-Digit PIN" : "New 4-Digit PIN"} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", textAlign: "center", fontSize: "18px", letterSpacing: "5px" }} />
              
              {(modalMode === 'create' || modalMode === 'change') && (
                <input type="password" maxLength="4" placeholder="Confirm New PIN" value={confirmPinInput} onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g, ''))} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", textAlign: "center", fontSize: "18px", letterSpacing: "5px" }} />
              )}
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "14px", background: "#6B7C65", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginBottom: "15px" }}>
              {loading ? "Processing..." : (modalMode === 'enter' ? "Log In" : "Save PIN")}
            </button>

            {modalMode === 'enter' && (
              <div onClick={() => { setModalMode('change'); setPinInput(''); }} style={{ fontSize: "13px", color: "#888", textDecoration: "underline", cursor: "pointer" }}>
                Change your PIN
              </div>
            )}
          </div>
        </div>
      )}

      <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: 'success' })} />
    </div>
  )
}