import React, { useEffect, useState } from 'react'

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

  const validateEmployeeForm = () => {
    const errors = []

    if (!formData.firstName || formData.firstName.trim() === '') errors.push("First Name is required")
    else if (formData.firstName.length < 2) errors.push("First Name must be at least 2 characters")
    else if (formData.firstName.length > 50) errors.push("First Name must not exceed 50 characters")
    else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName)) errors.push("First Name can only contain letters, spaces, hyphens, and apostrophes")

    if (!formData.lastName || formData.lastName.trim() === '') errors.push("Last Name is required")
    else if (formData.lastName.length < 2) errors.push("Last Name must be at least 2 characters")
    else if (formData.lastName.length > 50) errors.push("Last Name must not exceed 50 characters")
    else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName)) errors.push("Last Name can only contain letters, spaces, hyphens, and apostrophes")

    if (!formData.email || formData.email.trim() === '') errors.push("Email is required")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.push("Email format is invalid")
    else if (formData.email.length > 100) errors.push("Email must not exceed 100 characters")

    if (!formData.password || formData.password.trim() === '') errors.push("Password is required")
    else if (formData.password.length < 6) errors.push("Password must be at least 6 characters")
    else if (formData.password.length > 100) errors.push("Password must not exceed 100 characters")
    else if (!/(?=.*[a-z])/.test(formData.password)) errors.push("Password must contain at least one lowercase letter")
    else if (!/(?=.*[A-Z])/.test(formData.password)) errors.push("Password must contain at least one uppercase letter")
    else if (!/(?=.*[0-9])/.test(formData.password)) errors.push("Password must contain at least one number")

    if (!formData.contact || formData.contact.trim() === '') errors.push("Contact Number is required")
    else if (!/^[0-9+\-\s()]+$/.test(formData.contact)) errors.push("Contact Number can only contain numbers, spaces, +, -, and parentheses")
    else if (formData.contact.replace(/\D/g, '').length < 7) errors.push("Contact Number must contain at least 7 digits")
    else if (formData.contact.length > 20) errors.push("Contact Number must not exceed 20 characters")

    if (!formData.address || formData.address.trim() === '') errors.push("Address is required")
    else if (formData.address.length < 5) errors.push("Address must be at least 5 characters")
    else if (formData.address.length > 255) errors.push("Address must not exceed 255 characters")

    if (!formData.dob || formData.dob.trim() === '') errors.push("Date of Birth is required")
    else {
      const dobDate = new Date(formData.dob)
      const today = new Date()
      const age = today.getFullYear() - dobDate.getFullYear()
      const monthDiff = today.getMonth() - dobDate.getMonth()
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate()) ? age - 1 : age
      if (actualAge < 16) errors.push("Employee must be at least 16 years old")
      else if (actualAge > 100) errors.push("Please enter a valid Date of Birth")
    }

    if (!formData.dateHired || formData.dateHired.trim() === '') errors.push("Date Hired is required")
    else if (new Date(formData.dateHired) > new Date()) errors.push("Date Hired cannot be in the future")

    if (!formData.role || formData.role.trim() === '') errors.push("Role is required")
    else if (!ALL_ROLES.includes(formData.role)) errors.push("Invalid Role selected")

    if (!formData.status || formData.status.trim() === '') errors.push("Status is required")
    else if (!['Active', 'Inactive'].includes(formData.status)) errors.push("Invalid Status selected")

    if (!formData.schedulePattern || formData.schedulePattern.trim() === '') errors.push("Schedule Pattern is required")
    else {
      const validDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
      if (!validDays.includes(formData.schedulePattern)) errors.push("Invalid Schedule Pattern selected")
    }

    if (errors.length > 0) { showError(errors[0]); return false }
    return true
  }

  const isFieldValid = (fieldName) => {
    switch(fieldName) {
      case 'firstName':
        return formData.firstName && formData.firstName.length >= 2 && formData.firstName.length <= 50 && /^[a-zA-Z\s'-]+$/.test(formData.firstName)
      case 'lastName':
        return formData.lastName && formData.lastName.length >= 2 && formData.lastName.length <= 50 && /^[a-zA-Z\s'-]+$/.test(formData.lastName)
      case 'email':
        return formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && formData.email.length <= 100
      case 'password':
        return formData.password && formData.password.length >= 6 && /(?=.*[a-z])/.test(formData.password) && /(?=.*[A-Z])/.test(formData.password) && /(?=.*[0-9])/.test(formData.password)
      case 'contact':
        return formData.contact && /^[0-9+\-\s()]+$/.test(formData.contact) && formData.contact.replace(/\D/g, '').length >= 7
      case 'address':
        return formData.address && formData.address.length >= 5 && formData.address.length <= 255
      case 'dob':
        if (!formData.dob) return false
        const dobDate = new Date(formData.dob)
        const today = new Date()
        const age = today.getFullYear() - dobDate.getFullYear()
        const monthDiff = today.getMonth() - dobDate.getMonth()
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate()) ? age - 1 : age
        return actualAge >= 16 && actualAge <= 100
      case 'dateHired':
        return formData.dateHired && new Date(formData.dateHired) <= new Date()
      default:
        return true
    }
  }

  const getFieldBorderColor = (fieldName) => {
    if (!formData[fieldName] || formData[fieldName].trim() === '') return '#ccc'
    return isFieldValid(fieldName) ? '#4CAF50' : '#f44336'
  }

  const handleAddConfirmation = (e) => {
    e.preventDefault()
    if (!validateEmployeeForm()) return
    triggerConfirmation(() => executeAddEmployee())
  }

  const handleUpdateConfirmation = (e) => {
    e.preventDefault()
    if (!validateEmployeeForm()) return
    triggerConfirmation(() => executeUpdateEmployee())
  }

  return (
    <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 }}>
      <div style={{ background: 'white', padding: 25, borderRadius: 15, width: 550, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>{modals.add ? "Add Employee" : "Update Employee"}</h2>
        <form onSubmit={modals.add ? handleAddConfirmation : handleUpdateConfirmation}>
          <h4 style={{ margin: "10px 0", borderBottom: "1px solid #eee" }}>Personal Information</h4>
          <div style={{ display: "flex", gap: "10px" }}>
            <input style={{...inputStyle, borderColor: getFieldBorderColor('firstName'), borderWidth: '2px'}} placeholder="Reigh" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <input style={{...inputStyle, borderColor: getFieldBorderColor('lastName'), borderWidth: '2px'}} placeholder="Denolan" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <input style={{...inputStyle, borderColor: getFieldBorderColor('address'), borderWidth: '2px'}} placeholder="123 Main Street, New York, NY 10001" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <div style={{ display: "flex", gap: "10px" }}>
            <input style={{...inputStyle, borderColor: getFieldBorderColor('contact'), borderWidth: '2px'}} placeholder="+1-555-123-4567" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
            <input type="date" style={{...inputStyle, borderColor: getFieldBorderColor('dob'), borderWidth: '2px'}} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
          </div>
          <h4 style={{ margin: "15px 0 10px", borderBottom: "1px solid #eee" }}>Account Details</h4>
          <input style={{...inputStyle, borderColor: getFieldBorderColor('email'), borderWidth: '2px'}} placeholder="reigh.denolan@test.com" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input style={{...inputStyle, borderColor: getFieldBorderColor('password'), borderWidth: '2px'}} placeholder="SecurePass123" type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
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
          <input type="date" style={{...inputStyle, borderColor: getFieldBorderColor('dateHired'), borderWidth: '2px'}} value={formData.dateHired} onChange={e => setFormData({...formData, dateHired: e.target.value})} />
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
  )
}
