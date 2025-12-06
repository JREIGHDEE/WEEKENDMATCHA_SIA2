import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import logo from '../assets/wm-logo.svg'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

function SalesSystem() {
  const navigate = useNavigate()

  // --- STATE ---
  const [transactions, setTransactions] = useState([]) // FinancialRecord (For Table List & Expenses)
  const [orders, setOrders] = useState([]) // Order Table (For Sales Metrics)
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Metrics (Top Cards)
  const [metrics, setMetrics] = useState({ todaySales: 0, monthlySales: 0, totalProfit: 0, totalDiscounts: 0 })
  
  // Filtered Metrics (Sidebar)
  const [filteredMetrics, setFilteredMetrics] = useState({ totalSales: 0, totalProfit: 0, totalDiscounts: 0, totalOrders: 0 })
  
  // Graph Data
  const [chartData, setChartData] = useState([])

  // Date Filters (Default: This Month)
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]) 
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('Description') 
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const searchContainerRef = useRef(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [archivePage, setArchivePage] = useState(1)
  const archivePerPage = 5

  // Modals
  const [modals, setModals] = useState({ add: false, update: false, archive: false, confirmation: false, archiveLog: false })
  const [salesFormData, setSalesFormData] = useState({ type: 'Income', date: new Date().toISOString().split('T')[0], time: '12:00', amount: '', enteredBy: 'Current User', description: '', status: 'Completed' })
  const [archiveReason, setArchiveReason] = useState('')
  const [archiveLogs, setArchiveLogs] = useState([])
  const [confirmationAction, setConfirmationAction] = useState(null)
  const [confirmationMsg, setConfirmationMsg] = useState({ title: '', message: '' })

  // --- 1. FETCH DATA (Transactions & Orders) ---
  async function fetchData() {
    setLoading(true)
    
    // A. Fetch Financial Records (For Table List & Expenses)
    const { data: finData, error: finError } = await supabase
      .from('FinancialRecord')
      .select(`*, Employee (User (FirstName, LastName))`)
      .order('TransactionDate', { ascending: false })

    // B. Fetch Orders (CRITICAL FOR SALES METRICS)
    // We select TotalAmount specifically for sales calculations
    const { data: orderData, error: orderError } = await supabase
      .from('Order')
      .select('*') 
      .eq('Status', 'COMPLETED')

    if (finError || orderError) {
        console.error("Error fetching data:", finError || orderError)
    } else {
      // Process Financial Records for Display
      const formattedData = finData.map(item => ({
        id: `F${String(item.RecordID).padStart(3, '0')}`,
        date: new Date(item.TransactionDate).toLocaleString('en-US', { 
            month: 'short', day: '2-digit', year: 'numeric', 
            hour: 'numeric', minute: 'numeric', hour12: true 
        }).toUpperCase(), 
        rawDate: item.TransactionDate,
        desc: item.Description,
        amount: item.Amount,
        type: item.RecordType,
        status: item.Status,
        enteredBy: item.Employee?.User?.FirstName || 'System'
      }))
      setTransactions(formattedData)
      setFilteredTransactions(formattedData)
      
      // Store Raw Orders for Calculations
      setOrders(orderData || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // --- 2. CALCULATE METRICS (Run when data changes) ---
  useEffect(() => {
    calculateMetrics()
    calculateGraphAndSidebar()
  }, [transactions, orders])

const calculateMetrics = () => {
    const todayStr = new Date().toLocaleDateString('en-US') 
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear() // <--- Get the current year (e.g., 2025)

    let todaySalesSum = 0
    let monthlySalesSum = 0
    let yearlyIncome = 0      // Changed from totalIncomeAllTime
    let yearlyExpense = 0     // Changed from totalExpenseAllTime
    let yearlyDiscounts = 0   // Changed from totalDiscountsSum

    // A. Calculate Sales from ORDERS Table
    orders.forEach(order => {
        const oDate = new Date(order.OrderDateTime)
        const amount = parseFloat(order.TotalAmount) || 0
        const discount = parseFloat(order.DiscountAmount) || 0

        // Only count if it belongs to THIS YEAR (Resets Jan 1st)
        if (oDate.getFullYear() === currentYear) {
            yearlyIncome += amount
            yearlyDiscounts += discount
            
            // Check if Today
            if (oDate.toLocaleDateString('en-US') === todayStr) {
                todaySalesSum += amount
            }

            // Check if This Month
            if (oDate.getMonth() === currentMonth) {
                monthlySalesSum += amount
            }
        }
    })

    // B. Calculate Expenses from FINANCIAL RECORD Table
    transactions.forEach(t => {
        const tDate = new Date(t.rawDate || t.date)
        
        // Only count expenses from THIS YEAR
        if (tDate.getFullYear() === currentYear) {
            if (t.type === 'Expense' && t.status === 'Completed') {
                yearlyExpense += (parseFloat(t.amount) || 0)
            }
        }
    })

    setMetrics({
        todaySales: todaySalesSum,
        monthlySales: monthlySalesSum,
        totalProfit: yearlyIncome - yearlyExpense, // Now represents YTD Profit
        totalDiscounts: yearlyDiscounts // Now represents YTD Discounts
    })
  }

  // --- 3. FILTER LOGIC (Graph & Sidebar) ---
  const calculateGraphAndSidebar = () => {
      // 1. Determine Range
      const start = new Date(dateFrom)
      start.setHours(0,0,0,0)
      const end = new Date(dateTo)
      end.setHours(23,59,59,999)

      // 2. Generate Date Labels for Graph
      const dateArray = []
      let currentDate = new Date(start)
      while (currentDate <= end) {
          dateArray.push(new Date(currentDate))
          currentDate.setDate(currentDate.getDate() + 1)
      }

      // 3. Process Data for Sidebar & Graph
      let fSales = 0
      let fDiscounts = 0
      let fOrdersCount = 0
      
      const dailyMap = {} 
      dateArray.forEach(d => {
          const key = d.toLocaleDateString('en-US')
          dailyMap[key] = 0
      })

      // A. Graph & Sales from ORDERS
      orders.forEach(o => {
          const oDate = new Date(o.OrderDateTime)
          
          if (oDate >= start && oDate <= end) {
              const amount = parseFloat(o.TotalAmount) || 0
              
              fSales += amount
              fDiscounts += (parseFloat(o.DiscountAmount) || 0)
              fOrdersCount += 1

              // Add to graph map
              const key = oDate.toLocaleDateString('en-US')
              if (dailyMap[key] !== undefined) {
                  dailyMap[key] += amount
              }
          }
      })

      // B. Expenses from FINANCIAL RECORD (for Profit)
      let fExpenses = 0
      transactions.forEach(t => {
          const tDate = new Date(t.rawDate)
          if (tDate >= start && tDate <= end && t.type === 'Expense' && t.status === 'Completed') {
              fExpenses += (parseFloat(t.amount) || 0)
          }
      })

      // 4. Update Sidebar
      setFilteredMetrics({
          totalSales: fSales,
          totalProfit: fSales - fExpenses,
          totalDiscounts: fDiscounts,
          totalOrders: fOrdersCount
      })

      // 5. Update Graph Data
      const finalGraphData = dateArray.map(d => {
          const key = d.toLocaleDateString('en-US')
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return { date: label, sales: dailyMap[key] || 0 }
      })
      
      setChartData(finalGraphData)
  }

  // --- SEARCH HANDLER ---
  useEffect(() => {
    let result = transactions
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      result = result.filter(t => {
        if (filterCategory === 'Description') return t.desc.toLowerCase().includes(lowerTerm)
        else if (filterCategory === 'ID') return t.id.toLowerCase().includes(lowerTerm)
        else return false
      })
    }
    setFilteredTransactions(result)
    setCurrentPage(1) 
  }, [transactions, searchTerm, filterCategory])

  // --- HELPER FUNCTIONS ---
  const paginate = (items, page, perPage) => items.slice((page - 1) * perPage, (page - 1) * perPage + perPage)
  const triggerConfirmation = (action, title, message) => { setConfirmationAction(() => action); setConfirmationMsg({ title, message }); setModals({ ...modals, confirmation: true }) }
  const confirmAction = () => { if (confirmationAction) confirmationAction(); setModals({ ...modals, confirmation: false }) }
  const closeModal = () => { setModals({ add: false, update: false, archive: false, confirmation: false, archiveLog: false }); setConfirmationAction(null); setSelectedId(null) }

  // --- CRUD ACTIONS ---
  const prepareAddSale = async () => { 
      const { data: { user } } = await supabase.auth.getUser()
      const { data: empData } = await supabase.from('Employee').select('User(FirstName)').eq('UserID', user.id).maybeSingle()
      setSalesFormData({ type: 'Income', date: new Date().toISOString().split('T')[0], time: '12:00', amount: '', enteredBy: empData?.User?.FirstName || 'Admin', description: '', status: 'Completed' })
      setModals({ ...modals, add: true }) 
  }
  const handleAddConfirmation = (e) => { e.preventDefault(); triggerConfirmation(executeAddSale, "Add Record", "Confirm adding this record?") }
  
  const executeAddSale = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: empData } = await supabase.from('Employee').select('EmployeeID').eq('UserID', user.id).maybeSingle()
      const transactionDateTime = new Date(`${salesFormData.date} ${salesFormData.time}`).toISOString()
      
      const { error } = await supabase.from('FinancialRecord').insert([{ EmployeeID: empData?.EmployeeID || 1, TransactionDate: transactionDateTime, RecordType: salesFormData.type, Amount: parseFloat(salesFormData.amount), Description: salesFormData.description, Status: salesFormData.status }])
      
      if (error) alert("Error: " + error.message); else { alert("Added!"); fetchData(); closeModal() }
  }
  
  const prepareUpdateSale = () => { if(!selectedId) return alert("Select record"); const t = transactions.find(x=>x.id===selectedId); setSalesFormData({type: t.type, date: new Date(t.rawDate).toISOString().split('T')[0], time: '12:00', amount: t.amount, enteredBy: t.enteredBy, description: t.desc, status: t.status}); setModals({...modals, update:true}) }
  const handleUpdateConfirmation = (e) => { e.preventDefault(); triggerConfirmation(executeUpdateSale, "Update Record", "Confirm update?") }
  const executeUpdateSale = async () => { const t = transactions.find(x=>x.id===selectedId); const dbId = parseInt(t.id.replace('F','')); await supabase.from('FinancialRecord').update({ Amount: parseFloat(salesFormData.amount), Description: salesFormData.description, Status: salesFormData.status }).eq('RecordID', dbId); fetchData(); closeModal() }
  const prepareArchiveSale = () => { if(!selectedId) return alert("Select record"); setModals({...modals, archive:true}) }
  const handleArchiveConfirmation = () => triggerConfirmation(executeArchiveSale, "Archive", "Confirm archive?")
  const executeArchiveSale = async () => { const t = transactions.find(x=>x.id===selectedId); const dbId = parseInt(t.id.replace('F','')); await supabase.from('FinancialRecord').update({Status: 'Archived'}).eq('RecordID', dbId); fetchData(); closeModal() }

  // --- STYLES ---
  const colors = { green: "#6B7C65", beige: "#E8DCC6", purple: "#7D4E99", darkGreen: "#4A5D4B", red: "#D9534F", blue: "#337AB7", yellow: "#D4AF37" }
  const btnStyle = { padding: "8px 16px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", color: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }
  const cardStyle = { flex: 1, padding: "20px", borderRadius: "10px", textAlign: "center", color: "white" }
  const inputStyle = { padding: "5px 10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "12px", marginRight: "5px" }
  const formInput = { width: "100%", padding: "10px", margin: "5px 0 15px", borderRadius: "5px", border: "1px solid #ccc" }
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const modalContent = { background: "white", padding: "30px", borderRadius: "15px", width: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", position: "relative" }
  const confirmOverlay = { ...modalOverlay, zIndex: 2000 }
  const confirmContent = { ...modalContent, width: "400px", textAlign: "center" }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "rgba(255,255,255,0.2)" }} onClick={() => navigate('/personal-view')}>👤 My Personal View</div>
        <div style={{borderTop: "1px solid rgba(255,255,255,0.3)", margin: "10px 0"}}></div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/inventory-system')}>Inventory System</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}}>Sales System ➤</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/hr-system')}>Human Resource</div>
        <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: colors.beige, padding: "30px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: colors.darkGreen }}>Sales Management</h1>
          <button style={{...btnStyle, background: colors.purple}} onClick={() => navigate('/sales-reports')}>VIEW REPORT</button>
        </div>

        {/* SEARCH BAR */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <input placeholder="🔍 Search by Description..." style={{ padding: "8px", borderRadius: "20px", border: "1px solid #ccc", width: "250px" }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button style={{...btnStyle, background: colors.darkGreen}} onClick={prepareAddSale}>ADD</button>
          <button style={{...btnStyle, background: colors.yellow, color: "black"}} onClick={prepareUpdateSale}>UPDATE</button>
          <button style={{...btnStyle, background: colors.red}} onClick={prepareArchiveSale}>ARCHIVE</button>
          <button style={{...btnStyle, background: colors.blue}} onClick={() => setModals({...modals, archiveLog: true})}>VIEW ARCHIVE LOG</button>
        </div>

        {/* METRICS PANEL (OVERALL) */}
        <div style={{ background: colors.green, borderRadius: "15px", padding: "20px", display: "flex", justifyContent: "space-between", marginBottom: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
            <div style={cardStyle}><div style={{fontSize: "14px", opacity: 0.9}}>Today's Total Sales</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.todaySales.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            <div style={cardStyle}><div style={{fontSize: "14px", opacity: 0.9}}>Monthly Sales</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.monthlySales.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            <div style={cardStyle}><div style={{fontSize: "14px", opacity: 0.9}}>Total Discounts Given</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.totalDiscounts.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            <div style={cardStyle}><div style={{fontSize: "14px", opacity: 0.9}}>Total Profit</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
        </div>

        {/* GRAPH SECTION (FILTERABLE) */}
        <div style={{ background: "white", borderRadius: "15px", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, color: colors.darkGreen }}>Sales Per Day Overview</h3>
                {/* DATE FILTER UI */}
                <div style={{ display: "flex", alignItems: "center", background: "#f0f0f0", padding: "5px 10px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "12px", marginRight: "5px", fontWeight: "bold" }}>From:</span>
                    <input type="date" style={inputStyle} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <span style={{ fontSize: "12px", marginRight: "5px", fontWeight: "bold" }}>To:</span>
                    <input type="date" style={inputStyle} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <button onClick={calculateGraphAndSidebar} style={{ padding: "5px 10px", background: "#aaa", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Apply Filter</button>
                </div>
            </div>
            
            <div style={{ display: "flex", gap: "20px", height: "300px" }}>
                {/* THE GRAPH (USING RECHARTS) */}
                <div style={{ flex: 3, height: "100%", minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: "#888" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                            <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} cursor={{ fill: 'rgba(107, 124, 101, 0.1)' }} />
                            <Bar dataKey="sales" fill={colors.green} radius={[10, 10, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* FILTERED METRICS SIDEBAR */}
                <div style={{ flex: 1, border: "1px solid #ccc", padding: "15px", borderRadius: "5px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "10px", fontWeight: "bold" }}>Filtered Total Sales</div><div style={{ fontWeight: "bold" }}>₱ {filteredMetrics.totalSales.toLocaleString()}</div></div>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "10px", fontWeight: "bold" }}>Filtered Discounts</div><div style={{ fontWeight: "bold" }}>₱ {filteredMetrics.totalDiscounts}</div></div>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "10px", fontWeight: "bold" }}>Filtered Profit</div><div style={{ fontWeight: "bold" }}>₱ {filteredMetrics.totalProfit.toLocaleString()}</div></div>
                    <div><div style={{ fontSize: "10px", fontWeight: "bold" }}>Total Orders</div><div style={{ fontWeight: "bold" }}>{filteredMetrics.totalOrders}</div></div>
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
                {transactions.length === 0 && <tr><td colSpan="7" style={{padding:"30px", textAlign:"center"}}>No records found.</td></tr>}
                {paginate(filteredTransactions.filter(t => t.status !== 'Archived'), currentPage, itemsPerPage).map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "50px" }}>
                    <td><input type="radio" name="saleSelect" checked={selectedId === t.id} onChange={() => setSelectedId(t.id)} style={{ transform: "scale(1.5)", cursor: "pointer" }} /></td>
                    <td>{t.id}</td><td>{t.date}</td><td style={{ fontWeight: "bold" }}>{t.desc}</td><td style={{ fontWeight: "bold" }}>₱{parseFloat(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td style={{ color: t.type === 'Income' ? colors.green : colors.red, fontWeight: "bold" }}>{t.type}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls total={filteredTransactions.filter(t => t.status !== 'Archived').length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
        </div>

      </div>

      {/* --- MODALS (ADD, UPDATE, ARCHIVE, CONFIRM) --- */}
      {/* Kept minimal for brevity, but functional structure is here */}
      {modals.confirmation && (
        <div style={confirmOverlay}><div style={confirmContent}><h2 style={{color:colors.darkGreen}}>{confirmationMsg.title}</h2><p>{confirmationMsg.message}</p><div style={{display:"flex", justifyContent:"center", gap:"10px", marginTop:"20px"}}><button onClick={closeModal} style={{...btnStyle, background:"#ccc", color:"#333"}}>Cancel</button><button onClick={confirmAction} style={{...btnStyle, background:colors.green}}>Confirm</button></div></div></div>
      )}
      {(modals.add || modals.update) && (
        <div style={modalOverlay}><div style={modalContent}><h2 style={{color:colors.darkGreen, marginTop:0}}>{modals.add ? "Add Record" : "Update Record"}</h2>
        <form onSubmit={modals.add ? handleAddConfirmation : handleUpdateConfirmation}>
            <div style={{display:"flex", gap:"10px"}}>
                <div style={{flex:1}}><label>Type</label><select style={formInput} value={salesFormData.type} onChange={e=>setSalesFormData({...salesFormData, type:e.target.value})}><option>Income</option><option>Expense</option></select></div>
                <div style={{flex:1}}><label>Date</label><input type="date" style={formInput} value={salesFormData.date} onChange={e=>setSalesFormData({...salesFormData, date:e.target.value})} required/></div>
            </div>
            <div style={{display:"flex", gap:"10px"}}>
                <div style={{flex:1}}><label>Amount</label><input type="number" step="0.01" style={formInput} value={salesFormData.amount} onChange={e=>setSalesFormData({...salesFormData, amount:e.target.value})} required/></div>
                <div style={{flex:1}}><label>Entered By</label><input disabled style={{...formInput, background:"#eee"}} value={salesFormData.enteredBy} /></div>
            </div>
            <div><label>Description</label><textarea style={{...formInput, height:"80px"}} value={salesFormData.description} onChange={e=>setSalesFormData({...salesFormData, description:e.target.value})} required/></div>
            <div style={{display:"flex", justifyContent:"flex-end", gap:"10px"}}><button type="button" onClick={closeModal} style={{...btnStyle, background:"#ccc", color:"#333"}}>Cancel</button><button type="submit" style={{...btnStyle, background:colors.green}}>{modals.add?"Add":"Update"}</button></div>
        </form></div></div>
      )}
      {modals.archive && (
        <div style={modalOverlay}><div style={modalContent}><h2 style={{color:colors.red}}>Archive Record</h2><textarea style={{...formInput, height:"100px"}} placeholder="Reason..." value={archiveReason} onChange={e=>setArchiveReason(e.target.value)} /><div style={{display:"flex", justifyContent:"flex-end", gap:"10px"}}><button onClick={closeModal} style={{...btnStyle, background:"#ccc", color:"#333"}}>Cancel</button><button onClick={handleArchiveConfirmation} style={{...btnStyle, background:colors.red}}>Confirm</button></div></div></div>
      )}
      {/* Archive Log Modal */}
      {modals.archiveLog && (
        <div style={modalOverlay}><div style={{...modalContent, width:"800px"}}><h2 style={{color:colors.blue}}>Archive Log</h2><div style={{height:"400px", overflow:"auto"}}><table style={{width:"100%"}}><thead style={{background:colors.blue, color:"white"}}><tr><th>ID</th><th>Reason</th><th>By</th><th>Date</th></tr></thead><tbody>{archiveLogs.map(l=><tr key={l.logId}><td style={{textAlign:"center", padding:"10px"}}>{l.originalId}</td><td style={{textAlign:"center"}}>{l.reason}</td><td style={{textAlign:"center"}}>{l.archivedBy}</td><td style={{textAlign:"center"}}>{l.dateArchived}</td></tr>)}</tbody></table></div><button onClick={closeModal} style={{...btnStyle, background:"#ccc", color:"#333", marginTop:"20px"}}>Close</button></div></div>
      )}

    </div>
  )
}

export default SalesSystem