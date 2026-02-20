import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import logo from '../assets/wm-logo.svg'
import { Notification } from '../components/Notification'

// --- HELPER: PAGINATION ---
const PaginationControls = ({ total, page, setPage, perPage }) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "15px", gap: "15px", alignItems: "center", color: "#888", fontWeight: "bold", marginTop: "auto", borderTop: "1px solid #f0f0f0" }}>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
        <span key={num} onClick={() => setPage(num)} style={{ cursor: "pointer", color: page === num ? "#333" : "#ccc", transform: page === num ? "scale(1.2)" : "scale(1)", fontSize: "16px" }}>{num}</span>
      ))}
      <span onClick={() => setPage(p => Math.min(p + 1, totalPages))} style={{ cursor: "pointer", fontSize: "18px" }}>&gt;</span>
    </div>
  )
}

function InventorySystem() {
  const navigate = useNavigate()

  // --- STATE ---
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [archiveLogs, setArchiveLogs] = useState([]) 
  const [selectedId, setSelectedId] = useState(null)
const [loading, setLoading] = useState(true)
  const [expiringCount, setExpiringCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0) // <-- ADDED THIS

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7
  const [archivePage, setArchivePage] = useState(1)

  // --- NEW SEARCH & FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All') // Default 'All'
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const searchContainerRef = useRef(null)

  // Notification State
  const [notification, setNotification] = useState({ message: '', type: 'success' })

  // Modals
  const [modals, setModals] = useState({
    add: false, confirmAdd: false, update: false, archive: false, viewLog: false 
  })

  // Form Data
  const initialFormState = {
    ItemName: '', Category: 'Ingredients', Quantity: '', UnitMeasurement: 'grams',
    UnitPrice: '', ReorderThreshold: '', Expiry: ''
  }
  const [formData, setFormData] = useState(initialFormState)
  const [archiveReason, setArchiveReason] = useState('')

// --- 1. FETCH INVENTORY ---
  async function fetchInventory() {
    setLoading(true)
    const { data, error } = await supabase
      .from('Inventory')
      .select('*')
      .order('InventoryID', { ascending: false }) 

    if (error) {
        setInventory([]) 
    } else {
        const safeData = data || []
        setInventory(safeData)
        setFilteredInventory(safeData) 

        // Low Stock Logic
        const lowCount = safeData.filter(item => item.Quantity <= item.ReorderThreshold).length;
        setLowStockCount(lowCount);

        // Expiry Count Logic
        const today = new Date()
        const count = safeData.filter(item => {
            if (!item.Expiry) return false
            const expiryDate = new Date(item.Expiry)
            const diffTime = expiryDate - today
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays <= 30 && diffDays >= 0 
        }).length
        setExpiringCount(count)
    }
    setLoading(false)
  } // <-- THIS WAS MISSING

// --- 2. FETCH ARCHIVE LOGS ---
  async function fetchArchiveLogs() {
    const { data, error } = await supabase
        .from('InventoryArchive')
        .select(`*, Employee (User (FirstName, LastName))`)
        .order('ArchivedDate', { ascending: false })
    
    if (error) console.error("Archive Error:", error)
    else setArchiveLogs(data || [])
  }

// --- REAL-TIME & INITIAL FETCH ---
  useEffect(() => {
    // 1. Initial load of data
    fetchInventory();

    // 2. Set up real-time listener
    const subscription = supabase
        .channel('inventory-changes')
        .on('postgres_changes', { 
            event: '*', 
            table: 'Inventory', 
            schema: 'public' 
        }, () => {
            console.log("Inventory change detected! Refreshing...");
            fetchInventory(); // This refreshes your table and alert banners automatically
        })
        .subscribe();

    // 3. Clean up subscription when user leaves page
    return () => {
        supabase.removeChannel(subscription);
    };
  }, []); // Empty dependency array means this runs once on mount

  // --- 3. NEW SEARCH & FILTER LOGIC ---
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowFilterMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchContainerRef])

  // Filter Logic
  useEffect(() => {
    let result = inventory
    const lowerTerm = searchTerm.toLowerCase()

    if (searchTerm) {
        result = result.filter(item => {
            // Helper to safe check strings
            const check = (val) => (val ? String(val).toLowerCase().includes(lowerTerm) : false)

            if (filterCategory === 'All') {
                return check(item.ItemName) || check(item.Category) || check(item.InventoryID)
            } else if (filterCategory === 'ID') {
                return check(item.InventoryID)
            } else if (filterCategory === 'Item Name') {
                return check(item.ItemName)
            } else if (filterCategory === 'Category') {
                return check(item.Category)
            } else if (filterCategory === 'Stock In') {
                return check(new Date(item.StockIn).toLocaleDateString())
            } else if (filterCategory === 'Price') {
                return check(item.UnitPrice)
            }
            return false
        })
    }
    setFilteredInventory(result)
    setCurrentPage(1)
  }, [searchTerm, filterCategory, inventory])


  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const closeModal = () => {
    setModals({ add: false, confirmAdd: false, update: false, archive: false, viewLog: false })
    setFormData(initialFormState)
    setArchiveReason('')
    setSelectedId(null)
  }

  // --- ADD ITEM ---
  const handleAddSubmit = (e) => {
    e.preventDefault()
    if(!formData.ItemName || !formData.Quantity || !formData.UnitPrice || !formData.Expiry) {
        setNotification({ message: "Please fill in all required fields.", type: 'error' })
        return
    }
    setModals({ ...modals, add: false, confirmAdd: true })
  }

  const executeAddItem = async () => {
    const currentDateTime = new Date().toISOString() 
    const { error } = await supabase.from('Inventory').insert([{
        ItemName: formData.ItemName,
        Category: formData.Category,
        Quantity: parseFloat(formData.Quantity),
        UnitMeasurement: formData.UnitMeasurement,
        UnitPrice: parseFloat(formData.UnitPrice),
        ReorderThreshold: parseInt(formData.ReorderThreshold),
        Expiry: formData.Expiry,
        StockIn: currentDateTime 
    }])

    if (error) setNotification({ message: "Database Error: " + error.message, type: 'error' })
    else {
        setNotification({ message: "Item Added Successfully!", type: 'success' })
        closeModal()
        setTimeout(() => fetchInventory(), 500) 
    }
  }

  // --- UPDATE ITEM ---
  const prepareUpdate = () => {
    if (!selectedId) {
      setNotification({ message: "Please select an item to update.", type: 'error' })
      return
    }
    const item = inventory.find(i => i.InventoryID === selectedId)
    setFormData(item)
    setModals({ ...modals, update: true })
  }

  const executeUpdate = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('Inventory').update({
        ItemName: formData.ItemName,
        Category: formData.Category,
        Quantity: parseFloat(formData.Quantity),
        UnitMeasurement: formData.UnitMeasurement,
        UnitPrice: parseFloat(formData.UnitPrice),
        ReorderThreshold: parseInt(formData.ReorderThreshold),
        Expiry: formData.Expiry
    }).eq('InventoryID', selectedId)

    if (error) setNotification({ message: "Error: " + error.message, type: 'error' })
    else {
        setNotification({ message: "Item Updated Successfully!", type: 'success' })
        fetchInventory()
        closeModal()
    }
  }

  // --- 4. FIXED ARCHIVE LOGIC ---
  const executeArchive = async () => {
    if (!archiveReason) {
      setNotification({ message: "Please provide a reason.", type: 'error' })
      return
    }
    
    const itemToArchive = inventory.find(i => i.InventoryID === selectedId)
    if (!itemToArchive) {
      setNotification({ message: "Item not found.", type: 'error' })
      return
    }

    // A. Get Current Employee ID (With Fallback)
    const { data: { user } } = await supabase.auth.getUser()
    let employeeID = null
    
    if (user) {
        const { data: empData } = await supabase
            .from('Employee')
            .select('EmployeeID')
            .eq('UserID', user.id)
            .maybeSingle()
        if (empData) employeeID = empData.EmployeeID
    }

    // B. Combine details into Reason (Since table structure is limited)
    const combinedReason = `[${itemToArchive.Category}] ${itemToArchive.ItemName} - ${archiveReason}`

    // C. Insert into Archive
    const { error: archiveError } = await supabase.from('InventoryArchive').insert([{
        EmployeeID: employeeID, // Can be null if no employee record found
        ArchivedDate: new Date(),
        Reason: combinedReason
    }])

    if (archiveError) {
        console.error("Archive Insert Error:", archiveError)
        alert("Error saving to log: " + archiveError.message + "\nCheck console for details.")
        return
    }

    // D. Delete from Main Table
    const { error: deleteError } = await supabase
        .from('Inventory')
        .delete()
        .eq('InventoryID', selectedId)

    if (deleteError) {
        alert("Error deleting item: " + deleteError.message)
    } else {
        setNotification({ message: "Item Archived Successfully.", type: 'success' })
        fetchInventory()
        closeModal()
    }
  }

  const openArchiveLog = () => {
      fetchArchiveLogs()
      setModals({...modals, viewLog: true})
  }

  // --- STYLES ---
  const colors = { green: "#6B7C65", beige: "#E8DCC6", darkGreen: "#4A5D4B", red: "#D9534F", yellow: "#D4AF37", orange: "#E67E22", blue: "#337AB7" }
  const btnStyle = { padding: "8px 16px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", color: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const modalContent = { background: "white", padding: "30px", borderRadius: "15px", width: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", position: "relative" }
  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "14px", outline: "none", marginBottom: "15px" }
  const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }
  
  // Pill Button Style
  const pillBtn = (active) => ({ 
    padding: "5px 15px", 
    borderRadius: "20px", 
    border: "1px solid #666", 
    background: active ? colors.green : "white", 
    color: active ? "white" : "black", 
    cursor: "pointer", 
    fontSize: "12px", 
    fontWeight: "bold" 
  })

  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}}>Inventory System ➤</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/sales-system')}>Sales System</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/hr-system')}>Human Resource</div>
        <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: colors.beige, padding: "30px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: colors.darkGreen }}>Inventory Management</h1>
        </div>

