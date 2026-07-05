import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors, type as typeScale } from '../constants/uiStyles';
import { supabase } from '../supabaseClient';
import { Notification } from './Notification';
import logo from '../assets/wm-logo.svg';
import { HiMenuAlt2 } from 'react-icons/hi';
import { HiOutlineArchiveBox, HiOutlineBanknotes, HiOutlineUserGroup, HiOutlineArrowRightOnRectangle, HiOutlineLockClosed } from 'react-icons/hi2';
import { IoChevronForward } from 'react-icons/io5';

const NAV_ITEMS = [
  { path: '/inventory-system', label: 'Inventory System', Icon: HiOutlineArchiveBox },
  { path: '/sales-system', label: 'Sales System', Icon: HiOutlineBanknotes },
  { path: '/hr-system', label: 'Human Resource', Icon: HiOutlineUserGroup, restrictedTo: 'HR Admin' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('User')
        .select('RoleName')
        .eq('UserID', user.id)
        .maybeSingle();

      setUserRole(data?.RoleName || null);
    };
    fetchRole();
  }, []);

  const isActive = (path) => location.pathname === path;
  const isLocked = (item) => item.restrictedTo && userRole !== null && userRole !== item.restrictedTo;

  const handleNavClick = (item) => {
    if (isLocked(item)) {
      setNotification({ message: 'Only Admins can access the Human Resource page.', type: 'error' });
      return;
    }
    navigate(item.path);
  };

  const getLinkStyle = (item) => ({
    padding: collapsed ? "12px 0" : "12px 14px",
    fontSize: typeScale.body,
    fontWeight: 600,
    borderRadius: "12px",
    marginBottom: "6px",
    color: "white",
    cursor: isLocked(item) ? "not-allowed" : "pointer",
    background: isActive(item.path) ? "rgba(255,255,255,0.16)" : "transparent",
    boxShadow: isActive(item.path) ? "inset 0 0 0 1px rgba(255,255,255,0.15)" : "none",
    opacity: isLocked(item) ? 0.4 : (isActive(item.path) ? 1 : 0.72),
    fontStyle: isLocked(item) ? "italic" : "normal",
    display: "flex",
    justifyContent: collapsed ? "center" : "space-between",
    alignItems: "center",
    gap: "10px",
    transition: "background 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease",
    whiteSpace: "nowrap",
    overflow: "hidden"
  });

  return (
    <div
      className="no-print sidebar-shell"
      style={{
        width: collapsed ? "78px" : "252px",
        flexShrink: 0,
        background: `linear-gradient(165deg, ${colors.green} 0%, ${colors.darkGreen} 100%)`,
        padding: collapsed ? "20px 12px" : "24px 18px",
        color: "white",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        height: "100vh",
        position: "relative",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "2px 0 18px rgba(0,0,0,0.18)",
        zIndex: 10
      }}
    >
      {/* HAMBURGER TOGGLE */}
      <button
        className="icon-btn"
        onClick={() => setCollapsed(prev => !prev)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          position: "absolute",
          top: "18px",
          right: collapsed ? "50%" : "14px",
          transform: collapsed ? "translateX(50%)" : "none",
          background: "rgba(255,255,255,0.14)",
          borderRadius: "9px",
          width: "34px",
          height: "34px",
          color: "white",
          fontSize: "17px",
          transition: "background 0.2s ease, right 0.3s ease, transform 0.3s ease"
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.26)"}
        onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
      >
        <HiMenuAlt2 />
      </button>

      <div style={{ paddingBottom: "8px", paddingTop: collapsed ? "36px" : "8px", textAlign: "center", transition: "padding 0.3s ease" }}>
        <img src={logo} alt="Logo" style={{ width: collapsed ? "36px" : "116px", height: "auto", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
      {!collapsed && (
        <h2 style={{ fontSize: typeScale.h3, marginBottom: "34px", marginTop: "-14px", textAlign: "center", fontWeight: 700, letterSpacing: "0.3px" }}>
          WeekendMatcha
        </h2>
      )}
      {collapsed && <div style={{ marginBottom: "26px" }} />}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.path}
            style={getLinkStyle(item)}
            onClick={() => handleNavClick(item)}
            title={collapsed ? (isLocked(item) ? `${item.label} (Admins only)` : item.label) : undefined}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <item.Icon size={19} />
              {!collapsed && item.label}
            </span>
            {!collapsed && (isLocked(item) ? <HiOutlineLockClosed size={14} /> : (isActive(item.path) && <IoChevronForward size={14} />))}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          cursor: "pointer",
          opacity: 0.85,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: "12px",
          fontSize: typeScale.body,
          fontWeight: 600,
          padding: "10px",
          borderRadius: "12px",
          transition: "background 0.18s ease, opacity 0.18s ease"
        }}
        onClick={() => navigate('/')}
        onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.opacity = 1; }}
        onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.opacity = 0.85; }}
        title={collapsed ? "Log Out" : undefined}
      >
        <HiOutlineArrowRightOnRectangle size={19} /> {!collapsed && "Log Out"}
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default Sidebar;
