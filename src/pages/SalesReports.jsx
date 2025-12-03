import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient' // <--- 1. Import Supabase
import logo from '../assets/wm-logo.svg'

function SalesReports() {
  const navigate = useNavigate()

  // --- STATE ---
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // Real Data State
  const [reportData, setReportData] = useState([]) // <--- Replaces Mock Data
  const [loading, setLoading] = useState(true)

  const [reportForm, setReportForm] = useState({
    dateFrom: '',
    dateTo: '',
    reportType: 'Daily Sales'
  })

  // --- 2. FETCH DATA FROM SUPABASE ---
  async function fetchReportData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('FinancialRecord')
      .select('*')
      .order('TransactionDate', { ascending: false }) // Newest first

    if (error) {
      console.error("Error fetching reports:", error)
    } else {
      // Format data for the table
      const formatted = data.map(item => ({
        id: `F${String(item.RecordID).padStart(3, '0')}`,
        // Format: 10/11/25
        date: new Date(item.TransactionDate).toLocaleDateString('en-US', { 
            month: '2-digit', day: '2-digit', year: '2-digit' 
        }),
        fullDate: new Date(item.TransactionDate), // Keep object for filtering
        type: item.RecordType,
        desc: item.Description,
        amount: item.Amount,
        txnId: `TXN${1000 + item.RecordID}`, // Generate a pseudo TXN ID
        status: item.Status
      }))
      setReportData(formatted)
    }
    setLoading(false)
  }

  // Load data on page open
  useEffect(() => {
    fetchReportData()
  }, [])

  // --- ACTIONS ---
  const handleGenerateClick = () => {
    if (!reportForm.dateFrom || !reportForm.dateTo) {
        alert("Please select both From and To dates.")
        return
    }
    setShowGenerateModal(false)
    setShowConfirmModal(true)
  }

  const handleConfirmSavePdf = () => {
    setShowConfirmModal(false)

    // FILTER DATA BASED ON SELECTED DATES
    const start = new Date(reportForm.dateFrom)
    const end = new Date(reportForm.dateTo)
    // Set end date to end of day to include records from that day
    end.setHours(23, 59, 59)

    const filteredRecords = reportData.filter(item => 
        item.fullDate >= start && item.fullDate <= end
    )

    // Calculate Total for the report
    const totalAmount = filteredRecords.reduce((sum, item) => sum + parseFloat(item.amount), 0)

    const fileName = `Report_${reportForm.reportType.replace(' ', '')}_${reportForm.dateFrom}.pdf`
    
    // Show Real Data in the Alert
    alert(`✅ REPORT GENERATED SUCCESSFULLY!\n\n` +
          `Type: ${reportForm.reportType}\n` +
          `Range: ${reportForm.dateFrom} to ${reportForm.dateTo}\n` +
          `Records Found: ${filteredRecords.length}\n` +
          `Total Value: ₱${totalAmount.toLocaleString()}\n\n` +
          `Simulating download of: "${fileName}"...`)
          
    setReportForm({ dateFrom: '', dateTo: '', reportType: 'Daily Sales' })
  }

  const closeModals = () => {
    setShowGenerateModal(false)
    setShowConfirmModal(false)
  }

  // --- STYLES ---
  const colors = { green: "#6B7C65", beige: "#E8DCC6", darkGreen: "#4A5D4B", red: "#D9534F", blue: "#7D4E99", yellow: "#D4AF37" }
  
  // Layout Styles
  const mainLayout = { display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }
  const contentArea = { flex: 1, background: colors.beige, padding: "30px", overflowY: "auto" }
  
  const headerStyle = { fontSize: "32px", color: colors.darkGreen, fontWeight: "bold", margin: 0 }
  const controlsBar = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }
  const searchInput = { padding: "10px 15px", borderRadius: "20px", border: "1px solid #ccc", width: "300px", background: "#f0f0f0" }
  const btnBase = { padding: "10px 25px", borderRadius: "25px", border: "none", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "16px", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }
  
  // Modal Styles
  const overlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }
  const modalBox = { background: "white", padding: "30px", borderRadius: "20px", width: "600px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }
  const inputLabel = { display: "block", marginBottom: "8px", fontWeight: "bold", color: "#555", fontSize: "18px" }
  const modalInput = { width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid #5a6955", fontSize: "16px", boxSizing: "border-box" }

  return (
    <div style={mainLayout}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>

        {/* LOGO ADDED HERE */}
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        
        {/* Navigation */}
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "rgba(255,255,255,0.2)" }} onClick={() => navigate('/personal-view')}>👤 My Personal View</div>
        <div style={{borderTop: "1px solid rgba(255,255,255,0.3)", margin: "10px 0"}}></div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}}>Inventory System</div>
        
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}} onClick={() => navigate('/sales-system')}>Sales System ➤</div>
        
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/hr-system')}>Human Resource</div>
        <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
      </div>


      {/* --- MAIN REPORT CONTENT --- */}
      <div style={contentArea}>
        
        {/* Header Section */}
        <div style={{ borderBottom: "2px solid " + colors.darkGreen, paddingBottom: "15px", marginBottom: "30px" }}>
            <h1 style={headerStyle}>Reports</h1>
        </div>

        {/* Controls Bar */}
        <div style={controlsBar}>
          <input type="text" placeholder="🔍 Search by Customer ID" style={searchInput} />
          <div style={{ display: "flex", gap: "15px" }}>
              <button style={{...btnBase, background: colors.blue}} onClick={() => setShowGenerateModal(true)}>Generate Report</button>
              <button style={{...btnBase, background: colors.red, padding: "10px 35px"}} onClick={() => navigate('/sales-system')}>Back</button>
          </div>
        </div>

        {/* Report History Table (Now shows REAL Data) */}
        <div style={{ background: colors.green, borderRadius: "15px 15px 0 0", padding: "15px", color: "white", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
          <span style={{flex: 1}}>Record ID</span>
          <span style={{flex: 1}}>Date</span>
          <span style={{flex: 1}}>Type</span>
          <span style={{flex: 2}}>Description</span>
          <span style={{flex: 1}}>Amount</span>
          <span style={{flex: 1}}>Transaction ID</span>
          <span style={{flex: 1, textAlign: "right"}}>Status</span>
        </div>
        <div style={{ background: "white", borderRadius: "0 0 15px 15px", padding: "10px", height: "500px", overflowY: "auto", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
           
           {/* LOADING STATE */}
           {loading && <div style={{padding: "20px", textAlign: "center"}}>Loading Records...</div>}

           {/* REAL DATA MAPPING */}
           {!loading && reportData.map((item, index) => (
              <div key={index} style={{ display: "flex", padding: "15px 5px", borderBottom: "1px solid #eee", color: "#333", fontSize: "14px", fontWeight: "500" }}>
                  <span style={{flex: 1}}>{item.id}</span>
                  <span style={{flex: 1}}>{item.date}</span>
                  <span style={{flex: 1}}>{item.type}</span>
                  <span style={{flex: 2}}>{item.desc}</span>
                  <span style={{flex: 1}}>{parseFloat(item.amount).toLocaleString('en-PH', {style: 'currency', currency: 'PHP'})}</span>
                  <span style={{flex: 1}}>{item.txnId}</span>
                  <span style={{flex: 1, textAlign: "right"}}>{item.status}</span>
              </div>
           ))}

           {/* EMPTY STATE */}
           {!loading && reportData.length === 0 && (
             <div style={{padding: "20px", textAlign: "center", color: "#777"}}>No transaction history found.</div>
           )}
        </div>
      </div>

      {/* --- MODAL 1: GENERATE REPORT FORM --- */}
      {showGenerateModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h2 style={{ color: colors.darkGreen, marginTop: 0, borderBottom: "2px solid " + colors.darkGreen, paddingBottom: "15px", marginBottom: "25px", fontSize: "28px" }}>Generate Report</h2>
            
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                <div style={{ flex: 1 }}>
                    <label style={inputLabel}>From</label>
                    <input type="date" style={modalInput} value={reportForm.dateFrom} onChange={(e) => setReportForm({...reportForm, dateFrom: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={inputLabel}>To</label>
                    <input type="date" style={modalInput} value={reportForm.dateTo} onChange={(e) => setReportForm({...reportForm, dateTo: e.target.value})} />
                </div>
            </div>
            
            <div style={{ marginBottom: "40px" }}>
                <label style={inputLabel}>Report Type</label>
                <select style={modalInput} value={reportForm.reportType} onChange={(e) => setReportForm({...reportForm, reportType: e.target.value})}>
                    <option value="Daily Sales">Daily Sales Report</option>
                    <option value="Weekly Summary">Weekly Summary</option>
                    <option value="Monthly Profit & Loss">Monthly Profit & Loss</option>
                    <option value="Expense Report">Expense Report Only</option>
                </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px" }}>
                <button onClick={closeModals} style={{...btnBase, background: colors.yellow, color: "white", padding: "12px 30px", fontSize: "18px"}}>Cancel</button>
                <button onClick={handleGenerateClick} style={{...btnBase, background: colors.green, padding: "12px 30px", fontSize: "18px"}}>Generate Report</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CONFIRMATION POP-UP --- */}
      {showConfirmModal && (
        <div style={{...overlay, zIndex: 101}}>
            <div style={{...modalBox, width: "400px", textAlign: "center", padding: "40px", borderRadius: "25px" }}>
                <h2 style={{ color: "#5a6955", fontSize: "24px", marginBottom: "40px", fontWeight: "normal" }}>Save to device as PDF?</h2>
                <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
                    <button onClick={closeModals} style={{ border: "none", background: "none", color: "#D9534F", fontSize: "20px", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                    <button onClick={handleConfirmSavePdf} style={{ border: "none", background: "none", color: "#6B7C65", fontSize: "20px", fontWeight: "bold", cursor: "pointer" }}>Yes</button>
                </div>
            </div>
        </div>
      )}

    </div>
  )
}

export default SalesReports