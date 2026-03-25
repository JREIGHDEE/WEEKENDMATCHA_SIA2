import React, { useEffect, useState } from 'react'
import CancelConfirmationModal from './CancelConfirmationModal'
import { validateEmployeeForm, isFieldValid, getFieldBorderColor, validateShiftTimes, formatPhilippineNumber } from '../utils/validation'

// TimePicker used only by the employee form
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

export default function EmployeeForm({
  formData, setFormData, ALL_ROLES, modals, setModals,
  triggerConfirmation, executeAddEmployee, executeUpdateEmployee,
  setNotification, showError, inputStyle, btnStyle, colors
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const handleValidation = () => {
    const errors = validateEmployeeForm(formData, ALL_ROLES)
    if (errors.length > 0) {
      showError(errors[0])
      return false
    }
    return true
  }

  const handleAddConfirmation = (e) => {
    e.preventDefault()
    if (!handleValidation()) return
    triggerConfirmation(() => executeAddEmployee())
  }

  const handleUpdateConfirmation = (e) => {
    e.preventDefault()
    if (!handleValidation()) return
    triggerConfirmation(() => executeUpdateEmployee())
  }

  const handleCancelClick = (e) => {
    e.preventDefault()
    setShowCancelConfirm(true)
  }

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false)
    setModals({...modals, add: false, update: false})
  }

  const handleCancelCancel = () => {
    setShowCancelConfirm(false)
  }

  return (
    <>
      <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 }}>
        <div style={{ background: 'white', padding: 25, borderRadius: 15, width: 550, maxHeight: '90vh', overflowY: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>{modals.add ? "Add Employee" : "Update Employee"}</h2>
          <form onSubmit={modals.add ? handleAddConfirmation : handleUpdateConfirmation}>
            <h4 style={{ margin: "10px 0", borderBottom: "1px solid #eee" }}>Personal Information</h4>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{flex: 1}}>
                <label style={{fontSize:"12px", fontWeight:"bold"}}>First Name</label>
                <input disabled={!modals.add} style={{...inputStyle, borderColor: getFieldBorderColor('firstName', formData, ALL_ROLES), borderWidth: '2px', opacity: !modals.add ? 0.6 : 1, cursor: !modals.add ? 'not-allowed' : 'auto'}} placeholder="Reigh" value={formData.firstName} onChange={e => !modals.add || setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div style={{flex: 1}}>
                <label style={{fontSize:"12px", fontWeight:"bold"}}>Last Name</label>
                <input disabled={!modals.add} style={{...inputStyle, borderColor: getFieldBorderColor('lastName', formData, ALL_ROLES), borderWidth: '2px', opacity: !modals.add ? 0.6 : 1, cursor: !modals.add ? 'not-allowed' : 'auto'}} placeholder="Denolan" value={formData.lastName} onChange={e => !modals.add || setFormData({...formData, lastName: e.target.value})} />
              </div>
            </div>
            <label style={{fontSize:"12px", fontWeight:"bold"}}>Address</label>
            <input style={{...inputStyle, borderColor: getFieldBorderColor('address', formData, ALL_ROLES), borderWidth: '2px'}} placeholder="123 Main Street, New York, NY 10001" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{flex: 1}}>
                <label style={{fontSize:"12px", fontWeight:"bold"}}>Contact Number (Philippine)</label>
                <div style={{display: "flex", alignItems: "center", background: "white", border: `2px solid ${getFieldBorderColor('contact', formData, ALL_ROLES)}`, borderRadius: "5px", padding: "0"}}>
                  <span style={{padding: "8px 10px", fontWeight: "bold", color: "#555", background: "#f9f9f9", borderRight: "1px solid #ddd"}}>+63</span>
                  <input 
                    style={{...inputStyle, flex: 1, border: "none", borderColor: "transparent", padding: "8px 10px"}} 
                    placeholder="9123456789" 
                    value={formData.contact} 
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setFormData({...formData, contact: digits})
                    }}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div style={{flex: 1}}>
                <label style={{fontSize:"12px", fontWeight:"bold"}}>Date of Birth</label>
                <input type="date" disabled={!modals.add} style={{...inputStyle, borderColor: getFieldBorderColor('dob', formData, ALL_ROLES), borderWidth: '2px', opacity: !modals.add ? 0.6 : 1, cursor: !modals.add ? 'not-allowed' : 'auto'}} value={formData.dob} onChange={e => !modals.add || setFormData({...formData, dob: e.target.value})} />
              </div>
            </div>
            {modals.add && (
              <>
                <h4 style={{ margin: "15px 0 10px", borderBottom: "1px solid #eee" }}>Account Details</h4>
                <label style={{fontSize:"12px", fontWeight:"bold"}}>Email</label>
                <input style={{...inputStyle, borderColor: getFieldBorderColor('email', formData, ALL_ROLES), borderWidth: '2px'}} placeholder="reigh.denolan@test.com" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <label style={{fontSize:"12px", fontWeight:"bold"}}>Password</label>
                <input style={{...inputStyle, borderColor: getFieldBorderColor('password', formData, ALL_ROLES), borderWidth: '2px'}} placeholder="SecurePass123" type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </>
            )}
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
            {modals.add && (
              <>
                <label style={{fontSize:"12px", fontWeight:"bold"}}>Date Hired</label>
                <input type="date" style={{...inputStyle, borderColor: getFieldBorderColor('dateHired', formData, ALL_ROLES), borderWidth: '2px'}} value={formData.dateHired} onChange={e => setFormData({...formData, dateHired: e.target.value})} />
              </>
            )}
            <label style={{ fontSize: "12px", fontWeight: "bold", marginTop: "10px", display: "block" }}>Shift Date Range (Start to End)</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "10px", fontWeight: "bold", color: "#555" }}>Start Date</label>
                <input 
                  type="date" 
                  style={{...inputStyle, borderColor: getFieldBorderColor('shiftStartDate', formData, ALL_ROLES), borderWidth: '2px'}} 
                  value={formData.shiftStartDate || ''} 
                  onChange={e => setFormData({...formData, shiftStartDate: e.target.value})} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "10px", fontWeight: "bold", color: "#555" }}>End Date</label>
                <input 
                  type="date" 
                  style={{...inputStyle, borderColor: getFieldBorderColor('shiftEndDate', formData, ALL_ROLES), borderWidth: '2px'}} 
                  value={formData.shiftEndDate || ''} 
                  onChange={e => setFormData({...formData, shiftEndDate: e.target.value})} 
                />
              </div>
            </div>

            <label style={{ fontSize: "12px", fontWeight: "bold", marginTop: "10px", display: "block" }}>Shift Time (Start to End)</label>
            <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", padding: "10px", borderRadius: "5px", border: formData.shiftStart && formData.shiftEnd && !validateShiftTimes(formData.shiftStart, formData.shiftEnd).isValid ? "2px solid #f44336" : "1px solid #eee" }}>
              <TimePicker label="Start Time" value={formData.shiftStart} onChange={(val) => setFormData({...formData, shiftStart: val})} />
              <span style={{ margin: "0 10px", fontWeight: "bold" }}>TO</span>
              <TimePicker label="End Time" value={formData.shiftEnd} onChange={(val) => setFormData({...formData, shiftEnd: val})} />
            </div>
            {formData.shiftStart && formData.shiftEnd && !validateShiftTimes(formData.shiftStart, formData.shiftEnd).isValid && (
              <span style={{ fontSize: "12px", color: "#f44336", marginTop: "5px", display: "block" }}>
                {validateShiftTimes(formData.shiftStart, formData.shiftEnd).error}
              </span>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" }}>
              <button type="button" onClick={handleCancelClick} style={{...btnStyle, background: "#ccc", color: "#333"}}>Cancel</button>
              <button type="submit" style={{...btnStyle, background: colors.green}}>Confirm</button>
            </div>
          </form>
        </div>
      </div>
      <CancelConfirmationModal 
        isOpen={showCancelConfirm} 
        onConfirm={handleCancelConfirm} 
        onCancel={handleCancelCancel}
        colors={colors}
        btnStyle={btnStyle}
      />
    </>
  )
}
