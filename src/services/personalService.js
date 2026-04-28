import { supabase } from '../supabaseClient'

export const fetchUserAndEmployee = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null }

  const { data: userData } = await supabase.from('User').select('RoleName').eq('UserID', user.id).maybeSingle()
  const { data: empData, error: empError } = await supabase.from('Employee').select('*, User(*)').eq('UserID', user.id).maybeSingle()

  return { user, userData, empData, empError }
}

export const fetchAttendance = async (empId) => {
  const { data, error } = await supabase.from('Attendance').select('*').eq('EmployeeID', empId).order('Date', { ascending: false })
  return { data, error }
}

export const timeIn = async (employeeId) => {
  const todayStr = new Date().toLocaleDateString('en-CA')
  
  // Check if already timed in today
  const { data: existingRecord } = await supabase
    .from('Attendance')
    .select('AttendanceID')
    .eq('EmployeeID', employeeId)
    .eq('Date', todayStr)
    .maybeSingle()
  
  if (existingRecord) {
    return { error: new Error('Already timed in today. Please time out first.') }
  }
  
  const now = new Date().toISOString()
  const { error } = await supabase.from('Attendance').insert([{ EmployeeID: employeeId, Date: todayStr, TimeIn: now }])
  return { error }
}

export const timeOut = async (attendanceId) => {
  const now = new Date().toISOString()
  const { error } = await supabase.from('Attendance').update({ TimeOut: now }).eq('AttendanceID', attendanceId)
  return { error }
}

export const updateNextShift = async (employeeId, nextDate) => {
  const { error } = await supabase.from('Employee').update({ NextShift: nextDate }).eq('EmployeeID', employeeId)
  return { error }
}

export const signOut = async () => {
  await supabase.auth.signOut()
}

// --- PIN MANAGEMENT ---
import { hashPIN, verifyPIN } from '../utils/pinHelpers'

/**
 * Set new PIN for employee (first time setup)
 * @param {number} employeeId - Employee ID
 * @param {string} newPin - New PIN (4-6 digits)
 * @returns {object} { success: boolean, error: string|null }
 */
