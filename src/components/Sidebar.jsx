import { useNavigate } from 'react-router-dom';
import { colors } from '../constants/uiStyles'; // Ensure this path is correct!
import logo from '../assets/wm-logo.svg';

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="no-print" style={{ 
      width: "250px", 
      flexShrink: 0, 
      background: colors.green, // This was the broken line
      padding: "30px 20px", 
      color: "white", 
      display: "flex", 
      flexDirection: "column", 
      boxSizing: "border-box" 
    }}>
      <div style={{ paddingBottom: "10px", textAlign: "center" }}>
          <img src={logo} alt="Logo" style={{ width: "130px", height: "auto" }} />
      </div>
      <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
      
      <div style={{ padding: "10px", fontWeight: "bold", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/inventory-system')}>Inventory System</div>
      
      {/* Active State Example */}
      <div style={{ padding: "10px", fontWeight: "bold", cursor: "pointer", background: "rgba(255,255,255,0.1)", borderRadius: "8px"}} onClick={() => navigate('/sales-system')}>Sales System ➤</div>
      
      <div style={{ padding: "10px", fontWeight: "bold", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/hr-system')}>Human Resource</div>
      
      <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8 }} onClick={() => navigate('/')}>Log Out</div>
    </div>
  );
};

export default Sidebar;
