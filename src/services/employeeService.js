import { supabase } from '../supabaseClient'

// --- EMPLOYEE OPERATIONS ---
export const fetchAllEmployees = async () => {
  const { data, error } = await supabase
    .from('Employee')
    .select('*, User(*)') 
    .order('EmployeeID', { ascending: true })
  return { data, error }
}

export const fetchRoleId = async (roleName) => {
  const { data, error } = await supabase
    .from('UserRole')
    .select('UserRoleID')
    .eq('RoleName', roleName)
    .maybeSingle()
  
  if (error) console.error("Error fetching role:", error)
  if (!data) return 1
  return data.UserRoleID
}

export const createEmployee = async (formData, authData, existingUserId = null) => {
  const correctRoleId = await fetchRoleId(formData.role)

  const userId = existingUserId || (authData?.user ? authData.user.id : undefined)

  const { data: userData, error: userError } = await supabase
    .from('User')
    .upsert([{
      UserID: userId,
      FirstName: formData.firstName,
      LastName: formData.lastName,
      Address: formData.address,
      ContactNumber: formData.contact,
      RoleName: formData.role,
      Email: formData.email,
      Password: formData.password,
      UserRoleID: correctRoleId
    }], { onConflict: 'UserID' })
    .select()

  if (userError) return { error: userError }

  const fullShift = `${formData.shiftStart} - ${formData.shiftEnd}`
  const userRecord = userData && userData.length ? userData[0] : { UserID: userId }
  const { error: empError } = await supabase.from('Employee').insert([{
    UserID: userRecord.UserID,
    DateHired: formData.dateHired,
    ShiftSchedule: fullShift,
    EmployeeStatus: formData.status,
    DateOfBirth: formData.dob,
// --- ADD THIS NEW LOGIC ---
      SchedulePattern: formData.isShiftRange 
          ? `${formData.shiftStartDate} - ${formData.shiftEndDate}` 
          : formData.shiftSingleDay,
          
      // Ensure the old timestamp columns are sent as null so the DB doesn't crash
      ShiftStartDate: null,  
      ShiftEndDate: null
  }])

  if (empError) return { error: empError }
  return { data: userRecord, error: null }
}

export const updateEmployee = async (employeeId, formData, userID) => {
  const fullShift = `${formData.shiftStart} - ${formData.shiftEnd}`
  const correctRoleId = await fetchRoleId(formData.role)

  const userUpdate = await supabase.from('User').update({
    FirstName: formData.firstName, 
    LastName: formData.lastName, 
    Address: formData.address, 
    ContactNumber: formData.contact, 
    RoleName: formData.role, 
    Email: formData.email, 
    Password: formData.password,
    UserRoleID: correctRoleId 
  }).eq('UserID', userID)

  const empUpdate = await supabase.from('Employee').update({
    ShiftSchedule: fullShift, 
    EmployeeStatus: formData.status, 
    DateOfBirth: formData.dob, 
    DateHired: formData.dateHired,
// --- ADD THIS NEW LOGIC ---
      SchedulePattern: formData.isShiftRange 
          ? `${formData.shiftStartDate} - ${formData.shiftEndDate}` 
          : formData.shiftSingleDay,
          
      ShiftStartDate: null,
      ShiftEndDate: null
  }).eq('EmployeeID', employeeId)

  return { userUpdate, empUpdate }
}

// --- STATUS MANAGEMENT (replaces Archive system) ---
// Helper: Update employee status (Active/Inactive/On Leave) - NEW
export const updateEmployeeStatus = async (employeeId, userID, newStatus) => {
  // Update Employee status
  const empUpdate = await supabase.from('Employee').update({ EmployeeStatus: newStatus }).eq('EmployeeID', employeeId)
  
  // Update User IsActive based on new status
  const isActive = newStatus === 'Active'
  const userUpdate = await supabase.from('User').update({ IsActive: isActive }).eq('UserID', userID)
  
  return { empUpdate, userUpdate }
}

// --- ARCHIVE OPERATIONS (legacy - now uses status update) ---
export const archiveEmployee = async (employeeId, userID, reason) => {
  // Update Employee status to Inactive
  const archiveResult = await supabase.from('Employee').update({ EmployeeStatus: 'Inactive' }).eq('EmployeeID', employeeId)
  
  // Also update User IsActive field if it exists
  const userUpdateResult = await supabase.from('User').update({ IsActive: false }).eq('UserID', userID)
  
  const logResult = await supabase.from('ArchiveLog').insert([{ 
    EmployeeID: employeeId, 
    UserID: userID, 
    ArchivedDate: new Date().toISOString().split('T')[0], 
    ReasonArchived: reason 
  }])

  return { archiveResult, userUpdateResult, logResult }
}

export const fetchArchiveLogs = async () => {
  const { data, error } = await supabase
    .from('ArchiveLog')
    .select('*, Employee(User(FirstName, LastName))')
    .order('ArchivedDate', { ascending: false })
  return { data, error }
}

export const restoreEmployee = async (logID, empID, userID) => {
  // Update Employee status back to Active
  const updateResult = await supabase.from('Employee').update({ EmployeeStatus: 'Active' }).eq('EmployeeID', empID)
  
  if (updateResult.error) return { error: updateResult.error }
  
  // Also update User IsActive field if it exists
  const userUpdateResult = await supabase.from('User').update({ IsActive: true }).eq('UserID', userID)
  
  const deleteResult = await supabase.from('ArchiveLog').delete().eq('LogID', logID)
  
  return { error: null }
}

// --- ATTENDANCE OPERATIONS ---
export const fetchAttendanceLogs = async (employeeId) => {
  const { data, error } = await supabase
    .from('Attendance')
    .select('*')
    .eq('EmployeeID', employeeId)
    .order('Date', { ascending: false })
  return { data, error }
}

// --- SECURITY CHECK ---
export const checkUserSecurity = async (navigate, adminRoles) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { 
    navigate('/login')
    return false
  }
  
  const { data } = await supabase.from('User').select('RoleName').eq('UserID', user.id).maybeSingle()
  if (!data || !adminRoles.includes(data.RoleName)) { 
    navigate('/personal-view')
    return false
  }
  
  return true
}

// --- AUTH OPERATIONS ---
export const signUpEmployee = async (email, password, firstName, lastName, role) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        role
      },
      emailRedirectTo: undefined
    }
  })

  // If signUp failed because the user already exists, try to find the existing user record
  if (authError) {
    try {
      const { data: existingUser, error: fetchErr } = await supabase.from('User').select('UserID').eq('Email', email).maybeSingle()
      if (!fetchErr && existingUser) {
        return { authData: null, authError, existingUser }
      }
    } catch (e) {
      // ignore
    }
    return { authData: null, authError }
  }

  // Sign out the newly created user to prevent auto-login redirect
  if (authData?.user) {
    await supabase.auth.signOut()
  }

  return { authData, authError }
}

// Check if the entered PIN matches the database
export const verifyPIN = async (userId, enteredPin) => {
  const { data, error } = await supabase
    .from('User')
    .select('PIN')
    .eq('UserID', userId)
    .maybeSingle()

  if (error) return { success: false, error }
  
  // If the PIN in the database matches what they typed, success!
  return { success: data?.PIN === enteredPin }
}

// Save a newly created or changed PIN
export const saveNewPIN = async (userId, newPin) => {
  const { data, error } = await supabase
    .from('User')
    .update({ PIN: newPin })
    .eq('UserID', userId)

  return { error }
}