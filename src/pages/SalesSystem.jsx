import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import logo from '../assets/wm-logo.svg'

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

// --- HELPER: SIMPLE BAR CHART ---
const SimpleBarChart = ({ data }) => {
    // Prevent crash if data is empty
    const maxVal = data.length > 0 ? Math.max(...data.map(d => d.value)) : 100; 
    return (
        <div style={{ display: "flex", alignItems: "flex-end", height: "150px", gap: "20px", padding: "10px 0", borderBottom: "1px solid #ccc" }}>
            {data.map((item, index) => (
                <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{ 
                        width: "40px", 
                        height: `${(item.value / maxVal) * 100}%`, 
                        background: "#6B7C65", 
                        borderRadius: "5px 5px 0 0",
                        transition: "height 0.5s ease"
                    }}></div>
                    <span style={{ fontSize: "12px", marginTop: "5px", color: "#555" }}>{item.label}</span>
                </div>
            ))}
        </div>
    )
}

function SalesSystem() {
  const navigate = useNavigate()

  // --- STATE ---
  const [transactions, setTransactions] = useState([]) // Initialized empty (Real Data)
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Metrics & Chart
  const [metrics, setMetrics] = useState({ todaySales: 0, monthlySales: 0, totalProfit: 0, totalDiscounts: 0 })
  const [chartData, setChartData] = useState([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [archivePage, setArchivePage] = useState(1)
  const archivePerPage = 5

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('Description') 
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const searchContainerRef = useRef(null)

  // Modals
  const [modals, setModals] = useState({
    add: false, update: false, archive: false, confirmation: false, archiveLog: false 
  })
  
  // Form Data
  const [salesFormData, setSalesFormData] = useState({
    type: 'Income',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    amount: '',
    enteredBy: 'Current User',
    description: '',
    status: 'Completed'
  })

  const [archiveReason, setArchiveReason] = useState('')
  const [archiveLogs, setArchiveLogs] = useState([])
  const [confirmationAction, setConfirmationAction] = useState(null)
  const [confirmationMsg, setConfirmationMsg] = useState({ title: '', message: '' })

  // --- DATA FETCHING (READ FROM SUPABASE) ---
  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('FinancialRecord')
      .select(`
        *,
        Employee (
          User (FirstName, LastName)
        )
      `)
      .order('TransactionDate', { ascending: false })

    if (error) {
      console.error("Error fetching transactions:", error)
    } else {
      const formattedData = data.map(item => ({
        id: `F${String(item.RecordID).padStart(3, '0')}`,
        date: new Date(item.TransactionDate).toLocaleString('en-US', { 
            month: 'short', day: '2-digit', year: 'numeric', 
            hour: 'numeric', minute: 'numeric', hour12: true 
        }).toUpperCase(), 
        rawDate: item.TransactionDate, // Keep raw date for calculations
        desc: item.Description,
        amount: item.Amount,
        type: item.RecordType,
        status: item.Status,
        enteredBy: item.Employee?.User?.FirstName || 'System'
      }))

      setTransactions(formattedData)
      setFilteredTransactions(formattedData)
    }
    setLoading(false)
  }

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchTransactions()
  }, [])

  // --- CALCULATE METRICS & CHART ---
  useEffect(() => {
    if (transactions.length === 0) return

    const todayStr = new Date().toLocaleDateString('en-US') 
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    let todayTotal = 0
    let monthTotal = 0
    let totalIncome = 0
    let totalExpense = 0
    
    transactions.forEach(t => {
        const tDate = new Date(t.rawDate || t.date)
        const amount = parseFloat(t.amount) || 0

        if (t.status === 'Completed') {
            if (t.type === 'Income') {
                totalIncome += amount
                if (tDate.toLocaleDateString('en-US') === todayStr) todayTotal += amount
                if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) monthTotal += amount
            } else if (t.type === 'Expense') {
                totalExpense += amount
            }
        }
    })

    setMetrics({
        todaySales: todayTotal,
        monthlySales: monthTotal,
        totalProfit: totalIncome - totalExpense,
        totalDiscounts: 0 
    })

    // Chart Data (Last 7 Days)
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const fullDateStr = d.toLocaleDateString('en-US')
        const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        const daySum = transactions
            .filter(t => t.type === 'Income' && t.status === 'Completed')
            .filter(t => new Date(t.rawDate || t.date).toLocaleDateString('en-US') === fullDateStr)
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
            
        last7Days.push({ label: dayStr, value: daySum })
    }
    setChartData(last7Days)

  }, [transactions])

  // --- SEARCH LOGIC ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowFilterMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchContainerRef])

  useEffect(() => {
    let result = transactions
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      result = result.filter(t => {
        if (filterCategory === 'Description') return t.desc.toLowerCase().includes(lowerTerm)
        else if (filterCategory === 'ID') return t.id.toLowerCase().includes(lowerTerm)
        else if (filterCategory === 'Type') return t.type.toLowerCase().includes(lowerTerm)
        else if (filterCategory === 'Status') return t.status.toLowerCase().includes(lowerTerm)
        return false
      })
    }
    setFilteredTransactions(result)
    setCurrentPage(1) 
  }, [transactions, searchTerm, filterCategory])

  // --- HELPER FUNCTIONS ---
  const paginate = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage
    return items.slice(startIndex, startIndex + perPage)
  }

  const triggerConfirmation = (action, title, message) => {
    setConfirmationAction(() => action)
    setConfirmationMsg({ title, message })
    setModals({ ...modals, confirmation: true })
  }

  const confirmAction = () => {
    if (confirmationAction) confirmationAction()
    setModals({ ...modals, confirmation: false })
  }

  const closeModal = () => {
    setModals({ add: false, update: false, archive: false, confirmation: false, archiveLog: false })
    setConfirmationAction(null)
    setSelectedId(null)
  }

  // --- 1. ADD SALE ---
  const prepareAddSale = async () => {
    // Fetch current user name for the "Entered By" field
    const { data: { user } } = await supabase.auth.getUser()
    const { data: empData } = await supabase.from('Employee').select('User(FirstName)').eq('UserID', user.id).maybeSingle()
    const userName = empData?.User?.FirstName || 'Current User'

    setSalesFormData({
      type: 'Income',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      amount: '',
      enteredBy: userName,
      description: '',
      status: 'Completed'
    })
    setModals({ ...modals, add: true })
  }

  const handleAddConfirmation = (e) => {
    e.preventDefault()
    triggerConfirmation(
      executeAddSale,
      "Add Record",
      "Are you sure you want to add this record? Please review the details."
    )
  }

  const executeAddSale = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: empData } = await supabase.from('Employee').select('EmployeeID').eq('UserID', user.id).maybeSingle()
    const empID = empData ? empData.EmployeeID : 1 

    const transactionDateTime = new Date(`${salesFormData.date} ${salesFormData.time}`).toISOString()

    const { error } = await supabase
      .from('FinancialRecord')
      .insert([{
        EmployeeID: empID,
        TransactionDate: transactionDateTime,
        RecordType: salesFormData.type,
        Amount: parseFloat(salesFormData.amount),
        Description: salesFormData.description,
        Status: salesFormData.status
      }])

    if (error) {
      alert("Database Error: " + error.message)
    } else {
      alert("Record Added Successfully!")
      fetchTransactions()
      closeModal()
    }
  }

  // --- 2. UPDATE SALE ---
  const prepareUpdateSale = () => {
    if (!selectedId) return alert("⚠️ Please select a record to update first.")
    
    const transactionToUpdate = transactions.find(t => t.id === selectedId)
    if (!transactionToUpdate) return

    // Parse date for inputs
    const tDate = new Date(transactionToUpdate.rawDate || transactionToUpdate.date)
    const dateInput = tDate.toISOString().split('T')[0]
    const timeInput = tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

    setSalesFormData({
      type: transactionToUpdate.type,
      date: dateInput,
      time: timeInput,
      amount: transactionToUpdate.amount,
      enteredBy: transactionToUpdate.enteredBy,
      description: transactionToUpdate.desc,
      status: transactionToUpdate.status
    })
    setModals({ ...modals, update: true })
  }

  const handleUpdateConfirmation = (e) => {
    e.preventDefault()
    triggerConfirmation(
      executeUpdateSale,
      "Update Record",
      "Are you sure you want to update this record?"
    )
  }

  const executeUpdateSale = async () => {
    // Need DB ID
    const transaction = transactions.find(t => t.id === selectedId)
    const dbId = parseInt(transaction.id.replace('F', ''))
    const transactionDateTime = new Date(`${salesFormData.date} ${salesFormData.time}`).toISOString()

    const { error } = await supabase
        .from('FinancialRecord')
        .update({
            TransactionDate: transactionDateTime,
            RecordType: salesFormData.type,
            Amount: parseFloat(salesFormData.amount),
            Description: salesFormData.description,
            Status: salesFormData.status
        })
        .eq('RecordID', dbId)

    if (error) alert("Error updating: " + error.message)
    else {
        alert("Record Updated Successfully!")
        fetchTransactions()
        closeModal()
    }
  }

  // --- 3. ARCHIVE SALE ---
  const prepareArchiveSale = () => {
    if (!selectedId) return alert("⚠️ Please select a record to archive first.")
    setArchiveReason('')
    setModals({ ...modals, archive: true })
  }

  const handleArchiveConfirmation = () => {
    if (!archiveReason) return alert("Reason is required.")
    triggerConfirmation(
      executeArchiveSale,
      "Archive Record",
      `Are you sure you want to archive record ${selectedId}?`
    )
  }

  const executeArchiveSale = async () => {
        const transaction = transactions.find(t => t.id === selectedId)
        if (!transaction) return
        const dbId = parseInt(transaction.id.replace('F', ''))

        const { error } = await supabase
            .from('FinancialRecord')
            .update({ Status: 'Archived' })
            .eq('RecordID', dbId)

        if (error) {
            alert("Error archiving: " + error.message)
        } else {
            const newLog = {
                logId: Date.now(),
                originalId: transaction.id,
                category: transaction.type,
                reason: archiveReason,
                archivedBy: 'Current Admin', 
                dateArchived: new Date().toLocaleString()
            }
            setArchiveLogs([newLog, ...archiveLogs])
            
            alert("Record Archived Successfully!")
            fetchTransactions() 
            closeModal()
        }
    }

  // --- STYLES ---
  const colors = { green: "#6B7C65", beige: "#E8DCC6", purple: "#7D4E99", darkGreen: "#4A5D4B", red: "#D9534F", blue: "#337AB7", yellow: "#D4AF37" }
  const btnStyle = { padding: "8px 16px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", color: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }
  const pillBtn = (active) => ({ padding: "5px 15px", borderRadius: "20px", border: "1px solid #666", background: active ? colors.green : "white", color: active ? "white" : "black", cursor: "pointer", fontSize: "12px", fontWeight: "bold" })
  const cardStyle = { flex: 1, padding: "20px", borderRadius: "10px", textAlign: "center", color: "white" }
  
  // Modal Styles
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const modalContent = { background: "white", padding: "30px", borderRadius: "15px", width: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", position: "relative" }
  const confirmOverlay = { ...modalOverlay, zIndex: 2000 }
  const confirmContent = { ...modalContent, width: "400px", textAlign: "center" }
  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "14px", outline: "none" }
  const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }
  const formRow = { display: "flex", gap: "15px", marginBottom: "15px" }
  const formGroup = { flex: 1 }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR - UPDATED WITH LOGO */}
      <div style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>

        {/* LOGO ADDED HERE */}
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "rgba(255,255,255,0.2)" }} onClick={() => navigate('/personal-view')}>👤 My Personal View</div>
        <div style={{borderTop: "1px solid rgba(255,255,255,0.3)", margin: "10px 0"}}></div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}}>Inventory System</div>
        
        {/* Active State for Sales */}
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}}>Sales System ➤</div>
        
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/hr-system')}>Human Resource</div>
        <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: colors.beige, padding: "30px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: colors.darkGreen }}>Sales Management</h1>
          <button style={{...btnStyle, background: colors.purple}} onClick={() => navigate('/sales-reports')} >VIEW REPORT</button>
        </div>

        {/* SEARCH & FILTER */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", position: "relative" }} ref={searchContainerRef}>
          <input placeholder={`🔍 Search by ${filterCategory}...`} style={{ padding: "8px", borderRadius: "20px", border: "1px solid #ccc", width: "250px", cursor: "pointer" }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setShowFilterMenu(true)} />
          {showFilterMenu && (
            <div style={{ position: "absolute", top: "110%", left: 0, background: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", zIndex: 50, border: "1px solid #ddd", width: "300px" }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold", color: "#555" }}>Filter by Category:</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {['Description', 'ID', 'Type', 'Status'].map(cat => (
                  <button key={cat} style={pillBtn(filterCategory === cat)} onClick={() => { setFilterCategory(cat); setShowFilterMenu(false) }}>{cat.toUpperCase()}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button style={{...btnStyle, background: colors.darkGreen}} onClick={prepareAddSale}>ADD</button>
          <button style={{...btnStyle, background: colors.yellow, color: "white"}} onClick={prepareUpdateSale}>UPDATE</button>
          <button style={{...btnStyle, background: colors.red}} onClick={prepareArchiveSale}>ARCHIVE</button>
          <button style={{...btnStyle, background: colors.blue}} onClick={() => setModals({...modals, archiveLog: true})}>VIEW ARCHIVE LOG</button>
        </div>

        {/* MAIN SCROLLABLE AREA */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "5px" }}>
            
            {/* METRICS PANEL (DYNAMIC) */}
            <div style={{ background: colors.green, borderRadius: "15px", padding: "20px", display: "flex", justifyContent: "space-between", marginBottom: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                <div style={cardStyle}>
                    <div style={{fontSize: "14px", opacity: 0.9}}>Today's Total Sales</div>
                    <div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.todaySales.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
                <div style={cardStyle}>
                    <div style={{fontSize: "14px", opacity: 0.9}}>Monthly Sales</div>
                    <div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.monthlySales.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
                <div style={cardStyle}>
                    <div style={{fontSize: "14px", opacity: 0.9}}>Total Discounts Given</div>
                    <div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.totalDiscounts.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
                <div style={cardStyle}>
                    <div style={{fontSize: "14px", opacity: 0.9}}>Total Profit</div>
                    <div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                </div>
            </div>

            {/* CHART SECTION (DYNAMIC) */}
            <div style={{ background: "white", borderRadius: "15px", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0, color: colors.darkGreen }}>Sales Per Day Overview</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}>
                        <span style={{ border: "1px solid #ccc", padding: "5px", borderRadius: "5px" }}>Last 7 Days</span>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{ flex: 3 }}><SimpleBarChart data={chartData} /></div>
                    <div style={{ flex: 1, border: "1px solid #ccc", padding: "15px", borderRadius: "5px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "10px", fontWeight: "bold" }}>Filtered Total Sales</div><div style={{ fontWeight: "bold" }}>₱ {metrics.monthlySales.toLocaleString()}</div></div>
                        <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "10px", fontWeight: "bold" }}>Filtered Discounts</div><div style={{ fontWeight: "bold" }}>₱ 0</div></div>
                        <div><div style={{ fontSize: "10px", fontWeight: "bold" }}>Total Orders</div><div style={{ fontWeight: "bold" }}>{transactions.length}</div></div>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div style={{ background: "white", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: colors.green, color: "white", zIndex: 1 }}>
                    <tr><th style={{ padding: "15px" }}>Select</th><th>Record ID</th><th>Date</th><th>Description</th><th>Amount</th><th>Type</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan="7" style={{padding:"30px", textAlign:"center"}}>Loading Data...</td></tr>}
                    
                    {!loading && paginate(filteredTransactions.filter(t => t.status !== 'Archived'), currentPage, itemsPerPage).map(t => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "50px" }}>
                        <td>
                          <input 
                            type="radio" 
                            name="saleSelect" 
                            checked={selectedId === t.id} 
                            onChange={() => setSelectedId(t.id)} 
                            style={{ transform: "scale(1.5)", cursor: "pointer" }} 
                          />
                        </td>
                        <td>{t.id}</td>
                        <td>{t.date}</td>
                        <td style={{ fontWeight: "bold" }}>{t.desc}</td>
                        <td style={{ fontWeight: "bold" }}>₱{parseFloat(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td style={{ color: t.type === 'Income' ? colors.green : colors.red, fontWeight: "bold" }}>{t.type}</td>
                        <td>{t.status}</td>
                      </tr>
                    ))}
                    {!loading && filteredTransactions.filter(t => t.status !== 'Archived').length === 0 && <tr><td colSpan="7" style={{padding:"20px", textAlign:"center"}}>No records found.</td></tr>}
                  </tbody>
                </table>
                <PaginationControls total={filteredTransactions.filter(t => t.status !== 'Archived').length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
            </div>

        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* CONFIRMATION MODAL */}
      {modals.confirmation && (
        <div style={confirmOverlay}>
          <div style={confirmContent}>
            <h2 style={{ color: colors.darkGreen, marginTop: 0 }}>{confirmationMsg.title}</h2>
            <p style={{ color: "#555", fontSize: "16px", lineHeight: "1.5" }}>{confirmationMsg.message}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginTop: "30px" }}>
              <button onClick={closeModal} style={{...btnStyle, background: "#ccc", color: "#333", fontSize: "16px", padding: "10px 25px"}}>Cancel</button>
              <button onClick={confirmAction} style={{...btnStyle, background: colors.green, fontSize: "16px", padding: "10px 25px"}}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / UPDATE MODAL */}
      {(modals.add || modals.update) && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <button onClick={closeModal} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" }}>&times;</button>
            <h2 style={{ color: colors.darkGreen, marginTop: 0, marginBottom: "25px" }}>
                {modals.add ? "Add New Record" : "Update Record"}
            </h2>
            
            <form onSubmit={modals.add ? handleAddConfirmation : handleUpdateConfirmation}>
                
                {/* Row 1: Type & Date/Time */}
                <div style={formRow}>
                    <div style={formGroup}>
                        <label style={labelStyle}>Record Type</label>
                        <select style={inputStyle} value={salesFormData.type} onChange={e => setSalesFormData({...salesFormData, type: e.target.value})}>
                            <option value="Income">Income</option>
                            <option value="Expense">Expense</option>
                        </select>
                    </div>
                    <div style={{...formGroup, display: 'flex', gap: '10px'}}>
                        <div style={{flex: 2}}>
                            <label style={labelStyle}>Date</label>
                            <input type="date" style={inputStyle} value={salesFormData.date} onChange={e => setSalesFormData({...salesFormData, date: e.target.value})} required />
                        </div>
                        <div style={{flex: 1}}>
                            <label style={labelStyle}>Time</label>
                            <input type="time" style={inputStyle} value={salesFormData.time} onChange={e => setSalesFormData({...salesFormData, time: e.target.value})} required />
                        </div>
                    </div>
                </div>

                {/* Row 2: Amount & Entered By */}
                <div style={formRow}>
                    <div style={formGroup}>
                        <label style={labelStyle}>Amount</label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "12px", top: "12px", color: "#555" }}>₱</span>
                            <input type="number" style={{...inputStyle, paddingLeft: "30px"}} placeholder="0.00" value={salesFormData.amount} onChange={e => setSalesFormData({...salesFormData, amount: e.target.value})} required step="0.01" />
                        </div>
                    </div>
                    <div style={formGroup}>
                        <label style={labelStyle}>Entered by</label>
                        <input type="text" style={{...inputStyle, background: "#f0f0f0", color: "#777" }} value={salesFormData.enteredBy} readOnly />
                    </div>
                </div>
                
                 {/* Row 3: Status */}
                <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>Status</label>
                    <select style={inputStyle} value={salesFormData.status} onChange={e => setSalesFormData({...salesFormData, status: e.target.value})}>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>

                {/* Row 4: Description */}
                <div style={{ marginBottom: "25px" }}>
                    <label style={labelStyle}>Description</label>
                    <textarea style={{...inputStyle, height: "100px", resize: "none" }} placeholder="Enter description..." value={salesFormData.description} onChange={e => setSalesFormData({...salesFormData, description: e.target.value})} required />
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px" }}>
                    <button type="button" onClick={closeModal} style={{...btnStyle, background: colors.yellow, color: "black", fontSize: "16px", padding: "10px 25px"}}>Cancel</button>
                    <button type="submit" style={{...btnStyle, background: modals.add ? colors.green : colors.purple, fontSize: "16px", padding: "10px 25px"}}>
                        {modals.add ? "Add Record" : "Update Record"}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* ARCHIVE MODAL */}
      {modals.archive && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <button onClick={closeModal} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" }}>&times;</button>
            <h2 style={{ color: colors.red, marginTop: 0, marginBottom: "20px" }}>Archive Record</h2>
            <p style={{ color: "#555", marginBottom: "20px" }}>Please provide a reason for archiving record <b>{selectedId}</b>.</p>
            
            <div style={{ marginBottom: "25px" }}>
                <label style={labelStyle}>Reason for Archiving (Required)</label>
                <textarea style={{...inputStyle, height: "100px", resize: "none", borderColor: colors.red }} placeholder="Enter reason..." value={archiveReason} onChange={e => setArchiveReason(e.target.value)} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px" }}>
                <button type="button" onClick={closeModal} style={{...btnStyle, background: "#ccc", color: "#333", fontSize: "16px", padding: "10px 25px"}}>Cancel</button>
                <button type="button" onClick={handleArchiveConfirmation} style={{...btnStyle, background: colors.red, fontSize: "16px", padding: "10px 25px"}}>Confirm Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ARCHIVE LOG MODAL */}
      {modals.archiveLog && (
        <div style={modalOverlay}>
          <div style={{...modalContent, width: "800px"}}> 
            <button onClick={closeModal} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" }}>&times;</button>
            <h2 style={{ color: colors.blue, marginTop: 0, marginBottom: "20px" }}>Archive Log</h2>
            
            <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #eee", borderRadius: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: colors.blue, color: "white", position: "sticky", top: 0 }}>
                    <tr>
                      <th style={{ padding: "12px" }}>Record ID</th>
                      <th>Category</th>
                      <th>Reason</th>
                      <th>Archived By</th>
                      <th>Date Archived</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(archiveLogs, archivePage, archivePerPage).map(log => (
                      <tr key={log.logId} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "45px", fontSize: "14px" }}>
                        <td style={{ fontWeight: "bold" }}>{log.originalId}</td>
                        <td>{log.category}</td>
                        <td style={{ fontStyle: "italic", color: "#555" }}>{log.reason}</td>
                        <td>{log.archivedBy}</td>
                        <td>{log.dateArchived}</td>
                        <td>
                            <button style={{ padding: "5px 10px", background: "#ccc", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }} onClick={() => alert("Restore feature coming soon!")}>Restore</button>
                        </td>
                      </tr>
                    ))}
                    {archiveLogs.length === 0 && (
                        <tr><td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "#888" }}>No archived records found.</td></tr>
                    )}
                  </tbody>
                </table>
            </div>
            <PaginationControls total={archiveLogs.length} page={archivePage} setPage={setArchivePage} perPage={archivePerPage} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button onClick={closeModal} style={{...btnStyle, background: "#ccc", color: "#333", fontSize: "16px", padding: "8px 20px"}}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default SalesSystem