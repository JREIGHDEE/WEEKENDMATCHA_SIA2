import { useState, useCallback } from 'react'
import { DEFAULT_FORM_DATA } from '../constants/appConstants'

export const useEmployeeForm = () => {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA)
  const [archiveReason, setArchiveReason] = useState('')

  const resetFormData = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA)
  }, [])

  const resetArchiveReason = useCallback(() => {
    setArchiveReason('')
  }, [])

  const prepareAddForm = useCallback(() => {
    setFormData({
      firstName: '', lastName: '', address: '', contact: '', dob: '',
      email: '', password: '', role: 'Barista', status: 'Active', 
      shiftStart: '08:00 AM', shiftEnd: '05:00 PM', 
      dateHired: new Date().toISOString().split('T')[0],
      schedulePattern: 'Saturday' 
    })
  }, [])

  const populateUpdateForm = useCallback((employee) => {
    const [start, end] = employee.ShiftSchedule ? employee.ShiftSchedule.split(' - ') : ["08:00 AM", "05:00 PM"]
    setFormData({
      firstName: employee.User?.FirstName, 
      lastName: employee.User?.LastName, 
      address: employee.User?.Address,
      contact: employee.User?.ContactNumber, 
      dob: employee.DateOfBirth, 
      email: employee.User?.Email || '', 
      password: employee.User?.Password || '',
      role: employee.User?.RoleName, 
      status: employee.EmployeeStatus, 
      shiftStart: start, 
      shiftEnd: end, 
      dateHired: employee.DateHired,
      schedulePattern: employee.SchedulePattern || 'Saturday'
    })
  }, [])

  return {
    formData,
    setFormData,
    archiveReason,
    setArchiveReason,
    resetFormData,
    resetArchiveReason,
    prepareAddForm,
    populateUpdateForm
  }
}
