import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient' 
import logo from '../assets/wm-logo.svg'

function SalesReports() {
  const navigate = useNavigate()

  // --- STATE ---
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [reportHistory, setReportHistory] = useState([]) 
  const [printData, setPrintData] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [reportForm, setReportForm] = useState({
    dateFrom: '',
    dateTo: '',
    reportType: 'Daily Sales'
  })

  // --- 1. FETCH REPORT HISTORY ---
  async function fetchReportHistory() {
    setLoading(true)
    const { data, error } = await supabase
      .from('Report')
      .select(`*, Employee(User(FirstName, LastName))`)
      .order('DateGenerated', { ascending: false })

    if (!error) setReportHistory(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchReportHistory()
  }, [])

  // --- 2. ACTIONS ---
  const handleGenerateClick = () => {
    if (!reportForm.dateFrom || !reportForm.dateTo) {
        alert("Please select both From and To dates.")
        return
    }
    setShowGenerateModal(false)
    setShowConfirmModal(true)
  }

  const handleConfirmSavePdf = async () => {
    setLoading(true)
    setShowConfirmModal(false)

    try {
        const { data: records, error: fetchErr } = await supabase
            .from('FinancialRecord')
            .select('*')
            .gte('TransactionDate', reportForm.dateFrom)
            .lte('TransactionDate', reportForm.dateTo + 'T23:59:59')
            .neq('Status', 'Archived');

        if (fetchErr) throw fetchErr;
        setPrintData(records); 

        const { data: { user } } = await supabase.auth.getUser()
        const { data: emp } = await supabase.from('Employee').select('EmployeeID').eq('UserID', user.id).maybeSingle()

        await supabase.from('Report').insert([{
            EmployeeID: emp?.EmployeeID || 1,
            ReportType: reportForm.reportType,
            DateGenerated: new Date().toISOString(),
            DateRangeFrom: reportForm.dateFrom,
            DateRangeTo: reportForm.dateTo,
            FilePath: 'Local Download'
        }]);

        setTimeout(() => {
            window.print();
            setPrintData([]); 
            fetchReportHistory();
        }, 800);
        
    } catch (err) {
        alert("Error: " + err.message)
    } finally {
        setLoading(false)
        setReportForm({ dateFrom: '', dateTo: '', reportType: 'Daily Sales' })
    }
  }

  const closeModals = () => {
    setShowGenerateModal(false)
    setShowConfirmModal(false)
  }

  // --- STYLES (MATCHING SALES SYSTEM) ---
  const colors = { green: "#6B7C65", beige: "#E8DCC6", purple: "#7D4E99", darkGreen: "#4A5D4B", red: "#D9534F", blue: "#337AB7", yellow: "#D4AF37" }
  const btnStyle = { padding: "8px 16px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", color: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }
  const inputStyle = { padding: "8px", borderRadius: "20px", border: "1px solid #ccc", width: "250px" }
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }
  const modalContent = { background: "white", padding: "30px", borderRadius: "15px", width: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", position: "relative" }
  const formInput = { width: "100%", padding: "10px", margin: "5px 0 15px", borderRadius: "5px", border: "1px solid #ccc" }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }}>
      
      <style>
        {`
          @media screen { .print-only { display: none; } }
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white; }
            .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px; }
          }
        `}
      </style>

      {/* SIDEBAR - UNIFORM WITH SALES SYSTEM */}
      <div className="no-print" style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "rgba(255,255,255,0.2)" }} onClick={() => navigate('/personal-view')}>👤 My Personal View</div>
        <div style={{borderTop: "1px solid rgba(255,255,255,0.3)", margin: "10px 0"}}></div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/inventory-system')}>Inventory System</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}} onClick={() => navigate('/sales-system')}>Sales System ➤</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/hr-system')}>Human Resource</div>
        <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="no-print" style={{ flex: 1, background: colors.beige, padding: "30px", display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" }}>
        
        {/* HEADER - UNIFORM PLACEMENT */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: colors.darkGreen }}>Report Generation History</h1>
          <button style={{...btnStyle, background: colors.red, padding: "10px 35px"}} onClick={() => navigate('/sales-system')}>BACK</button>
        </div>

        {/* SEARCH BAR - UNIFORM PLACEMENT */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <input 
            placeholder="🔍 Search History..." 
            style={inputStyle} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {/* ACTIONS - UNIFORM BUTTON SHAPE */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button style={{...btnStyle, background: colors.blue}} onClick={() => setShowGenerateModal(true)}>GENERATE REPORT</button>
        </div>

        {/* HISTORY TABLE */}
        <div style={{ background: "white", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", flex: "0 1 auto", maxHeight: "600px", minHeight: "500px", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: colors.green, color: "white", zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: "15px" }}>Report ID</th>
                      <th>Generated By</th>
                      <th>Type</th>
                      <th>Date Generated</th>
                      <th>Date Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan="5" style={{padding:"30px", textAlign:"center"}}>Loading History...</td></tr>}
                    {!loading && reportHistory.length === 0 && <tr><td colSpan="5" style={{padding:"30px", textAlign:"center"}}>No history found.</td></tr>}
                    {!loading && reportHistory.map((report) => (
                      <tr key={report.ReportID} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "50px" }}>
                        <td style={{ padding: "10px" }}>RPT-{String(report.ReportID).padStart(3, '0')}</td>
                        <td>{report.Employee?.User?.FirstName} {report.Employee?.User?.LastName}</td>
                        <td>{report.ReportType}</td>
                        <td>{new Date(report.DateGenerated).toLocaleDateString()}</td>
                        <td>{report.DateRangeFrom} to {report.DateRangeTo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- PRINT SECTION --- */}
      <div className="print-only" style={{ padding: "40px", fontFamily: "serif" }}>
          <div className="report-header">
              <h1 style={{margin: 0}}>WEEKEND MATCHA SALES REPORT</h1>
              <p>{reportForm.reportType} | Range: {reportForm.dateFrom} to {reportForm.dateTo}</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                  <tr style={{ borderBottom: "2px solid black", textAlign: "left" }}>
                      <th style={{padding: "10px"}}>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th style={{textAlign: "right"}}>Amount</th>
                  </tr>
              </thead>
              <tbody>
                  {printData.map(item => (
                      <tr key={item.RecordID} style={{ borderBottom: "1px solid #ddd" }}>
                          <td style={{padding: "10px"}}>{new Date(item.TransactionDate).toLocaleDateString()}</td>
                          <td>{item.Description}</td>
                          <td>{item.RecordType}</td>
                          <td style={{textAlign: "right"}}>₱{parseFloat(item.Amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <div style={{ marginTop: "30px", textAlign: "right", fontWeight: "bold", fontSize: "18px" }}>
              Total Amount: ₱{printData.reduce((sum, item) => sum + parseFloat(item.Amount), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
      </div>

      {/* MODALS */}
      {showGenerateModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ color: colors.darkGreen, marginTop: 0 }}>Generate New Report</h2>
            <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ flex: 1 }}><label style={{fontWeight: "bold"}}>From</label><input type="date" style={formInput} value={reportForm.dateFrom} onChange={(e) => setReportForm({...reportForm, dateFrom: e.target.value})} /></div>
                <div style={{ flex: 1 }}><label style={{fontWeight: "bold"}}>To</label><input type="date" style={formInput} value={reportForm.dateTo} onChange={(e) => setReportForm({...reportForm, dateTo: e.target.value})} /></div>
            </div>
            <label style={{fontWeight: "bold"}}>Report Type</label>
            <select style={formInput} value={reportForm.reportType} onChange={(e) => setReportForm({...reportForm, reportType: e.target.value})}>
                <option value="Daily Sales">Daily Sales Report</option>
                <option value="Monthly P&L">Monthly Profit & Loss</option>
                <option value="Expenses">Expense Report</option>
            </select>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button onClick={closeModals} style={{...btnStyle, background: colors.yellow, color: "black"}}>CANCEL</button>
                <button onClick={handleGenerateClick} style={{...btnStyle, background: colors.green}}>GENERATE</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div style={modalOverlay}>
            <div style={{...modalContent, width: "400px", textAlign: "center" }}>
                <h2 style={{ color: "#5a6955" }}>Save Report as PDF?</h2>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
                    <button onClick={closeModals} style={{...btnStyle, background: "#ccc", color: "black"}}>CANCEL</button>
                    <button onClick={handleConfirmSavePdf} style={{...btnStyle, background: colors.green}}>YES</button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

export default SalesReports