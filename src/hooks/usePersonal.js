import { useState, useEffect, useCallback } from 'react'
import * as personalService from '../services/personalService'

export const usePersonal = () => {
  const [employee, setEmployee] = useState(null)
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
    const { data } = await personalService.fetchAttendance(empData.EmployeeID)
    setAttendanceLogs(data || [])
    const todayStr = new Date().toLocaleDateString('en-CA')
    const todayLog = (data || []).find(l => l.Date === todayStr)
    setTodayRecord(todayLog || null)
    setLoading(false)
  }, [])

  const refreshAttendance = useCallback(async (empId) => {
    const { data } = await personalService.fetchAttendance(empId)
    setAttendanceLogs(data || [])
    const todayStr = new Date().toLocaleDateString('en-CA')
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
    setNextShift
  }
}
