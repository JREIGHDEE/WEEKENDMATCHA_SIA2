import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportLogic } from '../hooks/useReportLogic';
import { Notification } from '../components/Notification';
import Sidebar from '../components/Sidebar';
import ReportTable from '../components/ReportTable';
import { colors, btnStyle, type as typeScale } from '../constants/uiStyles';
import { HiOutlineSearch, HiOutlineDownload } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';

function SalesReports() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const { state, actions } = useReportLogic(setNotification);

  const formInputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", outline: "none", boxSizing: "border-box", fontSize: "14px" };
  const labelStyle = { fontWeight: "bold", fontSize: "14px", color: "#555", marginBottom: "8px", display: "block" };

// --- NEW: PDF DOWNLOAD FUNCTION ---
  const downloadSnapshotPDF = () => {
    if (!state.selectedReportData || state.selectedReportData.length === 0) return;

    const doc = new jsPDF();

    // 1. Add Title
    doc.setFontSize(18);
    doc.setTextColor(90, 105, 85); // WM Dark Green
    doc.text('Historical Report Snapshot', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // 2. Prepare Table Data
    const tableColumns = ["ID", "Date", "Description", "Type", "Amount"];
    const tableRows = state.selectedReportData.map(record => [
      `F${String(record.RecordID).padStart(3, '0')}`,
      new Date(record.TransactionDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      record.Description,
      record.RecordType,
      `PHP ${parseFloat(record.Amount).toLocaleString(undefined, {minimumFractionDigits: 2})}`
    ]);

    // 3. Generate Table
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [90, 105, 85] }, 
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
            if (data.cell.raw === 'Capital' || data.cell.raw === 'Income') data.cell.styles.textColor = [40, 167, 69];
            if (data.cell.raw === 'Expense') data.cell.styles.textColor = [220, 53, 69];
        }
      }
    });

    // 4. Save file
    doc.save(`WM_Report_Snapshot_${new Date().getTime()}.pdf`);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: colors.beige }}>
      
