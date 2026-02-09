import { useState } from 'react'

function SearchFilterBar({ searchTerm, setSearchTerm, filterCategory, setFilterCategory, showFilterMenu, setShowFilterMenu, searchContainerRef, colors }) {
  const pillBtn = (active) => ({ padding: "5px 15px", borderRadius: "20px", border: "1px solid #666", background: active ? colors.green : "white", color: active ? "white" : "black", cursor: "pointer", fontSize: "12px", fontWeight: "bold" })

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", position: "relative" }} ref={searchContainerRef}>
      <input 
        placeholder={`🔍 Search by ${filterCategory}...`} 
        style={{ padding: "8px", borderRadius: "20px", border: "1px solid #ccc", width: "250px", cursor: "pointer" }} 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        onFocus={() => setShowFilterMenu(true)} 
      />
      {showFilterMenu && (
        <div style={{ position: "absolute", top: "110%", left: 0, background: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", zIndex: 50, border: "1px solid #ddd", width: "380px" }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold", color: "#555" }}>Filter by Category:</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {['ID', 'Name', 'Role', 'Status', 'Date Hired'].map(cat => (
              <button 
                key={cat} 
                style={pillBtn(filterCategory === cat)} 
                onClick={() => { setFilterCategory(cat); setShowFilterMenu(false) }}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchFilterBar
