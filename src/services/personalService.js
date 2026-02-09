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
