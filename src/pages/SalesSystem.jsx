import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import logo from '../assets/wm-logo.svg'
import { Notification } from '../components/Notification'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// --- IMPORTED SEPARATED FILES ---
import { PaginationControls } from '../components/PaginationControls'
import { paginate } from '../utils/helpers'
import { 
    colors, btnStyle, cardStyle, inputStyle, formInput, 
    modalOverlay, modalContent, confirmOverlay, confirmContent 
} from '../styles/SalesStyles'

function SalesSystem() {
  const navigate = useNavigate()

  // --- STATE ---
  const [transactions, setTransactions] = useState([]) 
  const [orders, setOrders] = useState([]) 
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Metrics 
  const [metrics, setMetrics] = useState({ todaySales: 0, monthlySales: 0, totalProfit: 0, totalDiscounts: 0 })
  const [filteredMetrics, setFilteredMetrics] = useState({ totalSales: 0, totalProfit: 0, totalDiscounts: 0, totalOrders: 0 })
  const [chartData, setChartData] = useState([])

  // Date Filters 
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

  // Notification
  const [notification, setNotification] = useState({ message: '', type: 'success' })

  // Modals
  const [modals, setModals] = useState({ add: false, update: false, archive: false, confirmation: false, archiveLog: false })
  const [salesFormData, setSalesFormData] = useState({ type: 'Income', date: new Date().toISOString().split('T')[0], time: '12:00', amount: '', enteredBy: 'Current User', description: '', status: 'Completed' })
  const [archiveReason, setArchiveReason] = useState('')
  const [archiveLogs, setArchiveLogs] = useState([])
  const [confirmationAction, setConfirmationAction] = useState(null)
  const [confirmationMsg, setConfirmationMsg] = useState({ title: '', message: '' })

  // --- 1. FETCH DATA (Transactions, Orders, AND Archive Logs) ---
  async function fetchData() {
    setLoading(true)
    
    // A. Fetch Financial Records
    const { data: finData, error: finError } = await supabase
      .from('FinancialRecord')
      .select(`*, Employee (User (FirstName, LastName))`)
      .order('TransactionDate', { ascending: false })

    // B. Fetch Orders
    const { data: orderData, error: orderError } = await supabase
      .from('Order')
      .select('*') 
      .eq('Status', 'COMPLETED')

    // C. Fetch Archive Logs (Updated to match FinancialArchiveLog)
    const { data: logData, error: logError } = await supabase
      .from('FinancialArchiveLog')
      .select(`*, User(FirstName, LastName)`)
      .order('ArchivedDate', { ascending: false })

    if (finError || orderError) {
        console.error("Error fetching data:", finError || orderError)
    } else {
      // Process Transactions
// Inside fetchData -> formattedData mapping

      const formattedData = finData.map(item => ({
        id: `F${String(item.RecordID).padStart(3, '0')}`,
        // Original Transaction Date Format
        date: new Date(item.TransactionDate).toLocaleString('en-US', { 
            month: 'short', day: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true 
        }).toUpperCase(), 

        // Logic for Date Updated: Show format if exists, else show "---"
        dateUpdated: item.DateUpdated ? new Date(item.DateUpdated).toLocaleString('en-US', { 
            month: 'short', day: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true 
        }).toUpperCase() : '---',

        rawDate: item.TransactionDate,
        desc: item.Description,
        amount: item.Amount,
        type: item.RecordType,
        status: item.Status,
        enteredBy: item.AdminHandled || item.Employee?.User?.FirstName || 'System' // Displays the handler
      }))

      setTransactions(formattedData)
      setFilteredTransactions(formattedData)
      setOrders(orderData || [])

      // Process Archive Logs
      if (logData) {
        const formattedLogs = logData.map(l => ({
          logId: l.FLogID,
          originalId: `F${String(l.RecordID).padStart(3, '0')}`,
          reason: l.Reason,
          archivedBy: l.User ? `${l.User.FirstName} ${l.User.LastName}` : `User: ${l.UserID}`,
          dateArchived: new Date(l.ArchivedDate).toLocaleString()
        }));
        setArchiveLogs(formattedLogs);
      }
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // --- 2. METRICS & GRAPHS ---
  useEffect(() => {
    calculateMetrics()
    calculateGraphAndSidebar()
  }, [transactions, orders])

  const calculateMetrics = () => {
    const todayStr = new Date().toLocaleDateString('en-US') 
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    let todaySalesSum = 0
    let monthlySalesSum = 0
    let yearlyIncome = 0
    let yearlyExpense = 0
    let yearlyDiscounts = 0

    orders.forEach(order => {
        const oDate = new Date(order.OrderDateTime)
        const amount = parseFloat(order.TotalAmount) || 0
        const discount = parseFloat(order.DiscountAmount) || 0

        if (oDate.getFullYear() === currentYear) {
            yearlyIncome += amount
            yearlyDiscounts += discount
            if (oDate.toLocaleDateString('en-US') === todayStr) todaySalesSum += amount
            if (oDate.getMonth() === currentMonth) monthlySalesSum += amount
        }
    })

    transactions.forEach(t => {
        const tDate = new Date(t.rawDate || t.date)
        if (tDate.getFullYear() === currentYear && t.status === 'Completed') {
            if (t.type === 'Expense') {
                yearlyExpense += (parseFloat(t.amount) || 0)
            } else if (t.type === 'Income') {
                // ADD THIS LINE:
                yearlyIncome += (parseFloat(t.amount) || 0)
            }
        }
    })

    setMetrics({
        todaySales: todaySalesSum,
        monthlySales: monthlySalesSum,
        totalProfit: yearlyIncome - yearlyExpense,
        totalDiscounts: yearlyDiscounts
    })
  }

  const calculateGraphAndSidebar = () => {
      const start = new Date(dateFrom)
      start.setHours(0,0,0,0)
      const end = new Date(dateTo)
      end.setHours(23,59,59,999)

      const dateArray = []
      let currentDate = new Date(start)
      while (currentDate <= end) {
          dateArray.push(new Date(currentDate))
          currentDate.setDate(currentDate.getDate() + 1)
      }

      let fSales = 0, fDiscounts = 0, fOrdersCount = 0, fExpenses = 0
      const dailyMap = {} 
      dateArray.forEach(d => dailyMap[d.toLocaleDateString('en-US')] = 0)

      orders.forEach(o => {
          const oDate = new Date(o.OrderDateTime)
          if (oDate >= start && oDate <= end) {
              const amount = parseFloat(o.TotalAmount) || 0
              fSales += amount
              fDiscounts += (parseFloat(o.DiscountAmount) || 0)
              fOrdersCount += 1
              const key = oDate.toLocaleDateString('en-US')
              if (dailyMap[key] !== undefined) dailyMap[key] += amount
          }
      })

      transactions.forEach(t => {
          const tDate = new Date(t.rawDate)
          if (tDate >= start && tDate <= end && t.status === 'Completed') {
              if (t.type === 'Expense') {
                  fExpenses += (parseFloat(t.amount) || 0)
              } else if (t.type === 'Income') {
                  // ADD THIS LINE:
                  fSales += (parseFloat(t.amount) || 0)
              }
          }
      })

      setFilteredMetrics({ totalSales: fSales, totalProfit: fSales - fExpenses, totalDiscounts: fDiscounts, totalOrders: fOrdersCount })
      setChartData(dateArray.map(d => ({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), sales: dailyMap[d.toLocaleDateString('en-US')] || 0 })))
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
  const triggerConfirmation = (action, title, message) => { setConfirmationAction(() => action); setConfirmationMsg({ title, message }); setModals({ ...modals, confirmation: true }) }
  const confirmAction = () => { if (confirmationAction) confirmationAction(); setModals({ ...modals, confirmation: false }) }
  const closeModal = () => { setModals({ add: false, update: false, archive: false, confirmation: false, archiveLog: false }); setConfirmationAction(null); setSelectedId(null); setArchiveReason('') }

  // --- CRUD ACTIONS ---
const prepareAddSale = async () => { 
    const { data: { user } } = await supabase.auth.getUser()
    const { data: empData } = await supabase.from('Employee').select('User(FirstName)').eq('UserID', user.id).maybeSingle()
    
    // Create a local date object
    const now = new Date();
    
    setSalesFormData({ 
        type: 'Income', 
        // Captures YYYY-MM-DD
        date: now.toISOString().split('T')[0], 
        // Captures HH:MM in 24-hour format
        time: now.toTimeString().slice(0, 5), 
        amount: '', 
        enteredBy: empData?.User?.FirstName || 'Admin', 
        description: '', 
        status: 'Completed' 
    })
    setModals({ ...modals, add: true }) 
}
  const handleAddConfirmation = (e) => { e.preventDefault(); triggerConfirmation(executeAddSale, "Add Record", "Confirm adding this record?") }
  const executeAddSale = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: empData } = await supabase.from('Employee').select('EmployeeID').eq('UserID', user.id).maybeSingle()
      const transactionDateTime = new Date(`${salesFormData.date} ${salesFormData.time}`).toISOString()
      
      const { error } = await supabase.from('FinancialRecord').insert([{ EmployeeID: empData?.EmployeeID || 1, TransactionDate: transactionDateTime, RecordType: salesFormData.type, Amount: parseFloat(salesFormData.amount), Description: salesFormData.description, Status: salesFormData.status }])
      if (error) setNotification({ message: "Error: " + error.message, type: 'error' });
      else { setNotification({ message: "Added!", type: 'success' }); fetchData(); closeModal() }
  }
  
  const prepareUpdateSale = () => { 
      if(!selectedId) {
        setNotification({ message: "Select record", type: 'error' })
        return
      } 
      const t = transactions.find(x=>x.id===selectedId); 
      setSalesFormData({
          type: t.type, 
          date: new Date(t.rawDate).toISOString().split('T')[0],
          time: new Date(t.rawDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          amount: t.amount, 
          enteredBy: t.enteredBy, 
          description: t.desc, 
          status: t.status
      }); 
      setModals({...modals, update:true}) 
  }
  const handleUpdateConfirmation = (e) => { e.preventDefault(); triggerConfirmation(executeUpdateSale, "Update Record", "Confirm update?") }
  
const executeUpdateSale = async () => { 
    const t = transactions.find(x => x.id === selectedId); 
    const dbId = parseInt(t.id.replace('F','')); 
    const newDateTime = new Date(`${salesFormData.date} ${salesFormData.time}`).toISOString();

    const { error } = await supabase.from('FinancialRecord')
        .update({ 
            Amount: parseFloat(salesFormData.amount), 
            Description: salesFormData.description, 
            RecordType: salesFormData.type,
            TransactionDate: newDateTime,
            // New: Update the "Admin" name to whoever is currently logged in
            AdminHandled: salesFormData.enteredBy,
            // New: Update the timestamp
            DateUpdated: new Date().toISOString()
        })
        .eq('RecordID', dbId); 
    
    if (error) {
        setNotification({ message: "Error updating: " + error.message, type: 'error' });
    } else { 
        setNotification({ message: "Record Updated!", type: 'success' }); 
        fetchData(); 
        closeModal(); 
    }
}

  const prepareArchiveSale = () => {
    if(!selectedId) {
      setNotification({ message: "Select record", type: 'error' })
      return
    }
    setModals({...modals, archive:true})
  }
  const handleArchiveConfirmation = () => triggerConfirmation(executeArchiveSale, "Archive", "Confirm archive?")
  
const executeArchiveSale = async () => { 
      const t = transactions.find(x => x.id === selectedId); 
      const dbId = parseInt(t.id.replace('F','')); 

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotification({ message: "User not found.", type: 'error' })
        return
      }

      // STEP 1: Insert into Log
      const { error: logError } = await supabase.from('FinancialArchiveLog').insert([{
          RecordID: dbId,
          UserID: user.id,
          ArchivedDate: new Date().toISOString(), 
          Reason: archiveReason
      }]);

      if (logError) {
        setNotification({ message: "Error logging archive: " + logError.message, type: 'error' })
        return
      }

      // STEP 2: Update Status to 'Archived'
      const { error: updateError } = await supabase
          .from('FinancialRecord')
          .update({ Status: 'Archived' })
          .eq('RecordID', dbId); 
      
      if (updateError) {
          setNotification({ message: "Update Error: " + updateError.message, type: 'error' });
      } else { 
          setNotification({ message: "Record Archived!", type: 'success' }); 
          fetchData(); // This will refresh the table and the row WILL disappear
          closeModal(); 
      }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/inventory-system')}>Inventory System</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}}>Sales System ➤</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/hr-system')}>Human Resource</div>
        <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: colors.beige, padding: "30px", display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: colors.darkGreen }}>Sales Management</h1>
          <button style={{...btnStyle, background: colors.purple}} onClick={() => navigate('/sales-reports')}>VIEW REPORT</button>
        </div>

        {/* SEARCH & ACTIONS BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          {/* Search Input */}
          <input 
            placeholder="🔍 Search by All..." 
            style={{ padding: "8px", borderRadius: "20px", border: "1px solid #ccc", width: "300px" }} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button style={{...btnStyle, background: colors.darkGreen}} onClick={prepareAddSale}>ADD</button>
            <button style={{...btnStyle, background: colors.yellow, color: "white"}} onClick={prepareUpdateSale}>UPDATE</button>
            <button style={{...btnStyle, background: colors.red}} onClick={prepareArchiveSale}>ARCHIVE</button>
            <button style={{...btnStyle, background: colors.blue}} onClick={() => setModals({...modals, archiveLog: true})}>ARCHIVE LOGS</button>
            {/* <button style={{...btnStyle, background: "#FF9800"}} onClick={() => { fetchData(); setNotification({ message: 'Data refreshed', type: 'success' }) }}>REFRESH</button>  */}
          </div>
        </div>

        {/* METRICS PANEL */}
        <div style={{ background: colors.green, borderRadius: "15px", padding: "20px", display: "flex", justifyContent: "space-between", marginBottom: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
            <div style={cardStyle}><div style={{fontSize: "14px", opacity: 0.9}}>Today's Total Sales</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.todaySales.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            <div style={cardStyle}><div style={{fontSize: "14px", opacity: 0.9}}>Monthly Sales</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.monthlySales.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            <div style={cardStyle}><div style={{fontSize: "14px", opacity: 0.9}}>Total Discounts Given</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.totalDiscounts.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            <div style={cardStyle}><div style={{fontSize: "14px", opacity: 0.9}}>Total Profit</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
        </div>

        {/* GRAPH SECTION */}
        <div style={{ background: "white", borderRadius: "15px", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, color: colors.darkGreen }}>Sales Per Day Overview</h3>
                <div style={{ display: "flex", alignItems: "center", background: "#f0f0f0", padding: "5px 10px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "12px", marginRight: "5px", fontWeight: "bold" }}>From:</span>
                    <input type="date" style={inputStyle} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <span style={{ fontSize: "12px", marginRight: "5px", fontWeight: "bold" }}>To:</span>
                    <input type="date" style={inputStyle} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <button onClick={calculateGraphAndSidebar} style={{ padding: "5px 10px", background: "#aaa", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Apply Filter</button>
                </div>
            </div>
            
            <div style={{ display: "flex", gap: "20px", height: "300px" }}>
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
                <div style={{ flex: 1, border: "1px solid #ccc", padding: "15px", borderRadius: "5px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "10px", fontWeight: "bold" }}>Filtered Total Sales</div><div style={{ fontWeight: "bold" }}>₱ {filteredMetrics.totalSales.toLocaleString()}</div></div>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "10px", fontWeight: "bold" }}>Filtered Discounts</div><div style={{ fontWeight: "bold" }}>₱ {filteredMetrics.totalDiscounts}</div></div>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "10px", fontWeight: "bold" }}>Filtered Profit</div><div style={{ fontWeight: "bold" }}>₱ {filteredMetrics.totalProfit.toLocaleString()}</div></div>
                    <div><div style={{ fontSize: "10px", fontWeight: "bold" }}>Total Orders</div><div style={{ fontWeight: "bold" }}>{filteredMetrics.totalOrders}</div></div>
                </div>
            </div>
        </div>

        {/* TABLE */}
        <div style={{ background: "white", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", flex: "0 1 auto", maxHeight: "500px", minHeight: "500px", marginBottom: "40px", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: colors.green, color: "white", zIndex: 1 }}>
                    <tr>
                      <th style={{ width: "80px", padding: "15px" }}>Select</th>
                      <th style={{ width: "120px" }}>Record ID</th>
                      <th style={{ width: "200px" }}>Date Entered</th>
                      <th style={{ width: "200px" }}>Date Updated</th>
                      {/* By NOT giving Description a width, it will now only take the remaining space */}
                      <th style={{ textAlign: "left", paddingLeft: "20px" }}>Description</th> 
                      <th style={{ width: "150px" }}>Amount</th>
                      <th style={{ width: "120px" }}>Type</th>
                      {/* Set a fixed width here to keep it off the very edge */}
                      <th style={{ width: "120px", paddingRight: "20px" }}>Admin</th> 
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(filteredTransactions.filter(t => t.status !== 'Archived'), currentPage, itemsPerPage).map(t => (
                      <tr key={t.id} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "50px", fontSize: "13px" }}>
                        <td style={{ width: "80px" }}><input type="radio" name="saleSelect" checked={selectedId === t.id} onChange={() => setSelectedId(t.id)} /></td>
                        <td style={{ width: "120px" }}>{t.id}</td>
                        <td style={{ width: "200px" }}>{t.date}</td>
                        <td style={{ width: "200px", color: t.dateUpdated === '---' ? '#aaa' : 'inherit' }}>{t.dateUpdated}</td>
                        {/* Description: Removed fixed width so it compresses naturally */}
                        <td style={{ textAlign: "left", paddingLeft: "20px", fontWeight: "bold" }}>{t.desc}</td>
                        <td style={{ width: "150px", fontWeight: "bold" }}>₱{parseFloat(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td style={{ width: "120px", color: t.type === 'Income' ? colors.green : colors.red, fontWeight: "bold" }}>{t.type}</td>
                        <td style={{ width: "120px", fontWeight: "bold", color: colors.darkGreen, paddingRight: "20px" }}>{t.enteredBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
            <PaginationControls total={filteredTransactions.filter(t => t.status !== 'Archived').length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
        </div>
      </div>

      {/* --- MODALS --- */}
      {modals.confirmation && (
        <div style={confirmOverlay}><div style={confirmContent}><h2 style={{color:colors.darkGreen}}>{confirmationMsg.title}</h2><p>{confirmationMsg.message}</p><div style={{display:"flex", justifyContent:"center", gap:"10px", marginTop:"20px"}}><button onClick={closeModal} style={{...btnStyle, background:"#ccc", color:"#333"}}>Cancel</button><button onClick={confirmAction} style={{...btnStyle, background:colors.green}}>Confirm</button></div></div></div>
      )}
      {(modals.add || modals.update) && (
        <div style={modalOverlay}><div style={modalContent}><h2 style={{color:colors.darkGreen, marginTop:0}}>{modals.add ? "Add Record" : "Update Record"}</h2>
        <form onSubmit={modals.add ? handleAddConfirmation : handleUpdateConfirmation}>
            <div style={{display:"flex", gap:"10px"}}>
                <div style={{flex:1}}><label>Type</label><select style={{...formInput, opacity: !modals.add ? 0.6 : 1, cursor: !modals.add ? 'not-allowed' : 'auto'}} disabled={!modals.add} value={salesFormData.type} onChange={e=>setSalesFormData({...salesFormData, type:e.target.value})}><option>Income</option><option>Expense</option></select></div>
                <div style={{flex:1}}>
                  <label>Date</label>
                  <input 
                      type="date" 
                      style={{
                          ...formInput, 
                          opacity: 0.8, 
                          cursor: 'not-allowed', 
                          background: "#eee"
                      }} 
                      disabled={true} 
                      value={salesFormData.date} 
                      required
                  />
              </div>
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
      {modals.archiveLog && (
        <div style={modalOverlay}><div style={{...modalContent, width:"900px"}}><h2 style={{color:colors.blue}}>Archive Log</h2><div style={{height:"400px", overflow:"auto"}}><table style={{width:"100%"}}><thead style={{background:colors.blue, color:"white"}}><tr><th>ID</th><th>Reason</th><th>By</th><th>Date Archived</th><th>Auto-Delete Date</th></tr></thead><tbody>{archiveLogs.map(l => {
          const archivedDate = new Date(l.dateArchived)
          const deleteDate = new Date(archivedDate.getTime() + 90 * 24 * 60 * 60 * 1000)
          return (
          <tr key={l.logId}><td style={{textAlign:"center", padding:"10px"}}>{l.originalId}</td><td style={{textAlign:"center"}}>{l.reason}</td><td style={{textAlign:"center"}}>{l.archivedBy}</td><td style={{textAlign:"center"}}>{l.dateArchived}</td><td style={{textAlign:"center", color: new Date() > deleteDate ? "#d32f2f" : "#f57c00", fontWeight:"bold"}}>{deleteDate.toISOString().split('T')[0]}</td></tr>
        )})} </tbody></table></div><button onClick={closeModal} style={{...btnStyle, background:"#ccc", color:"#333", marginTop:"20px"}}>Close</button></div></div>
      )}

      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: 'success' })} 
      />
    </div>
  )
}

export default SalesSystem