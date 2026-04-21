import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportLogic } from '../hooks/useReportLogic';
import { Notification } from '../components/Notification';
import Sidebar from '../components/Sidebar';
import ReportTable from '../components/ReportTable';
import { colors, btnStyle } from '../constants/uiStyles';

function SalesReports() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const { state, actions } = useReportLogic(setNotification);

  const formInputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", outline: "none", boxSizing: "border-box", fontSize: "14px" };
  const labelStyle = { fontWeight: "bold", fontSize: "14px", color: "#555", marginBottom: "8px", display: "block" };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: colors.beige }}>
      
{/* 1. PRINT & SCREEN CSS STYLESHEET */}
      <style>
        {`
          /* Hide the printable report on the normal computer screen */
          @media screen {
            #printable-report {
              display: none;
            }
          }

          /* Format perfectly for the PDF/Printer */
          @media print {
            body * { visibility: hidden; }
            #printable-report, #printable-report * { visibility: visible; }
            #printable-report {
              display: block; /* Overrides the screen 'none' */
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              color: #333 !important;
              font-family: sans-serif;
            }
            .no-print { display: none !important; }
            @page { margin: 1cm; size: auto; }
          }
        `}
      </style>

      <div className="no-print" style={{ display: "flex", width: "100%", height: "100%" }}>
        <Sidebar />

        <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
          {/* HEADER & SEARCH ROW */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <input 
              placeholder="🔍 Search History..." 
              style={{ padding: "10px 15px", borderRadius: "20px", border: "1px solid #ccc", width: "300px", outline: "none" }} 
              value={state.searchTerm} 
              onChange={(e) => actions.setSearchTerm(e.target.value)} 
            />
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={{ ...btnStyle, background: colors.blue }} onClick={() => actions.setShowGenerateModal(true)}>GENERATE REPORT</button>
              <button style={{ ...btnStyle, background: colors.red, padding: "8px 35px" }} onClick={() => navigate('/sales-system')}>BACK</button>
            </div>
          </div>

          <ReportTable history={state.reportHistory} loading={state.loading} colors={colors} />
        </div>
      </div>

      {/* GENERATE REPORT MODAL (DYNAMIC UI) */}
      {state.showGenerateModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "15px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
              <h2 style={{ color: colors.darkGreen, marginTop: 0, marginBottom: "20px" }}>Generate Report</h2>
              
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Select Report Type</label>
                <select 
                  style={formInputStyle} 
                  value={state.reportForm.reportType} 
                  onChange={(e) => actions.setReportForm({ ...state.reportForm, reportType: e.target.value })}
                >
                  <option value="Daily Sales">Daily Sales</option>
                  <option value="Weekly Sales">Weekly Sales</option>
                  <option value="Monthly Sales">Monthly Sales</option>
                </select>
              </div>

              {/* DYNAMIC INPUTS BASED ON SELECTION */}
              <div style={{ marginBottom: "25px" }}>
                {state.reportForm.reportType === 'Daily Sales' && (
                  <div>
                    <label style={labelStyle}>Select Date</label>
                    <input type="date" style={formInputStyle} value={state.reportForm.dailyDate} onChange={(e) => actions.setReportForm({ ...state.reportForm, dailyDate: e.target.value })} />
                  </div>
                )}

                {state.reportForm.reportType === 'Weekly Sales' && (
                  <div>
                    <label style={labelStyle}>Select Week</label>
                    <input type="week" style={formInputStyle} value={state.reportForm.weeklyDate} onChange={(e) => actions.setReportForm({ ...state.reportForm, weeklyDate: e.target.value })} />
                  </div>
                )}

                {state.reportForm.reportType === 'Monthly Sales' && (
                  <div>
                    <label style={labelStyle}>Select Month</label>
                    <input type="month" style={formInputStyle} value={state.reportForm.monthlyDate} onChange={(e) => actions.setReportForm({ ...state.reportForm, monthlyDate: e.target.value })} />
                  </div>
                )}
              </div>
              
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => actions.setShowGenerateModal(false)} style={{ ...btnStyle, background: "#ccc", color: "#333" }}>Cancel</button>
                <button 
                  type="button"
                  onClick={() => {
                    const isValid = actions.prepareReport();
                    if (!isValid) {
                      setNotification({ message: `Please select a valid ${state.reportForm.reportType.split(' ')[0]}`, type: "error" });
                      return;
                    }
                    actions.setShowGenerateModal(false);
                    actions.setShowConfirmModal(true);
                  }} 
                  style={{ ...btnStyle, background: colors.green }}
                >
                  Generate
                </button>
              </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {state.showConfirmModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "15px", width: "400px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
              <h2 style={{ color: colors.darkGreen, marginTop: 0 }}>Confirm Data Record</h2>
              <p style={{ color: "#666", marginBottom: "20px", lineHeight: "1.5" }}>
                You are about to generate and officially record the <strong>{state.reportForm.reportType}</strong> report for <strong>{state.calculatedRange.display}</strong>.
              </p>
              
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button type="button" onClick={() => actions.setShowConfirmModal(false)} style={{ ...btnStyle, background: "#ccc", color: "#333", flex: 1 }}>Cancel</button>
                <button type="button" onClick={actions.handleConfirmSavePdf} style={{ ...btnStyle, background: colors.blue, flex: 1 }}>Confirm & Print</button>
              </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINTABLE REPORT AREA */}
      {state.printData && state.printData.length > 0 && (
        <div id="printable-report">
          <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "3px solid #333", paddingBottom: "20px" }}>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "28px" }}>WeekendMatcha</h1>
            <h2 style={{ margin: "0 0 10px 0", color: "#555" }}>{state.reportForm.reportType.toUpperCase()} REPORT</h2>
            <p style={{ margin: "5px 0", fontSize: "16px" }}><strong>Period:</strong> {state.calculatedRange.display}</p>
            <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>Generated On: {new Date().toLocaleString()}</p>
          </div>
          
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#eee", borderBottom: "2px solid #333" }}>
                <th style={{ padding: "12px 10px" }}>Record ID</th>
                <th style={{ padding: "12px 10px" }}>Date</th>
                <th style={{ padding: "12px 10px" }}>Description</th>
                <th style={{ padding: "12px 10px" }}>Type</th>
                <th style={{ padding: "12px 10px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {state.printData.map((record) => (
                <tr key={record.RecordID} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "10px" }}>F{String(record.RecordID).padStart(3, '0')}</td>
                  <td style={{ padding: "10px" }}>{new Date(record.TransactionDate).toLocaleDateString()}</td>
                  <td style={{ padding: "10px" }}>{record.Description}</td>
                  <td style={{ padding: "10px", fontWeight: "bold", color: record.RecordType === 'Income' ? 'green' : 'red' }}>{record.RecordType}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>₱{parseFloat(record.Amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "3px solid #333", fontWeight: "bold", fontSize: "18px" }}>
                <td colSpan="4" style={{ padding: "20px 10px", textAlign: "right" }}>TOTAL BALANCE:</td>
                <td style={{ padding: "20px 10px", textAlign: "right" }}>
                  ₱{state.printData.reduce((sum, record) => {
                    return record.RecordType === 'Income' ? sum + parseFloat(record.Amount) : sum - parseFloat(record.Amount);
                  }, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: 'success' })}
      />
    </div>
  );
}

export default SalesReports;