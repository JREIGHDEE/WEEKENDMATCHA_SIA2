/**
 * Validation utilities for HR forms
 * Provides reusable validation functions and field checking
 */

/**
 * Validates an employee form and returns an array of errors
 * @param {Object} formData - The form data to validate
 * @param {Array} ALL_ROLES - Array of valid roles
 * @returns {Array} Array of error messages (empty if valid)
 */
export const validateEmployeeForm = (formData, ALL_ROLES) => {
  const errors = []

  // First Name validation
  if (!formData.firstName || formData.firstName.trim() === '') {
    errors.push("First Name is required")
  } else if (formData.firstName.length < 2) {
    errors.push("First Name must be at least 2 characters")
  } else if (formData.firstName.length > 50) {
    errors.push("First Name must not exceed 50 characters")
  } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName)) {
    errors.push("First Name can only contain letters, spaces, hyphens, and apostrophes")
  }

  // Last Name validation
  if (!formData.lastName || formData.lastName.trim() === '') {
    errors.push("Last Name is required")
  } else if (formData.lastName.length < 2) {
    errors.push("Last Name must be at least 2 characters")
  } else if (formData.lastName.length > 50) {
    errors.push("Last Name must not exceed 50 characters")
  } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName)) {
    errors.push("Last Name can only contain letters, spaces, hyphens, and apostrophes")
  }

  // Email validation
  if (!formData.email || formData.email.trim() === '') {
    errors.push("Email is required")
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.push("Email format is invalid")
  } else if (formData.email.length > 100) {
    errors.push("Email must not exceed 100 characters")
  }

  // Password validation (only for new forms, not updates)
  if (formData.password !== undefined && formData.password !== null) {
    if (!formData.password || formData.password.trim() === '') {
      errors.push("Password is required")
    } else if (formData.password.length < 6) {
      errors.push("Password must be at least 6 characters")
    } else if (formData.password.length > 100) {
      errors.push("Password must not exceed 100 characters")
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      errors.push("Password must contain at least one lowercase letter")
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      errors.push("Password must contain at least one uppercase letter")
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      errors.push("Password must contain at least one number")
    }
  }

  // Contact Number validation (Philippine format: +63 followed by 9-10 digits)
  if (!formData.contact || formData.contact.trim() === '') {
    errors.push("Contact Number is required")
  } else if (!/^[0-9\s\-()]+$/.test(formData.contact)) {
    errors.push("Contact Number can only contain numbers, spaces, hyphens, and parentheses (do not include +63)")
  } else if (formData.contact.replace(/\D/g, '').length < 9) {
    errors.push("Contact Number must have at least 9 digits")
  } else if (formData.contact.replace(/\D/g, '').length > 10) {
    errors.push("Contact Number must have at most 10 digits")
  }

  // Address validation
  if (!formData.address || formData.address.trim() === '') {
    errors.push("Address is required")
  } else if (formData.address.length < 5) {
    errors.push("Address must be at least 5 characters")
  } else if (formData.address.length > 255) {
    errors.push("Address must not exceed 255 characters")
  }

  // Date of Birth validation
  if (!formData.dob || formData.dob.trim() === '') {
    errors.push("Date of Birth is required")
  } else {
    const dobDate = new Date(formData.dob)
    const today = new Date()
    const age = today.getFullYear() - dobDate.getFullYear()
    const monthDiff = today.getMonth() - dobDate.getMonth()
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate()) ? age - 1 : age
    if (actualAge < 16) {
      errors.push("Employee must be at least 16 years old")
    } else if (actualAge > 100) {
      errors.push("Please enter a valid Date of Birth")
    }
  }

  // Date Hired validation
  if (!formData.dateHired || formData.dateHired.trim() === '') {
    errors.push("Date Hired is required")
  } else if (new Date(formData.dateHired) > new Date()) {
    errors.push("Date Hired cannot be in the future")
  }

  // Role validation
  if (!formData.role || formData.role.trim() === '') {
    errors.push("Role is required")
  } else if (!ALL_ROLES.includes(formData.role)) {
    errors.push("Invalid Role selected")
  }

  // Status validation
  if (!formData.status || formData.status.trim() === '') {
    errors.push("Status is required")
  } else if (!['Active', 'On Leave', 'Inactive'].includes(formData.status)) {
    errors.push("Invalid Status selected")
  }

  // Shift Date Range validation
  if (!formData.shiftStartDate || formData.shiftStartDate.trim() === '') {
    errors.push("Shift Start Date is required")
  }
  if (!formData.shiftEndDate || formData.shiftEndDate.trim() === '') {
    errors.push("Shift End Date is required")
  }
  if (formData.shiftStartDate && formData.shiftEndDate) {
    const startDate = new Date(formData.shiftStartDate)
    const endDate = new Date(formData.shiftEndDate)
    if (startDate > endDate) {
      errors.push("Shift Start Date cannot be after End Date")
    }
  }

  // Shift Times validation
  if (formData.shiftStart && formData.shiftEnd) {
    const shiftValidation = validateShiftTimes(formData.shiftStart, formData.shiftEnd)
    if (!shiftValidation.isValid) {
      errors.push(shiftValidation.error)
    }
  }

  return errors
}

