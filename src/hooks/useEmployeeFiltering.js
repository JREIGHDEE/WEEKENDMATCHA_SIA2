import { useState, useCallback } from 'react'
import { fetchAllEmployees } from '../services/employeeService'

export const useEmployeeFiltering = () => {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('Name')

  const filterEmployees = useCallback((employees, searchTerm, filterCategory) => {
    let result = employees
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      result = result.filter(e => {
        if (filterCategory === 'Name') {
          return (e.User?.FirstName?.toLowerCase().includes(lowerTerm) || e.User?.LastName?.toLowerCase().includes(lowerTerm))
        } else if (filterCategory === 'ID') {
          return e.EmployeeID?.toString().includes(lowerTerm)
        } else if (filterCategory === 'Role') {
          return e.User?.RoleName?.toLowerCase().includes(lowerTerm)
        } else if (filterCategory === 'Status') {
          return e.EmployeeStatus?.toLowerCase().includes(lowerTerm)
        } else if (filterCategory === 'Date Hired') {
          return e.DateHired?.includes(searchTerm) 
        }
        return false
      })
    }
    return result
  }, [])

  const updateFilteredEmployees = useCallback(() => {
    const filtered = filterEmployees(employees, searchTerm, filterCategory)
    setFilteredEmployees(filtered)
  }, [employees, searchTerm, filterCategory, filterEmployees])

  return {
    employees,
    setEmployees,
    filteredEmployees,
    setFilteredEmployees,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    updateFilteredEmployees
  }
}