{/* ALERT BANNERS */}
<div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
    {/* Existing Expiry Banner */}
    {expiringCount > 0 && (
        <div style={{ flex: 1, background: colors.orange, color: "white", padding: "15px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div>
                <div style={{ fontWeight: "bold" }}>{expiringCount} Item(s) Expiring Soon!</div>
            </div>
        </div>
    )}

    {/* NEW: Low Stock Banner */}
    {lowStockCount > 0 && (
        <div style={{ flex: 1, background: colors.red, color: "white", padding: "15px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "24px" }}>📉</span>
            <div>
                <div style={{ fontWeight: "bold" }}>{lowStockCount} Item(s) Below Threshold!</div>
                <div style={{ fontSize: "12px" }}>Items need reordering soon.</div>
            </div>
        </div>
    )}
</div>

        {/* SEARCH & FILTER BAR (UPDATED) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            
            {/* SEARCH INPUT + DROPDOWN */}
            <div style={{ position: "relative" }} ref={searchContainerRef}>
                <input 
                    placeholder={`🔍 Search by ${filterCategory}...`} 
                    style={{ padding: "10px 15px", borderRadius: "25px", border: "1px solid #ccc", width: "300px", outline: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowFilterMenu(true)}
                />
                
                {/* FILTER DROPDOWN */}
                {showFilterMenu && (
                    <div style={{ position: "absolute", top: "115%", left: 0, background: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 5px 20px rgba(0,0,0,0.15)", zIndex: 50, width: "400px", border: "1px solid #eee" }}>
                        <p style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "bold", color: "#888", textTransform: "uppercase" }}>Filter by Category</p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {['All', 'ID', 'Item Name', 'Category', 'Stock In', 'Price'].map(cat => (
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

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", gap: "10px" }}>
                <button style={{...btnStyle, background: colors.darkGreen}} onClick={() => setModals({...modals, add: true})}>ADD</button>
                <button style={{...btnStyle, background: colors.yellow}} onClick={prepareUpdate}>UPDATE</button>
                <button style={{...btnStyle, background: colors.red}} onClick={() => selectedId ? setModals({...modals, archive: true}) : setNotification({ message: "Select an item.", type: 'error' })}>ARCHIVE</button>
                <button style={{...btnStyle, background: colors.blue}} onClick={openArchiveLog}>ARCHIVE LOGS</button>
                {/* <button style={{...btnStyle, background: "#FF9800", marginLeft: "auto"}} onClick={() => { fetchInventory(); setNotification({ message: 'Data refreshed', type: 'success' }) }}>REFRESH</button> */}
            </div>
        </div>

        {/* TABLE */}
        <div style={{ flex: 1, background: "white", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: colors.green, color: "white", zIndex: 1 }}>
                <tr>
                    <th style={{ padding: "15px" }}>Select</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Price</th>
                    <th>Expiry / Alert</th>
                    <th>Stock In</th>
                </tr>
                </thead>
                <tbody>
                {loading && <tr><td colSpan="8" style={{padding:"30px", textAlign:"center"}}>Loading Data...</td></tr>}
                
                {!loading && paginate(filteredInventory, currentPage, itemsPerPage).map(item => {
                    const isLowStock = item.Quantity <= item.ReorderThreshold
                    const safePrice = item.UnitPrice ? parseFloat(item.UnitPrice).toFixed(2) : "0.00"
                    const safeExpiry = item.Expiry ? new Date(item.Expiry).toLocaleDateString() : "N/A"
                    const safeStockIn = item.StockIn ? new Date(item.StockIn).toLocaleString() : "N/A"

                    let daysLeft = 999;
                    if(item.Expiry) {
                        const diffTime = new Date(item.Expiry) - new Date();
                        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    }
                    const isExpiringSoon = daysLeft <= 30 && daysLeft >= 0;
                    const isExpired = daysLeft < 0;

                    return (
                        <tr key={item.InventoryID || Math.random()} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "50px", background: isExpired ? "#ffe6e6" : (isLowStock ? "#fff5f5" : "white") }}>
                            <td>
                                <input type="radio" name="invSelect" checked={selectedId === item.InventoryID} onChange={() => setSelectedId(item.InventoryID)} style={{ transform: "scale(1.5)", cursor: "pointer" }} />
                            </td>
                            <td style={{ fontWeight: "bold" }}>{item.ItemName || "Unknown"}</td>
                            <td><span style={{background: "#eee", padding: "4px 8px", borderRadius: "5px", fontSize: "12px"}}>{item.Category}</span></td>
                            <td style={{ color: isLowStock ? "red" : colors.darkGreen, fontWeight: "bold" }}>
                                {item.Quantity}
                                {isLowStock && <span style={{fontSize:"10px", display:"block"}}>LOW STOCK</span>}
                            </td>
                            <td>{item.UnitMeasurement}</td>
                            <td>₱{safePrice}</td>
                            <td style={{ fontWeight: isExpiringSoon || isExpired ? "bold" : "normal" }}>
                                {safeExpiry}
                                {isExpired && <div style={{ color: "red", fontSize: "11px" }}>⚠️ EXPIRED</div>}
                                {isExpiringSoon && <div style={{ color: colors.orange, fontSize: "11px" }}>⚠️ Expires in {daysLeft} days</div>}
                            </td>
                            <td style={{fontSize:"12px", color:"#777"}}>{safeStockIn}</td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
            <PaginationControls total={filteredInventory.length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
        </div>
      </div>

      {/* --- MODALS --- */}

      {modals.viewLog && (
        <div style={modalOverlay}>
            <div style={{...modalContent, width: "700px"}}>
                <button onClick={closeModal} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" }}>&times;</button>
                <h2 style={{ color: colors.blue, marginTop: 0 }}>Archive Log</h2>
                <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid #eee", borderRadius: "10px", marginBottom: "15px" }}>
                    <table style={{ width: "100%", fontSize: "14px", textAlign: "center", borderCollapse: "collapse" }}>
                        <thead style={{ background: colors.blue, color: "white", position: "sticky", top: 0 }}>
                            <tr>
                                <th style={{padding:"10px"}}>Archived By</th>
                                <th>Details & Reason</th>
                                <th>Date Archived</th>
                                <th>Auto-Delete Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archiveLogs.length === 0 ? (
                                <tr><td colSpan="4" style={{padding:"20px", color:"#999"}}>No archived items found.</td></tr>
                            ) : (
                                paginate(archiveLogs, archivePage, 6).map(log => {
                                    const empName = log.Employee?.User?.FirstName ? `${log.Employee.User.FirstName} ${log.Employee.User.LastName}` : "Unknown User"
                                    const archivedDate = new Date(log.ArchivedDate)
                                    const deleteDate = new Date(archivedDate.getTime() + 90 * 24 * 60 * 60 * 1000)
                                    return (
                                        <tr key={log.InvArchiveID} style={{ borderBottom: "1px solid #eee", height: "40px" }}>
                                            <td style={{fontWeight:"bold"}}>{empName}</td>
                                            <td style={{textAlign:"left", paddingLeft:"20px"}}>{log.Reason}</td>
                                            <td>{new Date(log.ArchivedDate).toLocaleDateString()}</td>
                                            <td style={{ color: new Date() > deleteDate ? "#d32f2f" : "#f57c00", fontWeight: "bold" }}>{deleteDate.toISOString().split('T')[0]}</td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls total={archiveLogs.length} page={archivePage} setPage={setArchivePage} perPage={6} />
                <div style={{textAlign:"right"}}>
                     <button onClick={closeModal} style={{...btnStyle, background: "#ccc", color: "#333"}}>Close</button>
                </div>
            </div>
        </div>
      )}

      {(modals.add || modals.update) && (
        <div style={modalOverlay}>
            <div style={modalContent}>
                <button onClick={closeModal} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" }}>&times;</button>
                <h2 style={{ color: colors.darkGreen, marginTop: 0 }}>{modals.add ? "Add New Item" : "Update Item"}</h2>
                <form onSubmit={modals.add ? handleAddSubmit : executeUpdate}>
                    <label style={labelStyle}>Item Name</label>
                    <input name="ItemName" style={{...inputStyle, opacity: !modals.add ? 0.6 : 1, cursor: !modals.add ? 'not-allowed' : 'auto'}} disabled={!modals.add} value={formData.ItemName} onChange={handleInputChange} required />
                    <div style={{display:"flex", gap:"15px"}}>
                        <div style={{flex:1}}>
                            <label style={labelStyle}>Category</label>
                            <select name="Category" style={inputStyle} value={formData.Category} onChange={handleInputChange}>
                                <option>Ingredients</option>
                                <option>Packaging</option>
                                <option>Equipment</option>
                                <option>Merchandise</option>
                            </select>
                        </div>
                        <div style={{flex:1}}>
                            <label style={labelStyle}>Unit of Measurement</label>
                            <select name="UnitMeasurement" style={{...inputStyle, opacity: !modals.add ? 0.6 : 1, cursor: !modals.add ? 'not-allowed' : 'auto'}} disabled={!modals.add} value={formData.UnitMeasurement} onChange={handleInputChange}>
                                <option value="grams">grams (g)</option>
                                <option value="kg">kilograms (kg)</option>
                                <option value="ml">milliliters (ml)</option>
                                <option value="L">liters (L)</option>
                                <option value="pcs">pieces (pcs)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{display:"flex", gap:"15px"}}>
                        <div style={{flex:1}}>
                             <label style={labelStyle}>Quantity</label>
                             <input type="number" step="0.01" name="Quantity" style={inputStyle} value={formData.Quantity} onChange={handleInputChange} required />
                        </div>
                        <div style={{flex:1}}>
                             <label style={labelStyle}>Unit Price (₱)</label>
                             <input type="number" step="0.01" name="UnitPrice" style={inputStyle} value={formData.UnitPrice} onChange={handleInputChange} required />
                        </div>
                    </div>
                    <div style={{display:"flex", gap:"15px"}}>
                        <div style={{flex:1}}>
                             <label style={labelStyle}>Low Alert Threshold</label>
                             <input type="number" name="ReorderThreshold" style={inputStyle} value={formData.ReorderThreshold} onChange={handleInputChange} required />
                        </div>
                        {modals.add && (
                          <div style={{flex:1}}>
                               <label style={labelStyle}>Expiry Date</label>
                               <input type="date" name="Expiry" style={inputStyle} value={formData.Expiry} onChange={handleInputChange} required />
                          </div>
                        )}
                    </div>
                    <div style={{display:"flex", justifyContent:"flex-end", gap:"10px"}}>
                        <button type="button" onClick={closeModal} style={{...btnStyle, background: "#ccc", color: "#333"}}>Cancel</button>
                        <button type="submit" style={{ ...btnStyle, background: "#5a6955", color: "white" }}>{modals.add ? "Next" : "Save Changes"}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {modals.confirmAdd && (
        <div style={{ ...modalOverlay, zIndex: 1100 }}>
            <div style={{ ...modalContent, width: "400px", textAlign: "center" }}>
                <h2 style={{ color: colors.darkGreen }}>Confirm Addition</h2>
                <p style={{color:"#666"}}>Please validate the details before adding.</p>
                <div style={{textAlign:"left", background:"#f9f9f9", padding:"15px", borderRadius:"10px", fontSize:"14px", marginBottom:"20px"}}>
                    <p><b>Name:</b> {formData.ItemName}</p>
                    <p><b>Category:</b> {formData.Category}</p>
                    <p><b>Quantity:</b> {formData.Quantity} {formData.UnitMeasurement}</p>
                    <p><b>Price:</b> ₱{parseFloat(formData.UnitPrice).toFixed(2)}</p>
                    <p><b>Expires:</b> {formData.Expiry}</p>
                    <p style={{color: colors.green}}><b>Stock In:</b> Automatic (Now)</p>
                </div>
<div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
    <button onClick={() => setModals({ ...modals, confirmAdd: false, add: true })} style={{ ...btnStyle, background: "#ccc", color: "#333" }}>
        Edit
    </button>
    <button onClick={executeAddItem} style={{ ...btnStyle, background: "#5a6955", color: "white" }}>
        Confirm & Add
    </button>
</div>
            </div>
        </div>
      )}

      {modals.archive && (
        <div style={modalOverlay}>
            <div style={modalContent}>
                <button onClick={closeModal} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" }}>&times;</button>
                <h2 style={{ color: colors.red, marginTop: 0 }}>Archive Item</h2>
                <p>Are you sure you want to remove this item?</p>
                <label style={labelStyle}>Reason</label>
                <textarea style={{...inputStyle, height:"80px"}} value={archiveReason} onChange={e => setArchiveReason(e.target.value)} placeholder="e.g. Discontinued product" />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button onClick={closeModal} style={{...btnStyle, background: "#ccc", color: "#333"}}>Cancel</button>
                    <button onClick={executeArchive} style={{...btnStyle, background: colors.red}}>Confirm</button>
                </div>
            </div>
        </div>
      )}

      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: 'success' })} 
      />
    </div>
  )
}

export default InventorySystem