import React from 'react'

export const PaginationControls = ({ total, page, setPage, perPage }) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "15px", gap: "15px", alignItems: "center", color: "#888", fontWeight: "bold", marginTop: "10px", borderTop: "1px solid #f0f0f0" }}>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
        <span 
            key={num} 
            onClick={() => setPage(num)} 
            style={{ cursor: "pointer", color: page === num ? "#333" : "#ccc", transform: page === num ? "scale(1.2)" : "scale(1)", fontSize: "16px" }}
        >
            {num}
        </span>
      ))}
      <span onClick={() => setPage(p => Math.min(p + 1, totalPages))} style={{ cursor: "pointer", fontSize: "18px" }}>&gt;</span>
    </div>
  )
}