import React from 'react'

export default function ProfileCard({ employee, colors }) {
  return (
    <div style={{ background: colors.white, padding: 25, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#6B7C65', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: 30 }}>
        {employee?.User?.FirstName?.charAt(0)}
      </div>
      <div>
        <h1 style={{ margin: 0, color: '#4A5D4B', fontSize: 24 }}>{employee?.User?.FirstName} {employee?.User?.LastName}</h1>
        <p style={{ margin: '5px 0 0', color: '#888', fontSize: 14 }}>{employee?.User?.RoleName}</p>
      </div>
    </div>
  )
}
