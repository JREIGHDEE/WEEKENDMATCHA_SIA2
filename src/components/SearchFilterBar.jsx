import { HiOutlineSearch } from 'react-icons/hi'

function SearchFilterBar({ searchTerm, setSearchTerm, filterCategory, setFilterCategory, showFilterMenu, setShowFilterMenu, searchContainerRef, colors }) {
  const pillBtn = (active) => ({ padding: "6px 16px", borderRadius: "20px", border: active ? "1px solid transparent" : "1px solid #d8d2c4", background: active ? colors.green : "white", color: active ? "white" : "#444", cursor: "pointer", fontSize: "12px", fontWeight: "bold", transition: "background 0.15s ease" })

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", position: "relative" }} ref={searchContainerRef}>
      <div style={{ position: "relative", width: "100%" }}>
        <HiOutlineSearch size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
        <input
          placeholder={`Search by ${filterCategory}...`}
          style={{ padding: "8px 14px 8px 36px", borderRadius: "20px", border: "1px solid #ddd", width: "100%", minWidth: "220px", boxSizing: "border-box", outline: "none" }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowFilterMenu(true)}
        />
      </div>
      {showFilterMenu && (
        <div style={{ position: "absolute", top: "110%", left: 0, background: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 10px 28px rgba(30,35,25,0.16)", zIndex: 50, border: "1px solid #ddd", width: "min(380px, 90vw)" }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "bold", color: "#555" }}>Filter by Category:</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {['ID', 'Name', 'Role', 'Date Hired'].map(cat => (
              <button
                key={cat}
                className="btn-animated"
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
