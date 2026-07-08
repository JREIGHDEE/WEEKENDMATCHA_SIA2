import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, supabaseSales } from '../supabaseClient' // <-- IMPORTED SECOND DB
import { Notification } from '../components/Notification'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Sidebar from '../components/Sidebar'
import LoadingSpinner from '../components/LoadingSpinner'

import {
    colors, btnStyle, cardStyle, inputStyle, formInput
} from '../styles/SalesStyles'

function SalesSystem() {
  const navigate = useNavigate()

  // --- STANDARD POS STATE (For Top Charts) ---
  const [orders, setOrders] = useState([]) 
  const [financialRecords, setFinancialRecords] = useState([])
  const [metrics, setMetrics] = useState({ todaySales: 0, monthlySales: 0, totalProfit: 0, totalDiscounts: 0 })
  const [filteredMetrics, setFilteredMetrics] = useState({ totalSales: 0, totalProfit: 0, totalDiscounts: 0, totalOrders: 0 })
  const [chartData, setChartData] = useState([])
  const [paymentModeBreakdown, setPaymentModeBreakdown] = useState({})

  // Date Filters (For Charts)
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]) 
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [timeFrom, setTimeFrom] = useState('00:00')
  const [timeTo, setTimeTo] = useState('23:59')
  const [filterButtonClicked, setFilterButtonClicked] = useState(false)

  // --- NEW: TRACKING APP STATE (Employee View) ---
  const [currentUserName, setCurrentUserName] = useState('Loading...')
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [trackingLogs, setTrackingLogs] = useState([])
  const [cashBalance, setCashBalance] = useState(0)
  const [shiftIncome, setShiftIncome] = useState(0)
  const [loyverseIncome, setLoyverseIncome] = useState(0)
  const [shiftStats, setShiftStats] = useState({ Cash: 0, GCash: 0, Maya: 0, BPI: 0 })
  const [loyverseStats, setLoyverseStats] = useState({ Cash: 0, GCash: 0, Maya: 0, BPI: 0 })
  const [actionLoading, setActionLoading] = useState(false)
  const [currentShiftLogs, setCurrentShiftLogs] = useState([])

  // Forms
  const [tfForm, setTfForm] = useState({ from: 'Cash', to: 'GCash', amt: '' })
  const [loyForm, setLoyForm] = useState({ amt: '', chan: 'Cash' })
  const [revForm, setRevForm] = useState({ amt: '', chan: 'Cash', photos: [] })
  const [expForm, setExpForm] = useState({ amt: '', desc: '', chan: 'Cash', photos: [] })

  const [notification, setNotification] = useState({ message: '', type: 'success' })

  const fileInputRefRev = useRef(null)
  const fileInputRefExp = useRef(null)
  const [activePhotoSlot, setActivePhotoSlot] = useState({ type: null, index: null })

  // --- 1. INITIALIZE DATA ---
  useEffect(() => {
    fetchPOSData()
    fetchTrackingData()
    setupRealtimeTracking()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        setCurrentUserEmail(user.email)
        const { data } = await supabase.from('Employee').select('User(FirstName)').eq('UserID', user.id).maybeSingle()
        setCurrentUserName(data?.User?.FirstName || 'Employee')
    }
  }



  
  // --- 2. FETCH POS DATA FOR CHARTS (Original Logic) ---
  const fetchPOSData = async () => {
    const { data: finData } = await supabase.from('FinancialRecord').select('*').order('TransactionDate', { ascending: false })
    const { data: orderData } = await supabase.from('Order').select('*').eq('Status', 'COMPLETED')
    if (finData) setFinancialRecords(finData)
    if (orderData) setOrders(orderData)
  }

  useEffect(() => {
    calculateMetrics()
    calculateGraphAndSidebar()
  }, [financialRecords, orders])

  // --- 3. FETCH & CALCULATE TRACKING DATA (New App Logic) ---
  const fetchTrackingData = async () => {
    const { data } = await supabaseSales.from('transactions').select('*').order('id', { ascending: false })
    if (data) {
        setTrackingLogs(data)
        calculateTrackingStats(data)
    }
  }

  const setupRealtimeTracking = () => {
    supabaseSales.channel('public:transactions').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTrackingData()
    }).subscribe()
  }

  const getPSTTime = () => {
    const d = new Date()
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000)
    return new Date(utc + (3600000 * 8))
  }

  const getShiftDate = (dateObj) => {
    const hour = dateObj.getHours()
    const date = new Date(dateObj)
    if (hour < 8) date.setDate(date.getDate() - 1)
    return date.toISOString().split('T')[0]
  }

  const getFixedDate = (dateObj) => {
    return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`
  }

  const calculateTrackingStats = (logs) => {
    let cashBal = 0, sRev = 0, sPos = 0
    let cT = { Cash: 0, GCash: 0, Maya: 0, BPI: 0 }
    let cTLoy = { Cash: 0, GCash: 0, Maya: 0, BPI: 0 }

    const pst = getPSTTime()
    let sStart = new Date(pst), sEnd = new Date(pst)
    if (pst.getHours() < 8) { 
        sStart.setDate(sStart.getDate() - 1); sStart.setHours(8, 0, 0, 0)
        sEnd.setHours(7, 59, 59, 999) 
    } else { 
        sStart.setHours(8, 0, 0, 0); sEnd.setDate(sEnd.getDate() + 1)
        sEnd.setHours(7, 59, 59, 999) 
    }

  const shiftLogsArray = [] // <-- Add this array

    logs.forEach(l => {
        const v = parseFloat(l.amt || l.amount) || 0
        const t = (l.type || "").toUpperCase()
        const c = (l.chan || "").trim()

        // Employee View: Only calculate Overall Cash
        if (t === 'REVENUE' && c === 'Cash') cashBal += v
        if (t === 'EXPENSE' && c === 'Cash') cashBal -= v
        if (t === 'TRANSFER') {
            const desc = l.desc || ""
            if (desc.includes('from Cash')) cashBal -= v
            if (desc.includes('to Cash')) cashBal += v
        }

        const d = new Date(l.date + " " + l.time)
        if (d >= sStart && d <= sEnd) {
            shiftLogsArray.push(l) // <-- Push shift transactions here
            if (t === "REVENUE") { sRev += v; if (cT[c] !== undefined) cT[c] += v }
            if (t === "POS_REF") { sPos += v; if (cTLoy[c] !== undefined) cTLoy[c] += v }
        }
    })

    setCurrentShiftLogs(shiftLogsArray) // <-- Save it to the state here

    setCashBalance(cashBal)
    setShiftIncome(sRev)
    setLoyverseIncome(sPos)
    setShiftStats(cT)
    setLoyverseStats(cTLoy)
  }

  // --- 4. FORM SUBMISSIONS ---
  const uploadPhotos = async (photosArray) => {
    const urls = []
    for (let p of photosArray) {
        if (!p) continue
        const res = await fetch(p)
        const blob = await res.blob()
        const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
        const { error } = await supabaseSales.storage.from('receipts').upload(`public/${fileName}`, blob, { contentType: 'image/jpeg' })
        if (!error) urls.push(supabaseSales.storage.from('receipts').getPublicUrl(`public/${fileName}`).data.publicUrl)
    }
    return urls
  }

  const submitTransaction = async (entryData) => {
    setActionLoading(true)
    const { error } = await supabaseSales.from('transactions').insert([entryData])
    setActionLoading(false)
    if (!error) {
        setNotification({ message: 'Saved successfully!', type: 'success' })
        fetchTrackingData()
        return true
    }
    setNotification({ message: 'Error saving!', type: 'error' })
    return false
  }

  const handleLoyverseSubmit = async () => {
    if (!loyForm.amt) return setNotification({ message: 'Enter amount', type: 'error' })
    const pstNow = getPSTTime()
    const entry = { type: 'POS_REF', amt: parseFloat(loyForm.amt), chan: loyForm.chan, desc: 'New (Shift Profit) Update', staff: currentUserName, auth_user: currentUserEmail, google_name: currentUserName, time: pstNow.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), date: getFixedDate(pstNow), isoDate: getShiftDate(pstNow) }
    if (await submitTransaction(entry)) setLoyForm({ ...loyForm, amt: '' })
  }

  const handleTransferSubmit = async () => {
    if (!tfForm.amt || tfForm.from === tfForm.to) return setNotification({ message: 'Invalid transfer', type: 'error' })
    const pstNow = getPSTTime()
    const entry = { type: 'TRANSFER', amt: parseFloat(tfForm.amt), chan: tfForm.from, desc: `Transfer from ${tfForm.from} to ${tfForm.to}`, staff: currentUserName, auth_user: currentUserEmail, google_name: currentUserName, time: pstNow.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), date: getFixedDate(pstNow), isoDate: getShiftDate(pstNow) }
    if (await submitTransaction(entry)) setTfForm({ ...tfForm, amt: '' })
  }

  const handleRevExpSubmit = async (type) => {
    const isRev = type === 'REVENUE'
    const form = isRev ? revForm : expForm
    if (!form.amt || (!isRev && !form.desc)) return setNotification({ message: 'Fill all required fields!', type: 'error' })
    
    setActionLoading(true)
    const urls = await uploadPhotos(form.photos)
    const pstNow = getPSTTime()
    
    const entry = { type, amt: parseFloat(form.amt), chan: form.chan, desc: isRev ? 'Daily Sales Inflow' : form.desc, staff: currentUserName, auth_user: currentUserEmail, google_name: currentUserName, photos: urls, time: pstNow.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), date: getFixedDate(pstNow), isoDate: getShiftDate(pstNow) }
    
    if (await submitTransaction(entry)) {
        if (isRev) setRevForm({ amt: '', chan: 'Cash', photos: [] })
        else setExpForm({ amt: '', desc: '', chan: 'Cash', photos: [] })
    }
  }

  // --- PHOTO HANDLING ---
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
        if (activePhotoSlot.type === 'REV') {
            const newPhotos = [...revForm.photos]
            newPhotos[activePhotoSlot.index] = ev.target.result
            setRevForm({ ...revForm, photos: newPhotos })
        } else {
            const newPhotos = [...expForm.photos]
            newPhotos[activePhotoSlot.index] = ev.target.result
            setExpForm({ ...expForm, photos: newPhotos })
        }
    }
    reader.readAsDataURL(file)
  }

  // --- ORIGINAL CHART CALCULATIONS ---
  const calculateMetrics = () => {
    const todayStr = new Date().toLocaleDateString('en-US') 
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    let todaySalesSum = 0, monthlySalesSum = 0, yearlyIncome = 0, yearlyExpense = 0, yearlyDiscounts = 0

    orders.forEach(order => {
        const oDate = new Date(order.OrderDateTime)
        const amount = parseFloat(order.TotalAmount) || 0
        if (oDate.getFullYear() === currentYear) {
            yearlyIncome += amount
            yearlyDiscounts += parseFloat(order.DiscountAmount) || 0
            if (oDate.toLocaleDateString('en-US') === todayStr) todaySalesSum += amount
            if (oDate.getMonth() === currentMonth) monthlySalesSum += amount
        }
    })
    financialRecords.forEach(t => {
        const tDate = new Date(t.TransactionDate)
        if (tDate.getFullYear() === currentYear && t.Status === 'Completed') {
            if (t.RecordType === 'Expense') yearlyExpense += (parseFloat(t.Amount) || 0)
            else if (t.RecordType === 'Capital') yearlyIncome += (parseFloat(t.Amount) || 0)
        }
    })
    setMetrics({ todaySales: todaySalesSum, monthlySales: monthlySalesSum, totalProfit: yearlyIncome - yearlyExpense, totalDiscounts: yearlyDiscounts })
  }

  const calculateGraphAndSidebar = () => {
      const start = new Date(`${dateFrom}T${timeFrom}:00`)
      const end = new Date(`${dateTo}T${timeTo}:59`)
      const dateArray = []
      let currentDate = new Date(start)
      currentDate.setHours(0,0,0,0)
      const endDay = new Date(end)
      endDay.setHours(23,59,59,999)

      while (currentDate <= endDay) { dateArray.push(new Date(currentDate)); currentDate.setDate(currentDate.getDate() + 1) }
      
      let fSales = 0, fDiscounts = 0, fOrdersCount = 0, fExpenses = 0
      const dailyMap = {}
      dateArray.forEach(d => dailyMap[d.toLocaleDateString('en-US')] = 0)
      const paymentCounts = {}

      orders.forEach(o => {
          const oDate = new Date(o.OrderDateTime)
          if (oDate >= start && oDate <= end) {
              const amount = parseFloat(o.TotalAmount) || 0
              fSales += amount; fDiscounts += (parseFloat(o.DiscountAmount) || 0); fOrdersCount += 1
              const key = oDate.toLocaleDateString('en-US')
              if (dailyMap[key] !== undefined) dailyMap[key] += amount
              const method = o.PaymentMethod || 'Cash'
              paymentCounts[method] = (paymentCounts[method] || 0) + amount
          }
      })
      financialRecords.forEach(t => {
          const tDate = new Date(t.TransactionDate)
          if (tDate >= start && tDate <= end && t.Status === 'Completed') {
              if (t.RecordType === 'Expense') fExpenses += (parseFloat(t.Amount) || 0)
              else if (t.RecordType === 'Capital') fSales += (parseFloat(t.Amount) || 0)
          }
      })
      setFilteredMetrics({ totalSales: fSales, totalProfit: fSales - fExpenses, totalDiscounts: fDiscounts, totalOrders: fOrdersCount })
      setChartData(dateArray.map(d => ({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), sales: dailyMap[d.toLocaleDateString('en-US')] || 0 })))
      setPaymentModeBreakdown(paymentCounts)
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, background: `linear-gradient(180deg, ${colors.beige} 0%, #f3ead9 100%)`, padding: "clamp(16px, 2vw, 30px)", display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" }}>

        {/* HEADER & METRICS */}
        <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: colors.darkGreen, fontWeight: 800 }}>Sales Management</h1>
          <button className="btn-animated" style={{...btnStyle, background: colors.purple, borderRadius: "10px", padding: "10px 20px"}} onClick={() => navigate('/sales-reports')}>VIEW REPORT</button>
        </div>

        <div className="responsive-stack" style={{ background: `linear-gradient(135deg, ${colors.green} 0%, ${colors.darkGreen} 100%)`, borderRadius: "18px", padding: "22px", display: "flex", justifyContent: "space-between", marginBottom: "22px", boxShadow: "0 6px 18px rgba(74,93,75,0.25)", gap: "16px", flexWrap: "wrap" }}>
            <div className="card-hover" style={{...cardStyle, minWidth: "140px"}}><div style={{fontSize: "12px", opacity: 0.9}}>Today's Total Sales</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.todaySales.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            <div className="card-hover" style={{...cardStyle, minWidth: "140px"}}><div style={{fontSize: "12px", opacity: 0.9}}>Monthly Sales</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.monthlySales.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            <div className="card-hover" style={{...cardStyle, minWidth: "140px"}}><div style={{fontSize: "12px", opacity: 0.9}}>Total Discounts Given</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.totalDiscounts.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            <div className="card-hover" style={{...cardStyle, minWidth: "140px"}}><div style={{fontSize: "12px", opacity: 0.9}}>Total Profit</div><div style={{fontSize: "24px", fontWeight: "bold"}}>₱ {metrics.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
        </div>

        {/* GRAPH SECTION */}
        <div className="fade-in-card" style={{ background: "white", borderRadius: "18px", padding: "20px", marginBottom: "22px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, color: colors.darkGreen, fontSize: "18px", whiteSpace: "nowrap" }}>Sales Per Day Overview</h3>
                <div style={{ display: "flex", alignItems: "center", background: "#f0f0f0", padding: "6px 10px", borderRadius: "10px", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "11px", marginRight: "2px", fontWeight: "bold" }}>From:</span>
                    <input type="date" style={{...inputStyle, width: "auto", margin: 0, padding: "6px 8px", fontSize: "11px"}} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <input type="time" style={{...inputStyle, width: "auto", margin: 0, padding: "6px 8px", fontSize: "11px"}} value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} />

                    <span style={{ fontSize: "11px", marginRight: "2px", fontWeight: "bold", marginLeft: "8px" }}>To:</span>
                    <input type="date" style={{...inputStyle, width: "auto", margin: 0, padding: "6px 8px", fontSize: "11px"}} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <input type="time" style={{...inputStyle, width: "auto", margin: 0, padding: "6px 8px", fontSize: "11px"}} value={timeTo} onChange={(e) => setTimeTo(e.target.value)} />

                    <button className="btn-animated" onClick={() => { calculateGraphAndSidebar(); setFilterButtonClicked(true); }} style={{ padding: "7px 14px", marginLeft: "6px", background: filterButtonClicked ? "#aaa" : colors.green, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>Apply Filter</button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "20px", height: "300px" }}>
                <div style={{ flex: 3, height: "100%", minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: "#888" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#888" }} axisLine={false} tickLine={false} tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                            <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} cursor={{ fill: 'rgba(107, 124, 101, 0.1)' }} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
                            <Bar dataKey="sales" fill={colors.green} radius={[10, 10, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, border: "1px solid #e5ded0", background: "#fbf8f2", padding: "15px", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "11px", fontWeight: "bold" }}>Filtered Total Sales</div><div style={{ fontWeight: "bold", fontSize: "14px" }}>₱ {filteredMetrics.totalSales.toLocaleString()}</div></div>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "11px", fontWeight: "bold" }}>Filtered Discounts</div><div style={{ fontWeight: "bold", fontSize: "14px" }}>₱ {filteredMetrics.totalDiscounts}</div></div>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "11px", fontWeight: "bold" }}>Filtered Profit</div><div style={{ fontWeight: "bold", fontSize: "14px" }}>₱ {filteredMetrics.totalProfit.toLocaleString()}</div></div>
                    <div style={{ marginBottom: "10px" }}><div style={{ fontSize: "11px", fontWeight: "bold" }}>Total Orders</div><div style={{ fontWeight: "bold", fontSize: "14px" }}>{filteredMetrics.totalOrders}</div></div>
                    <div style={{ borderTop: "1px solid #eee", paddingTop: "10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "5px" }}>Sales by Payment Mode</div>
                        {Object.keys(paymentModeBreakdown).length === 0 ? (
                            <div style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>No orders in range.</div>
                        ) : (
                            Object.entries(paymentModeBreakdown).map(([method, amount]) => (
                                <div key={method} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                                    <span>{method}</span><span style={{ fontWeight: "bold" }}>₱ {amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- TRACKING APP INTEGRATION (EMPLOYEE VIEW) --- */}
        <h2 style={{ color: colors.darkGreen, fontSize: "20px", marginBottom: "15px", marginTop: "10px", fontWeight: "bold" }}>Shift Tracking & Operations</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", paddingBottom: "30px" }}>
            
            {/* LEFT COLUMN: Overview & Transfer */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ background: colors.darkGreen, padding: "20px", borderRadius: "15px", color: "white" }}>
                    <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.8, marginBottom: "5px" }}>Overall Cash Balance</div>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4ade80" }}>₱ {cashBalance.toLocaleString()}</div>
                </div>

                <div style={{ background: "white", padding: "20px", borderRadius: "15px", border: "1px solid #eee" }}>
                    <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "5px", borderBottom: "1px solid #eee", paddingBottom: "5px" }}>Shift Income (8AM Reset)</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: colors.darkGreen, marginBottom: "10px" }}>₱ {shiftIncome.toLocaleString()}</div>
                    {['Cash', 'GCash', 'Maya', 'BPI'].map(k => shiftStats[k] > 0 && (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0", borderBottom: "1px solid #f9f9f9" }}>
                            <span>{k}</span><span style={{ fontWeight: "bold" }}>₱{shiftStats[k].toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <div style={{ background: "white", padding: "20px", borderRadius: "15px", border: "1px solid #eee" }}>
                    <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "5px", borderBottom: "1px solid #eee", paddingBottom: "5px" }}>New POS Shift (8AM Reset)</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#333", marginBottom: "10px" }}>₱ {loyverseIncome.toLocaleString()}</div>
                    {['Cash', 'GCash', 'Maya', 'BPI'].map(k => loyverseStats[k] > 0 && (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0", borderBottom: "1px solid #f9f9f9" }}>
                            <span>{k}</span><span style={{ fontWeight: "bold" }}>₱{loyverseStats[k].toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <div style={{ background: "white", padding: "20px", borderRadius: "15px", border: "1px solid #eee" }}>
                    <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "10px" }}>Transfer Funds</div>
                    <div style={{ display: "flex", gap: "5px", marginBottom: "10px", alignItems: "center" }}>
                        <select style={{...formInput, padding: "8px", flex: 1}} value={tfForm.from} onChange={e => setTfForm({...tfForm, from: e.target.value})}><option>Cash</option><option>GCash</option><option>Maya</option><option>BPI</option></select>
                        <span style={{ fontSize: "12px", color: "#888" }}>to</span>
                        <select style={{...formInput, padding: "8px", flex: 1}} value={tfForm.to} onChange={e => setTfForm({...tfForm, to: e.target.value})}><option>Cash</option><option>GCash</option><option>Maya</option><option>BPI</option></select>
                    </div>
                    <div style={{ display: "flex", gap: "5px" }}>
                        <input type="number" placeholder="Amount (₱)" style={{...formInput, padding: "8px", flex: 1.5}} value={tfForm.amt} onChange={e => setTfForm({...tfForm, amt: e.target.value})} />
                        <button onClick={handleTransferSubmit} disabled={actionLoading} style={{...btnStyle, padding: "8px", flex: 1, background: actionLoading ? "#ccc" : colors.green}}>{actionLoading ? '...' : 'Transfer'}</button>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Entry Forms & Logs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                
                {/* Loyverse Update */}
                <div style={{ background: "white", padding: "20px", borderRadius: "15px", border: "1px solid #eee" }}>
                    <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "10px" }}>NEW POS (Shift Profit)</div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <input type="number" placeholder="Amount (₱)" style={{...formInput, padding: "10px", flex: 1.5}} value={loyForm.amt} onChange={e => setLoyForm({...loyForm, amt: e.target.value})} />
                        <select style={{...formInput, padding: "10px", flex: 1}} value={loyForm.chan} onChange={e => setLoyForm({...loyForm, chan: e.target.value})}><option>Cash</option><option>GCash</option><option>Maya</option><option>BPI</option></select>
                        <button onClick={handleLoyverseSubmit} disabled={actionLoading} style={{...btnStyle, flex: 1, background: actionLoading ? "#ccc" : colors.green}}>{actionLoading ? 'Saving...' : 'Confirm'}</button>
                    </div>
                </div>

                {/* Rev / Exp Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    {/* REVENUE */}
                    <div style={{ background: "white", padding: "20px", borderRadius: "15px", border: "1px solid #eee" }}>
                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "10px" }}>Daily Post Sales (Shift)</div>
                        <input type="number" placeholder="Amount (₱)" style={{...formInput, padding: "10px", marginBottom: "8px"}} value={revForm.amt} onChange={e => setRevForm({...revForm, amt: e.target.value})} />
                        <input type="text" value={currentUserName} disabled style={{...formInput, padding: "10px", marginBottom: "8px", background: "#f5f5f5", color: "#666", cursor: "not-allowed"}} />
                        <select style={{...formInput, padding: "10px", marginBottom: "15px"}} value={revForm.chan} onChange={e => setRevForm({...revForm, chan: e.target.value})}><option>Cash</option><option>GCash</option><option>Maya</option><option>BPI</option><option>Others</option></select>
                        
                        <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "5px", fontWeight: "bold" }}>RECEIPT PHOTOS (MAX 4)</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px", marginBottom: "15px" }}>
                            {[0,1,2,3].map(i => (
                                <div key={i} onClick={() => { setActivePhotoSlot({ type: 'REV', index: i }); fileInputRefRev.current.click(); }} style={{ aspectRatio: "1/1", border: "2px dashed #ddd", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", color: "#ccc", fontSize: "20px" }}>
                                    {revForm.photos[i] ? <img src={revForm.photos[i]} style={{width:"100%", height:"100%", objectFit:"cover"}} /> : '+'}
                                </div>
                            ))}
                        </div>
                        <input type="file" hidden ref={fileInputRefRev} accept="image/*" onChange={handlePhotoUpload} />
                        <button onClick={() => handleRevExpSubmit('REVENUE')} disabled={actionLoading} style={{...btnStyle, width: "100%", background: actionLoading ? "#ccc" : "#80b07f"}}>{actionLoading ? 'Saving...' : 'Add Revenue'}</button>
                    </div>

                    {/* EXPENSE */}
                    <div style={{ background: "white", padding: "20px", borderRadius: "15px", border: "1px solid #eee" }}>
                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "10px" }}>Daily Post Expense (Shift)</div>
                        <input type="number" placeholder="Amount (₱)" style={{...formInput, padding: "10px", marginBottom: "8px"}} value={expForm.amt} onChange={e => setExpForm({...expForm, amt: e.target.value})} />
                        <input type="text" placeholder="Details (e.g Grab, Oatmilk)" style={{...formInput, padding: "10px", marginBottom: "8px"}} value={expForm.desc} onChange={e => setExpForm({...expForm, desc: e.target.value})} />
                        <input type="text" value={currentUserName} disabled style={{...formInput, padding: "10px", marginBottom: "8px", background: "#f5f5f5", color: "#666", cursor: "not-allowed"}} />
                        <select style={{...formInput, padding: "10px", marginBottom: "15px"}} value={expForm.chan} onChange={e => setExpForm({...expForm, chan: e.target.value})}><option>Cash</option><option>GCash</option><option>Maya</option><option>BPI</option></select>
                        
                        <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "5px", fontWeight: "bold" }}>RECEIPT PHOTOS (MAX 4)</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px", marginBottom: "15px" }}>
                            {[0,1,2,3].map(i => (
                                <div key={i} onClick={() => { setActivePhotoSlot({ type: 'EXP', index: i }); fileInputRefExp.current.click(); }} style={{ aspectRatio: "1/1", border: "2px dashed #ddd", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", color: "#ccc", fontSize: "20px" }}>
                                    {expForm.photos[i] ? <img src={expForm.photos[i]} style={{width:"100%", height:"100%", objectFit:"cover"}} /> : '+'}
                                </div>
                            ))}
                        </div>
                        <input type="file" hidden ref={fileInputRefExp} accept="image/*" onChange={handlePhotoUpload} />
                        <button onClick={() => handleRevExpSubmit('EXPENSE')} disabled={actionLoading} style={{...btnStyle, width: "100%", background: actionLoading ? "#ccc" : colors.green}}>{actionLoading ? 'Saving...' : 'Add Expense'}</button>
                    </div>
                </div>

                {/* CURRENT TRANSACTION LOG */}
                <div style={{ background: "white", padding: "20px", borderRadius: "15px", border: "1px solid #eee", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "10px" }}>Current Transactions</div>
                    <div style={{ flex: 1, overflowY: "auto", maxHeight: "250px", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "10px" }}>
                        {currentShiftLogs.length === 0 ? <div style={{ textAlign: "center", color: "#aaa", marginTop: "20px", fontSize: "13px" }}>No transactions yet</div> : currentShiftLogs.map(l => (
                            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f9f9f9", padding: "8px 0", fontSize: "13px" }}>
                                <div>
                                    <div style={{ fontWeight: "bold" }}>
                                        {l.type === 'POS_REF' ? 'L' : l.type.charAt(0)} - {l.desc}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#888", marginTop: "3px" }}>
                                        {l.date} | {l.time} {l.type !== 'TRANSFER' && `| ${l.chan}`} | {l.staff}
                                    </div>
                                </div>
                                <div style={{ fontWeight: "bold", color: l.type === 'EXPENSE' ? colors.red : colors.darkGreen }}>
                                    {l.type === 'EXPENSE' ? '-' : ''}₱{parseFloat(l.amount || l.amt).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>

      </div>

      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: 'success' })} 
      />
    </div>
  )
}

export default SalesSystem