{/* 1. PRINT & SCREEN CSS STYLESHEET */}
      <style>
        {`
          /* Hide the printable reports on the normal computer screen */
          @media screen {
            #printable-report, #printable-snapshot {
              display: none;
            }
          }

          /* Format perfectly for the PDF/Printer */
          @media print {
            body * { visibility: hidden; }
            #printable-report, #printable-report *,
            #printable-snapshot, #printable-snapshot * { visibility: visible; }
            
            #printable-report, #printable-snapshot {
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

        <div style={{ flex: 1, padding: "clamp(16px, 2vw, 30px)", overflowY: "auto" }}>
          {/* HEADER & SEARCH ROW */}
          <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "300px" }}>
              <HiOutlineSearch size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
              <input
                placeholder="Search History..."
                style={{ padding: "10px 15px 10px 36px", borderRadius: "20px", border: "1px solid #ddd", width: "100%", boxSizing: "border-box", outline: "none", fontSize: typeScale.body }}
                value={state.searchTerm}
                onChange={(e) => actions.setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button className="btn-animated" style={{ ...btnStyle, background: colors.blue }} onClick={() => actions.setShowGenerateModal(true)}>GENERATE REPORT</button>
              <button className="btn-animated" style={{ ...btnStyle, background: colors.red, padding: "8px 35px" }} onClick={() => navigate('/sales-system')}>BACK</button>
            </div>
          </div>

          <ReportTable 
            history={state.filteredHistory}
            loading={state.loading} 
            colors={colors} 
            onViewReport={actions.fetchReportDetails} 
          />
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
                  <option value="Custom Range">Custom Range</option>
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

                {state.reportForm.reportType === 'Custom Range' && (
                  <div style={{ display: "flex", gap: "15px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Date From</label>
                      <input type="date" style={formInputStyle} value={state.reportForm.rangeFrom} onChange={(e) => actions.setReportForm({ ...state.reportForm, rangeFrom: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Date To</label>
                      <input type="date" style={formInputStyle} value={state.reportForm.rangeTo} onChange={(e) => actions.setReportForm({ ...state.reportForm, rangeTo: e.target.value })} />
                    </div>
                  </div>
                )}
              
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button className="btn-animated" type="button" onClick={() => actions.setShowGenerateModal(false)} style={{ ...btnStyle, background: "#ccc", color: "#333" }}>Cancel</button>
                <button
                  className="btn-animated"
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
                <button className="btn-animated" type="button" onClick={() => actions.setShowConfirmModal(false)} style={{ ...btnStyle, background: "#ccc", color: "#333", flex: 1 }}>Cancel</button>
                <button className="btn-animated" type="button" onClick={actions.handleConfirmSavePdf} style={{ ...btnStyle, background: colors.blue, flex: 1 }}>Confirm & Print</button>
              </div>
          </div>
        </div>
      )}

{/* VIEW PAST REPORT MODAL */}
      {state.showViewModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "15px", width: "700px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
              
              {/* --- CHANGED HEADER SECTION --- */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: colors.darkGreen, margin: 0 }}>Historical Report Snapshot</h2>
                
                {/* Button Container */}
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                  <button
                     className="btn-animated"
                     onClick={() => window.print()} /* Note: Replace window.print() with your actual PDF generation action if you have one, e.g., actions.generatePDF */
                     style={{ background: "#3b5998", color: "white", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px", boxShadow: "0 2px 5px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                     <HiOutlineDownload size={15} /> Download PDF
                  </button>
                  <button className="icon-btn" onClick={() => actions.setShowViewModal(false)} style={{ background: "#f2f2f2", border: "none", borderRadius: "8px", width: "30px", height: "30px", fontSize: "16px", color: "#888" }}><IoClose /></button>
                </div>
              </div>
              {/* --- END CHANGED HEADER SECTION --- */}
              
              <div style={{ overflowY: "auto", flex: 1 }}>
                {state.selectedReportData && state.selectedReportData.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead style={{ background: "#eee", position: "sticky", top: 0 }}>
                      <tr>
                        <th style={{ padding: "10px" }}>ID</th>
                        <th style={{ padding: "10px" }}>Date</th>
                        <th style={{ padding: "10px" }}>Description</th>
                        <th style={{ padding: "10px" }}>Type</th>
                        <th style={{ padding: "10px", textAlign: "right" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedReportData.map((record) => (
                        <tr key={record.RecordID} style={{ borderBottom: "1px solid #ddd" }}>
                          <td style={{ padding: "10px" }}>F{String(record.RecordID).padStart(3, '0')}</td>
                          <td style={{ padding: "10px" }}>{new Date(record.TransactionDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                          <td style={{ padding: "10px" }}>{record.Description}</td>
                          <td style={{ padding: "10px", color: (record.RecordType === 'Capital' || record.RecordType === 'Income') ? 'green' : 'red', fontWeight: "bold" }}>{record.RecordType}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>₱{parseFloat(record.Amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>No detailed records found for this report. (It may have been generated before the tracking update).</div>
                )}
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
                  <td style={{ padding: "10px" }}>{new Date(record.TransactionDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
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

      {/* HIDDEN PRINTABLE SNAPSHOT AREA */}
      {state.showViewModal && state.selectedReportData && state.selectedReportData.length > 0 && (
        <div id="printable-snapshot">
          <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "3px solid #333", paddingBottom: "20px" }}>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "28px" }}>WeekendMatcha</h1>
            <h2 style={{ margin: "0 0 10px 0", color: "#555" }}>HISTORICAL REPORT SNAPSHOT</h2>
            <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>Retrieved On: {new Date().toLocaleString()}</p>
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
              {state.selectedReportData.map((record) => (
                <tr key={record.RecordID} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "10px" }}>F{String(record.RecordID).padStart(3, '0')}</td>
                  <td style={{ padding: "10px" }}>{new Date(record.TransactionDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
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
                  ₱{state.selectedReportData.reduce((sum, record) => {
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