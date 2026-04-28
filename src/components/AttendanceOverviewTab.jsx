import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import SearchFilterBar from './SearchFilterBar'

function AttendanceOverviewTab({ employees, colors, searchTerm = '', setSearchTerm, btnStyle, setActiveView, PaginationControls, filterCategory = 'FirstName', setFilterCategory, showFilterMenu = false, setShowFilterMenu, searchContainerRef }) {
  const [attendanceData, setAttendanceData] = useState([])
  const [filteredAttendanceData, setFilteredAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM format
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [sortBy, setSortBy] = useState('name') // 'name', 'present', 'incomplete', 'absent'
  const [sortOrder, setSortOrder] = useState('asc') // 'asc', 'desc'
  
  useEffect(() => {
    fetchAllAttendanceOverview()
  }, [selectedMonth])
  
  const fetchAllAttendanceOverview = async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-').map(Number)
      
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]
      
      const { data: attendanceRecords } = await supabase
        .from('Attendance')
        .select('*')
        .gte('Date', startDate)
        .lte('Date', endDate)
      
      // Only aggregate for ACTIVE employees who have records in this month
      const summary = {}
      
      if (attendanceRecords && attendanceRecords.length > 0) {
        attendanceRecords.forEach(record => {
          const emp = employees.find(e => e.EmployeeID === record.EmployeeID && e.EmployeeStatus === 'Active')
          if (emp) {
            if (!summary[record.EmployeeID]) {
              summary[record.EmployeeID] = {
                employeeId: record.EmployeeID,
                name: `${emp.User?.FirstName} ${emp.User?.LastName}`,
                status: emp.EmployeeStatus,
                present: 0,
                incomplete: 0,
                absent: 0
              }
            }
            
            if (record.status === 'Completed') {
              summary[record.EmployeeID].present++
            } else if (record.status === 'Incomplete') {
              summary[record.EmployeeID].incomplete++
            }
          }
        })
      }
      
      const data = Object.values(summary)
      setAttendanceData(data)
      filterAttendanceData(data, searchTerm)
    } catch (error) {
      console.error('Error fetching attendance overview:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Filter attendance data by search term
  const filterAttendanceData = (data, term) => {
    if (!term || term.trim() === '') {
      setFilteredAttendanceData(data)
      return
    }
    
    const filtered = data.filter(emp => 
      emp.name.toLowerCase().includes(term.toLowerCase()) ||
      emp.status.toLowerCase().includes(term.toLowerCase())
    )
    setFilteredAttendanceData(filtered)
  }
  
  // Update filtered data when search term changes
  useEffect(() => {
    filterAttendanceData(attendanceData, searchTerm)
  }, [searchTerm, attendanceData])

  // Sorting function
  const handleHeaderClick = (columnName) => {
    if (sortBy === columnName) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortBy(columnName)
      setSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const getSortedData = (data) => {
    const sorted = [...data].sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        case 'present':
          aValue = a.present
          bValue = b.present
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
        case 'incomplete':
          aValue = a.incomplete
          bValue = b.incomplete
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
        case 'absent':
          aValue = a.absent
          bValue = b.absent
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
        default:
          return 0
      }
    })
    return sorted
  }

  const getSortArrow = (columnName) => {
    const arrow = sortBy !== columnName ? '↕' : (sortOrder === 'asc' ? '↑' : '↓')
    return <span style={{ fontWeight: 'bold', fontSize: '16px', marginLeft: '4px' }}>{arrow}</span>
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Inactive':
        return '#ccc'
      case 'On Leave':
        return '#FFD700'
      case 'Active':
      default:
        return colors.green
    }
  }
  
  // Paginate data
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }
  
  const sortedData = getSortedData(filteredAttendanceData)
  const paginatedData = paginate(sortedData, currentPage, pageSize)
  
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Top Controls: Search + Calendar Picker + Back Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", marginBottom: "15px", flexShrink: 0 }}>
        {/* Search Bar - Using SearchFilterBar */}
        <div style={{ width: "300px" }}>
          <SearchFilterBar 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            showFilterMenu={showFilterMenu}
            setShowFilterMenu={setShowFilterMenu}
            searchContainerRef={searchContainerRef}
            colors={colors}
          />
        </div>

        {/* Month Picker & Back Button */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Month Picker */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              fontSize: "13px",
              cursor: "pointer",
              backgroundColor: "white",
              color: "#333"
            }}
          />
          
          {/* Back Button */}
          <button 
            style={{...btnStyle, background: colors.darkGreen, padding: "8px 15px", fontSize: "13px"}} 
            onClick={() => setActiveView('employees')}
          >
            EMPLOYEES
          </button>
        </div>
      </div>

      {/* Table Container - Fills remaining space */}
      <div style={{ 
        flex: 1, 
        background: "white", 
        borderRadius: "15px", 
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)", 
        display: "flex", 
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Scrollable Table */}
        <div style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: colors.green, color: "white", position: "sticky", top: 0, zIndex: 1 }}>
              <tr>
                <th 
                  onClick={() => handleHeaderClick('name')}
                  style={{ padding: "15px", textAlign: "left", fontWeight: "bold", cursor: "pointer", userSelect: "none" }}
                  title="Click to sort"
                >
                  Employee{getSortArrow('name')}
                </th>
                <th style={{ padding: "15px", textAlign: "center", fontWeight: "bold" }}>Status</th>
                <th 
                  onClick={() => handleHeaderClick('present')}
                  style={{ padding: "15px", textAlign: "center", fontWeight: "bold", background: "#4CAF50", cursor: "pointer", userSelect: "none" }}
                  title="Click to sort"
                >
                  Present{getSortArrow('present')}
                </th>
                <th 
                  onClick={() => handleHeaderClick('incomplete')}
                  style={{ padding: "15px", textAlign: "center", fontWeight: "bold", background: "#FF9800", cursor: "pointer", userSelect: "none" }}
                  title="Click to sort"
                >
                  Incomplete{getSortArrow('incomplete')}
                </th>
                <th 
                  onClick={() => handleHeaderClick('absent')}
                  style={{ padding: "15px", textAlign: "center", fontWeight: "bold", background: "#F44336", cursor: "pointer", userSelect: "none" }}
                  title="Click to sort"
                >
                  Absent{getSortArrow('absent')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#666" }}>Loading...</td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#666" }}>No employees found</td></tr>
              ) : (
                paginatedData.map(emp => (
                  <tr key={emp.employeeId} style={{ borderBottom: "1px solid #eee", height: "50px" }}>
                    <td style={{ padding: "15px", fontWeight: "bold" }}>{emp.name}</td>
                    <td style={{ padding: "15px", textAlign: "center" }}>
                      <span style={{ 
                        padding: "4px 12px", 
                        borderRadius: "12px", 
                        background: getStatusColor(emp.status),
                        color: emp.status === 'Inactive' ? '#666' : "white",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ padding: "15px", textAlign: "center", color: "#4CAF50", fontWeight: "bold", fontSize: "15px" }}>{emp.present}</td>
                    <td style={{ padding: "15px", textAlign: "center", color: "#FF9800", fontWeight: "bold", fontSize: "15px" }}>{emp.incomplete}</td>
                    <td style={{ padding: "15px", textAlign: "center", color: "#F44336", fontWeight: "bold", fontSize: "15px" }}>{emp.absent}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls at Bottom */}
        {!loading && filteredAttendanceData.length > 0 && (
          <PaginationControls 
            total={sortedData.length} 
            page={currentPage} 
            setPage={setCurrentPage} 
            perPage={pageSize} 
          />
        )}
      </div>
    </div>
  )
}

export default AttendanceOverviewTab