/**
 * Checks if a specific field is valid
 * @param {string} fieldName - The field to validate
 * @param {Object} formData - The form data object
 * @param {Array} ALL_ROLES - Array of valid roles (optional)
 * @returns {boolean} True if field is valid
 */
export const isFieldValid = (fieldName, formData, ALL_ROLES = []) => {
  switch (fieldName) {
    case 'firstName':
      return formData.firstName && 
             formData.firstName.length >= 2 && 
             formData.firstName.length <= 50 && 
             /^[a-zA-Z\s'-]+$/.test(formData.firstName)
    
    case 'lastName':
      return formData.lastName && 
             formData.lastName.length >= 2 && 
             formData.lastName.length <= 50 && 
             /^[a-zA-Z\s'-]+$/.test(formData.lastName)
    
    case 'email':
      return formData.email && 
             /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && 
             formData.email.length <= 100
    
    case 'password':
      return formData.password && 
             formData.password.length >= 6 && 
             formData.password.length <= 100 &&
             /(?=.*[a-z])/.test(formData.password) && 
             /(?=.*[A-Z])/.test(formData.password) && 
             /(?=.*[0-9])/.test(formData.password)
    
    case 'contact':
      return formData.contact && 
             /^[0-9\-\s()]+$/.test(formData.contact) && 
             formData.contact.replace(/\D/g, '').length >= 9 &&
             formData.contact.replace(/\D/g, '').length <= 10
    
    case 'address':
      return formData.address && 
             formData.address.length >= 5 && 
             formData.address.length <= 255
    
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
    
    case 'role':
      return formData.role && ALL_ROLES.includes(formData.role)
    
    case 'status':
      return formData.status && ['Active', 'On Leave', 'Inactive'].includes(formData.status)
    
    case 'shiftStartDate':
      return formData.shiftStartDate && formData.shiftStartDate.trim() !== ''
    
    case 'shiftEndDate':
      return formData.shiftEndDate && formData.shiftEndDate.trim() !== '' && 
             (!formData.shiftStartDate || new Date(formData.shiftStartDate) <= new Date(formData.shiftEndDate))
    
    default:
      return true
  }
}

/**
 * Gets the border color for a field based on validation status
 * @param {string} fieldName - The field name
 * @param {Object} formData - The form data object
 * @param {Array} ALL_ROLES - Array of valid roles (optional)
 * @returns {string} Color hex code
 */
export const getFieldBorderColor = (fieldName, formData, ALL_ROLES = []) => {
  const value = formData[fieldName]
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return '#ccc'
  }
  return isFieldValid(fieldName, formData, ALL_ROLES) ? '#4CAF50' : '#f44336'
}

/**
 * Formats contact number with Philippine country code prefix
 * @param {string} digitsOnly - Contact number without +63 prefix
 * @returns {string} Formatted number with +63 prefix
 */
export const formatPhilippineNumber = (digitsOnly) => {
  if (!digitsOnly) return '+63 '
  const digits = digitsOnly.replace(/\D/g, '')
  if (digits.length === 0) return '+63 '
  return `+63 ${digits}`
}

/**
 * Converts time string (e.g., "08:00 AM") to 24-hour minutes for comparison
 * @param {string} timeStr - Time string in format "HH:MM AM/PM"
 * @returns {number} Total minutes from midnight
 */
export const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [time, period] = timeStr.split(' ')
  const [hour, minute] = time.split(':').map(Number)
  let hours = hour
  if (period === 'PM' && hour !== 12) {
    hours += 12
  }
  if (period === 'AM' && hour === 12) {
    hours = 0
  }
  return hours * 60 + minute
}

/**
 * Validates shift times - ensures end time is after start time
 * @param {string} shiftStart - Start time string
 * @param {string} shiftEnd - End time string
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateShiftTimes = (shiftStart, shiftEnd) => {
  if (!shiftStart || !shiftEnd) {
    return { isValid: false, error: "Both shift times are required" }
  }
  
  const startMinutes = timeStringToMinutes(shiftStart)
  const endMinutes = timeStringToMinutes(shiftEnd)
  
  if (endMinutes <= startMinutes) {
    return { isValid: false, error: "End time must be after start time" }
  }
  
  return { isValid: true, error: "" }
}
