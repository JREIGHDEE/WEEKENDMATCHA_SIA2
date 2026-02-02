# HR System Form Validation Rules

## Overview
Comprehensive form validation has been implemented for the HR System employee creation and update forms. The validation is **strict** and provides real-time visual feedback.

---

## Validation Rules by Field

### **First Name**
- ✅ Required field
- Length: 2-50 characters
- Format: Letters only (a-z, A-Z), spaces, hyphens, apostrophes
- Real-time feedback: Green border = valid, Red border = invalid

### **Last Name**
- ✅ Required field
- Length: 2-50 characters
- Format: Letters only (a-z, A-Z), spaces, hyphens, apostrophes
- Real-time feedback: Green border = valid, Red border = invalid

### **Email**
- ✅ Required field
- Format: Must be valid email (user@example.com)
- Length: Max 100 characters
- Real-time feedback: Green border = valid, Red border = invalid

### **Password**
- ✅ Required field
- Length: 6-100 characters
- **Must contain ALL of the following:**
  - At least 1 lowercase letter (a-z)
  - At least 1 uppercase letter (A-Z)
  - At least 1 number (0-9)
- Example: `MyPassword123` ✅ | `password` ❌ | `Password` ❌
- Real-time feedback: Green border = valid, Red border = invalid

### **Contact Number**
- ✅ Required field
- Format: Numbers, +, -, (), and spaces only
- Min: 7 digits (can have formatting)
- Max: 20 characters
- Valid examples: `+1-234-567-8900`, `(555) 123-4567`, `5551234567`
- Real-time feedback: Green border = valid, Red border = invalid

### **Address**
- ✅ Required field
- Length: 5-255 characters
- Any characters allowed
- Real-time feedback: Green border = valid, Red border = invalid

### **Date of Birth**
- ✅ Required field
- Age constraints:
  - Minimum: 16 years old
  - Maximum: 100 years old
- Must be a valid date
- Real-time feedback: Green border = valid, Red border = invalid

### **Date Hired**
- ✅ Required field
- Cannot be in the future
- Must be today or earlier
- Real-time feedback: Green border = valid, Red border = invalid

### **Role**
- ✅ Required field
- Admin roles: HR Admin, Inventory Admin, Sales Admin
- Employee roles: Barista, Cashier, Kitchen Staff, Server
- Real-time feedback: Must select from dropdown

### **Status**
- ✅ Required field
- Valid options: Active, On Leave, Inactive
- Real-time feedback: Must select from dropdown

### **Schedule Pattern**
- ✅ Required field
- Valid options: Monday-Sunday (each day means "Every [Day]")
- Real-time feedback: Must select from dropdown

---

## Visual Feedback System

### **Border Colors**
- **Gray (#ccc)**: Field is empty/not yet evaluated
- **Green (#4CAF50)**: Field is valid ✅
- **Red (#f44336)**: Field has validation error ❌

### **Error Notifications**
- Errors appear as notifications in the top-right corner
- Each notification shows the FIRST validation error found
- User must fix that error before other errors are shown
- Notification auto-dismisses in 3 seconds

---

## Submission Flow

1. User fills out form fields
2. **Real-time visual feedback** shows validation status (green/red borders)
3. User clicks "Confirm" button
4. **Form validation** checks all fields
5. If ANY field fails validation:
   - Error notification appears
   - Form submission is blocked
   - User must fix the error and try again
6. If ALL fields are valid:
   - Confirmation dialog appears
   - User confirms the action
   - Employee is created/updated

---

## Examples

### ✅ Valid Submission
```
First Name: John
Last Name: Smith
Email: john.smith@example.com
Password: SecurePass123
Contact: (555) 123-4567
Address: 123 Main Street, Springfield, IL
Date of Birth: 1995-05-15
Date Hired: 2024-01-01
Role: Barista
Status: Active
Schedule: Monday
```

### ❌ Invalid Submission (Examples)
```
First Name: "" → Error: "First Name is required"
First Name: "J" → Error: "First Name must be at least 2 characters"
First Name: "John123" → Error: "First Name can only contain letters, spaces, hyphens, and apostrophes"

Email: "john@invalid" → Error: "Email format is invalid (e.g., user@example.com)"

Password: "weak" → Error: "Password must be at least 6 characters"
Password: "weakpass" → Error: "Password must contain at least one uppercase letter"
Password: "WeakPass" → Error: "Password must contain at least one number"

Contact: "555-12" → Error: "Contact Number must contain at least 7 digits"
Contact: "555-abc-1234" → Error: "Contact Number can only contain numbers, spaces, +, -, and parentheses"

Date of Birth: "2015-01-01" → Error: "Employee must be at least 16 years old"

Date Hired: "2099-01-01" → Error: "Date Hired cannot be in the future"
```

---

## Implementation Details

- **File Modified**: `src/pages/HRSystem.jsx`
- **Validation Function**: `validateEmployeeForm()`
- **Field Validators**: `isFieldValid()` (per-field validation)
- **Visual Helper**: `getFieldBorderColor()` (determines border color)
- **Error Display**: Notification component (top-right corner)

