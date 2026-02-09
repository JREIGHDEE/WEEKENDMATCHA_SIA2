// --- ROLE CONFIGURATIONS ---
export const ADMIN_ROLES = ['HR Admin', 'Inventory Admin', 'Sales Admin']
export const EMPLOYEE_ROLES = ['Barista', 'Cashier', 'Kitchen Staff', 'Server']
export const ALL_ROLES = [...ADMIN_ROLES, ...EMPLOYEE_ROLES]

// --- PAGINATION DEFAULTS ---
export const PAGINATION = {
  employees: 8,
  archive: 5,
  attendance: 5
}

// --- DEFAULT FORM DATA ---
export const DEFAULT_FORM_DATA = {
  firstName: '',
  lastName: '',
  address: '',
  contact: '',
  dob: '',
  email: '',
  password: '',
  role: 'Barista',
  status: 'Active',
  shiftStart: '08:00 AM',
  shiftEnd: '05:00 PM',
  dateHired: new Date().toISOString().split('T')[0],
  schedulePattern: 'Saturday'
}

// --- DEFAULT MODALS STATE ---
export const DEFAULT_MODALS = {
  add: false,
  update: false,
  archive: false,
  archiveLog: false,
  attendance: false,
  confirmation: false,
  success: false
}

// --- DEFAULT NOTIFICATION ---
export const DEFAULT_NOTIFICATION = {
  message: '',
  type: 'success'
}
