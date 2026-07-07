import { useState, useEffect, useCallback } from 'react'
import * as personalService from '../services/personalService'
import { supabase } from '../supabaseClient'

export const usePersonal = () => {
  const [employee, setEmployee] = useState(null)
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // PIN State
  const [hasPIN, setHasPIN] = useState(false)
  const [showPINModal, setShowPINModal] = useState(false)
  const [pinMode, setPinMode] = useState('setup') // 'setup' or 'change'
  const [currentPIN, setCurrentPIN] = useState('')
  const [newPIN, setNewPIN] = useState('')
  const [confirmPIN, setConfirmPIN] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState('')
  
  // Auto timeout safeguard
  const [autoTimeoutChecked, setAutoTimeoutChecked] = useState(false)

  const handleAutoTimeoutSafeguard = async (empId, empData) => {
    try {
      const status = await personalService.getEmployeeAttendanceStatus(empId)
      if (!status.isTimedIn) return // Already timed out
      
      // Check if shift has ended
      if (!empData?.ShiftSchedule) return
      
      const parsed = personalService.parseShiftEndTime(empData.ShiftSchedule)
      if (!parsed) return

      const now = new Date()
      // Base the shift-end date on the actual TimeIn date (in Manila time),
      // not "today" — otherwise an overnight shift (e.g. 5PM-1AM) miscalculates
      // once the calendar date has already rolled over past midnight.
      const timeInDate = status.lastTimeIn ? new Date(status.lastTimeIn) : now
      const timeInManilaDateStr = personalService.getManilaDateStr(timeInDate)
      let shiftEnd = personalService.buildManilaDateTime(timeInManilaDateStr, parsed.endHour, parsed.endMinute)

      // If the parsed end time is earlier in the day than the time-in, the
      // shift crosses midnight, so the end time actually falls on the next day.
      if (shiftEnd <= timeInDate) {
        const nextDay = new Date(shiftEnd.getTime() + 24 * 60 * 60 * 1000)
        shiftEnd = personalService.buildManilaDateTime(personalService.getManilaDateStr(nextDay), parsed.endHour, parsed.endMinute)
      }

      // If shift ended more than 1 hour ago, mark as Incomplete
      if (now > shiftEnd && (now - shiftEnd) > 3600000) {
        await supabase
          .from('Attendance')
          .update({ status: 'Incomplete' })
          .eq('AttendanceID', status.activeAttendanceId)
        
        setAutoTimeoutChecked(true)
      }
    } catch (err) {
      console.error('Auto timeout safeguard error:', err)
    }
  }

  const fetchPersonalData = useCallback(async (navigate, setNotification) => {
    setLoading(true)
    const { user, userData, empData, empError } = await personalService.fetchUserAndEmployee()
    if (!user) { navigate('/login'); return }

    const ADMIN_ROLES = ['HR Admin', 'Inventory Admin', 'Sales Admin']
    if (userData && ADMIN_ROLES.includes(userData.RoleName)) setIsAdmin(true)

    if (empError) {
      setNotification({ message: 'Error fetching profile.', type: 'error' })
      return
    }

    if (!empData) {
      if (userData && ADMIN_ROLES.includes(userData.RoleName)) {
        setNotification({ message: "You are an Admin, but you don't have an Employee Record yet. Please go to HR System -> Add Employee and create a profile for yourself.", type: 'warning' })
        setTimeout(() => navigate('/admin-menu'), 3000)
        return
      } else {
        setNotification({ message: 'Profile not found.', type: 'error' })
        return
      }
    }

    setEmployee(empData)
    
    // Check if employee has PIN
    const { hasPIN: pinExists } = await personalService.checkEmployeePIN(empData.EmployeeID)
    setHasPIN(pinExists)
    
    // Mark any incomplete attendance from previous days
    await personalService.markIncompleteAttendance(empData.EmployeeID)
    
    const { data } = await personalService.fetchAttendance(empData.EmployeeID)
    setAttendanceLogs(data || [])
    const todayStr = personalService.getManilaDateStr()
    const todayLog = (data || []).find(l => l.Date === todayStr)
    setTodayRecord(todayLog || null)
    
    // Check for auto timeout safeguard
    await handleAutoTimeoutSafeguard(empData.EmployeeID, empData)
    
    setLoading(false)
  }, [])

  const refreshAttendance = useCallback(async (empId) => {
    const { data } = await personalService.fetchAttendance(empId)
    setAttendanceLogs(data || [])
    const todayStr = personalService.getManilaDateStr()
    const todayLog = (data || []).find(l => l.Date === todayStr)
    setTodayRecord(todayLog || null)
  }, [])

  const doTimeIn = useCallback(async (employeeId) => {
    const res = await personalService.timeIn(employeeId)
    return res
  }, [])

  const doTimeOut = useCallback(async (attendanceId) => {
    const res = await personalService.timeOut(attendanceId)
    return res
  }, [])

  const setNextShift = useCallback(async (employeeId, date) => {
    const res = await personalService.updateNextShift(employeeId, date)
    return res
  }, [])

  // PIN Handlers
  const openPINModal = useCallback((mode = 'setup') => {
    setPinMode(mode)
    setCurrentPIN('')
    setNewPIN('')
    setConfirmPIN('')
    setPinError('')
    setShowPINModal(true)
  }, [])

  const closePINModal = useCallback(() => {
    setShowPINModal(false)
    setCurrentPIN('')
    setNewPIN('')
    setConfirmPIN('')
    setPinError('')
  }, [])

  const handleSavePIN = useCallback(async (onSuccess) => {
    setPinError('')
    
    // Validate new PIN format
    if (!newPIN || !/^\d{4,6}$/.test(newPIN)) {
      setPinError('PIN must be 4-6 digits')
      return
    }
    
    // Validate confirm PIN
    if (newPIN !== confirmPIN) {
      setPinError('PINs do not match')
      return
    }
    
    if (pinMode === 'change' && !currentPIN) {
      setPinError('Current PIN is required to change PIN')
      return
    }
    
    setPinLoading(true)
    try {
      let result
      if (pinMode === 'setup') {
        result = await personalService.createEmployeePIN(employee.EmployeeID, newPIN)
      } else {
        result = await personalService.updateEmployeePIN(employee.EmployeeID, currentPIN, newPIN)
      }
      
      if (!result.success) {
        setPinError(result.error)
        setPinLoading(false)
        return
      }
      
      setHasPIN(true)
      closePINModal()
      if (onSuccess) onSuccess()
    } catch (err) {
      setPinError(err.message)
    } finally {
      setPinLoading(false)
    }
  }, [employee, newPIN, confirmPIN, currentPIN, pinMode, closePINModal])

  return {
    employee,
    setEmployee,
    attendanceLogs,
    setAttendanceLogs,
    todayRecord,
    setTodayRecord,
    loading,
    isAdmin,
    fetchPersonalData,
    refreshAttendance,
    doTimeIn,
    doTimeOut,
    setNextShift,
    // PIN state and handlers
    hasPIN,
    setHasPIN,
    showPINModal,
    setShowPINModal,
    pinMode,
    setPinMode,
    currentPIN,
    setCurrentPIN,
    newPIN,
    setNewPIN,
    confirmPIN,
    setConfirmPIN,
    pinLoading,
    pinError,
    openPINModal,
    closePINModal,
    handleSavePIN,
    autoTimeoutChecked,
    setAutoTimeoutChecked,
    handleAutoTimeoutSafeguard
  }
}

