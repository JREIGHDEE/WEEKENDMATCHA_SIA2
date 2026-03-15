import { useNavigate, useLocation } from 'react-router-dom'; // 1. Added useLocation
import { colors } from '../constants/uiStyles';
import logo from '../assets/wm-logo.svg';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 2. Initialize location

  // 3. Helper function to check if the path is active
  const isActive = (path) => location.pathname === path;

  // 4. Helper style function
  const getLinkStyle = (path) => ({
    padding: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    borderRadius: "8px",
    marginBottom: "10px",
    color: "white",
    cursor: "pointer",
    // This logic dynamically switches the highlight based on the URL
    background: isActive(path) ? "#5a6955" : "transparent",
    opacity: isActive(path) ? 1 : 0.5,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  });

  return (
    <div className="no-print" style={{
        width: "250px",
        flexShrink: 0,
        background: colors.green,
        padding: "30px 20px",
        color: "white",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        height: "100vh"
    }}>
      <div style={{ paddingBottom: "10px", textAlign: "center" }}>
          <img src={logo} alt="Logo" style={{ width: "130px", height: "auto" }} />
      </div>
      <h2 style={{ fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center" }}>
          WeekendMatcha
      </h2>

      {/* INVENTORY */}
      <div style={getLinkStyle('/inventory-system')} onClick={() => navigate('/inventory-system')}>
        Inventory System {isActive('/inventory-system') && '➤'}
      </div>

      {/* SALES */}
      <div style={getLinkStyle('/sales-system')} onClick={() => navigate('/sales-system')}>
        Sales System {isActive('/sales-system') && '➤'}
      </div>

      {/* HUMAN RESOURCE */}
      <div style={getLinkStyle('/hr-system')} onClick={() => navigate('/hr-system')}>
        Human Resource {isActive('/hr-system') && '➤'}
      </div>

      <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display: "flex", alignItems: "center", gap: "10px", fontSize: "18px" }} 
           onClick={() => navigate('/')}>
        <span>↪</span> Log Out
      </div>
    </div>
  );
};

export default Sidebar;