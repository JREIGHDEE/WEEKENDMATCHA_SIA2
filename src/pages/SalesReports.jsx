import { useNavigate } from 'react-router-dom';
import { useReportLogic } from '../hooks/useReportLogic';
import Sidebar from '../components/Sidebar';
import ReportTable from '../components/ReportTable';
import { colors, btnStyle, inputStyle } from '../constants/uiStyles';

function SalesReports() {
  const navigate = useNavigate();
  const { state, actions } = useReportLogic();

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: colors.beige }}>
      <Sidebar />

      <div className="no-print" style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
        {/* HEADER & SEARCH ROW */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <input 
            placeholder="🔍 Search History..." 
            style={inputStyle} 
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

      {/* Keep your Print Section and Modals here or move them to separate files too! */}
    </div>
  );
}

export default SalesReports;