export const createEmployeePIN = async (employeeId, newPin) => {
  try {
    const pinHash = hashPIN(newPin);
    const { error } = await supabase
      .from('Employee')
      .update({ pin_hash: pinHash })
      .eq('EmployeeID', employeeId);
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Update existing PIN (requires current PIN verification)
 * @param {number} employeeId - Employee ID
 * @param {string} currentPin - Current PIN for verification
 * @param {string} newPin - New PIN (4-6 digits)
 * @returns {object} { success: boolean, error: string|null }
 */
export const updateEmployeePIN = async (employeeId, currentPin, newPin) => {
  try {
    // Fetch current PIN hash
    const { data: emp, error: fetchError } = await supabase
      .from('Employee')
      .select('pin_hash')
      .eq('EmployeeID', employeeId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    if (!emp || !emp.pin_hash) {
      return { success: false, error: 'No PIN found for this employee' };
    }
    
    // Verify current PIN
    if (!verifyPIN(currentPin, emp.pin_hash)) {
      return { success: false, error: 'Current PIN is incorrect' };
    }
    
    // Hash and update new PIN
    const newPinHash = hashPIN(newPin);
    const { error: updateError } = await supabase
      .from('Employee')
      .update({ pin_hash: newPinHash })
      .eq('EmployeeID', employeeId);
    
    if (updateError) throw updateError;
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Verify employee PIN during time in/out or other operations
 * @param {number} employeeId - Employee ID
 * @param {string} inputPin - PIN entered by employee
 * @returns {object} { verified: boolean, error: string|null }
 */
export const verifyEmployeePIN = async (employeeId, inputPin) => {
  try {
    const { data: emp, error: fetchError } = await supabase
      .from('Employee')
      .select('pin_hash')
      .eq('EmployeeID', employeeId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    if (!emp || !emp.pin_hash) {
      return { verified: false, error: 'No PIN set for this employee' };
    }
    
    const verified = verifyPIN(inputPin, emp.pin_hash);
    if (!verified) {
      return { verified: false, error: 'Invalid PIN' };
    }
    
    return { verified: true, error: null };
  } catch (err) {
    return { verified: false, error: err.message };
  }
};

/**
 * Check if employee has PIN set
 * @param {number} employeeId - Employee ID
 * @returns {object} { hasPIN: boolean, error: string|null }
 */
export const checkEmployeePIN = async (employeeId) => {
  try {
    const { data: emp, error } = await supabase
      .from('Employee')
      .select('pin_hash')
      .eq('EmployeeID', employeeId)
      .maybeSingle();
    
    if (error) throw error;
    return { hasPIN: !!emp?.pin_hash, error: null };
  } catch (err) {
    return { hasPIN: false, error: err.message };
  }
}
/**
 * Time in using PIN verification
 * @param {number} employeeId - Employee ID
 * @param {boolean} isActive - Employee active status
 * @returns {object} { success: boolean, error: string|null, timeInCreated: boolean }
 */
export const timeInWithPIN = async (employeeId, isActive = true) => {
  try {
    // Fetch employee status if not explicitly provided
    if (isActive === true) {
      const { data: emp, error: empErr } = await supabase.from('Employee').select('EmployeeStatus').eq('EmployeeID', employeeId).maybeSingle()
      if (empErr) throw empErr
      if (emp?.EmployeeStatus !== 'Active') {
        return { success: false, error: 'Inactive employees cannot time in', timeInCreated: false };
      }
    } else if (!isActive) {
      return { success: false, error: 'Inactive employees cannot time in', timeInCreated: false };
    }
    
    const todayStr = new Date().toLocaleDateString('en-CA')
    
    // Check if already timed in today
    const { data: existingRecord, error: checkError } = await supabase
      .from('Attendance')
      .select('AttendanceID, TimeOut')
      .eq('EmployeeID', employeeId)
      .eq('Date', todayStr)
      .maybeSingle()
    
    if (checkError) throw checkError;
    
    if (existingRecord) {
      if (existingRecord.TimeOut) {
        return { success: false, error: 'Already timed in and out today', timeInCreated: false };
      } else {
        return { success: false, error: 'Already timed in. Please time out first', timeInCreated: false };
      }
    }
    
    const now = new Date().toISOString()
    const { error: insertError } = await supabase
      .from('Attendance')
      .insert([{ EmployeeID: employeeId, Date: todayStr, TimeIn: now }])
    
    if (insertError) throw insertError;
    
    return { success: true, error: null, timeInCreated: true };
  } catch (err) {
    return { success: false, error: err.message, timeInCreated: false };
  }
};

/**
 * Time out using PIN verification
 * @param {number} employeeId - Employee ID
 * @returns {object} { success: boolean, error: string|null, timeOutCreated: boolean }
 */
export const timeOutWithPIN = async (employeeId) => {
  try {
    // Check employee status
    const { data: emp, error: empErr } = await supabase.from('Employee').select('EmployeeStatus').eq('EmployeeID', employeeId).maybeSingle()
    if (empErr) throw empErr
    if (emp?.EmployeeStatus !== 'Active') {
      return { success: false, error: 'Inactive employees cannot time out', timeOutCreated: false };
    }
    
    const todayStr = new Date().toLocaleDateString('en-CA')
    
    // Find today's attendance record
    const { data: record, error: checkError } = await supabase
      .from('Attendance')
      .select('AttendanceID')
      .eq('EmployeeID', employeeId)
      .eq('Date', todayStr)
      .maybeSingle()
    
    if (checkError) throw checkError;
    
    if (!record) {
      return { success: false, error: 'No time in record found for today', timeOutCreated: false };
    }
    
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('Attendance')
      .update({ TimeOut: now })
      .eq('AttendanceID', record.AttendanceID)
    
    if (updateError) throw updateError;
    
    return { success: true, error: null, timeOutCreated: true };
  } catch (err) {
    return { success: false, error: err.message, timeOutCreated: false };
  }
};

/**
 * Admin: Update incomplete attendance record with missing time out
 * @param {number} attendanceId - Attendance ID
 * @param {string} timeOut - Time out in ISO format
 * @returns {object} { success: boolean, error: string|null }
 */
export const updateIncompleteAttendanceTimeOut = async (attendanceId, timeOut) => {
  try {
    if (!timeOut) {
      return { success: false, error: 'Time out is required' };
    }
    
    // Parse time out if it's just HH:MM format
    let finalTimeOut = timeOut
    if (timeOut.length === 5 && timeOut.includes(':')) {
      const [hours, minutes] = timeOut.split(':')
      const now = new Date()
      finalTimeOut = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes)).toISOString()
    }
    
    const { error } = await supabase
      .from('Attendance')
      .update({ TimeOut: finalTimeOut, status: 'Completed' })
      .eq('AttendanceID', attendanceId)
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Get employee's current attendance status
 * @param {number} employeeId - Employee ID
 * @returns {object} { isTimedIn: boolean, activeAttendanceId: number|null, lastTimeIn: string|null, todayDate: string }
 */
export const getEmployeeAttendanceStatus = async (employeeId) => {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA')
    const { data: todayRecord, error } = await supabase
      .from('Attendance')
      .select('AttendanceID, TimeIn, TimeOut')
      .eq('EmployeeID', employeeId)
      .eq('Date', todayStr)
      .maybeSingle()
    
    if (error) throw error;
    
    // Employee is timed in if they have a record with TimeIn but no TimeOut
    const isTimedIn = !!todayRecord?.TimeIn && !todayRecord?.TimeOut
    
    return {
      isTimedIn,
      activeAttendanceId: isTimedIn ? todayRecord.AttendanceID : null,
      lastTimeIn: todayRecord?.TimeIn || null,
      todayDate: todayStr
    }
  } catch (err) {
    return {
      isTimedIn: false,
      activeAttendanceId: null,
      lastTimeIn: null,
      todayDate: new Date().toLocaleDateString('en-CA')
    }
  }
};

/**
 * Mark incomplete attendance for previous records that weren't timed out
 * @param {number} employeeId - Employee ID
 * @returns {object} { success: boolean, updated: number }
 */
export const markIncompleteAttendance = async (employeeId) => {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA')
    
    // Find records from previous days with TimeIn but no TimeOut
    const { data: incompleteRecords, error: fetchError } = await supabase
      .from('Attendance')
      .select('AttendanceID, Date')
      .eq('EmployeeID', employeeId)
      .lt('Date', todayStr)
      .is('TimeOut', null)
    
    if (fetchError) throw fetchError;
    
    if (!incompleteRecords || incompleteRecords.length === 0) {
      return { success: true, updated: 0 }
    }
    
    const recordIds = incompleteRecords.map(r => r.AttendanceID)
    
    // Update them as Incomplete
    const { error: updateError } = await supabase
      .from('Attendance')
      .update({ status: 'Incomplete' })
      .in('AttendanceID', recordIds)
    
    if (updateError) throw updateError;
    
    return { success: true, updated: recordIds.length }
  } catch (err) {
    return { success: false, updated: 0, error: err.message }
  }
};

/**
 * Parse shift schedule string to get end time
 * Expects format like "09:00 - 17:00"
 * @param {string} shiftSchedule - Shift schedule string
 * @returns {object|null} { endTime: string, endHour: number, endMinute: number } or null if invalid
 */
export const parseShiftEndTime = (shiftSchedule) => {
  if (!shiftSchedule || typeof shiftSchedule !== 'string') return null
  
  try {
    const parts = shiftSchedule.split('-')
    if (parts.length < 2) return null
    
    const endTimePart = parts[1].trim()
    const [hour, minute] = endTimePart.split(':').map(Number)
    
    if (isNaN(hour) || isNaN(minute)) return null
    
    return {
      endTime: endTimePart,
      endHour: hour,
      endMinute: minute
    }
  } catch (err) {
    return null
  }
};

/**
 * Get monthly attendance summary
 * @param {number} employeeId - Employee ID
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month 1-12
 * @returns {object} { present: number, absent: number, incomplete: number, totalDays: number }
 */
export const getMonthlyAttendanceSummary = async (employeeId, year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1).toLocaleDateString('en-CA')
    const endDate = new Date(year, month, 0).toLocaleDateString('en-CA')
    
    const { data: records, error } = await supabase
      .from('Attendance')
      .select('AttendanceID, status, TimeIn, TimeOut')
      .eq('EmployeeID', employeeId)
      .gte('Date', startDate)
      .lte('Date', endDate)
    
    if (error) throw error
    
    let present = 0, incomplete = 0, absent = 0
    
    records.forEach(record => {
      if (record.status === 'Incomplete') {
        incomplete++
      } else if (record.TimeIn && record.TimeOut) {
        present++
      } else if (record.TimeIn && !record.TimeOut) {
        incomplete++
      }
    })
    
    const daysInMonth = new Date(year, month, 0).getDate()
    absent = daysInMonth - present - incomplete
    if (absent < 0) absent = 0
    
    return { present, incomplete, absent, totalDays: daysInMonth }
  } catch (err) {
    return { present: 0, incomplete: 0, absent: 0, totalDays: 0, error: err.message }
  }
};