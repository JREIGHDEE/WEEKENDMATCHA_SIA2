import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import logo from '../assets/wm-logo.svg'
import { Notification } from '../components/Notification'
import { usePOSLogic } from '../hooks/usePOSLogic'
import POSModals from '../components/POSModals'
import LoadingSpinner from '../components/LoadingSpinner'
import { type as typeScale } from '../constants/uiStyles'
import { HiMenuAlt2 } from 'react-icons/hi'
import { HiOutlineShoppingCart, HiOutlineClipboardDocumentList, HiOutlineClock, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2'
import { GiTeapotLeaves } from 'react-icons/gi'
import { IoClose } from 'react-icons/io5'

function POSSystem() {
  const { state, actions, ui, navigate } = usePOSLogic();
  const { colors, uiStyles, paginate } = ui;

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [pendingCloseAction, setPendingCloseAction] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // --- NEW: LONG PRESS TO DRAG LOGIC ---
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [draggableItemId, setDraggableItemId] = useState(null)

  const handlePointerDown = (item) => {
    // Start a 500ms timer when they touch the item
    const timer = setTimeout(() => {
      setDraggableItemId(item.id)
      // Small vibration if the tablet supports it so they feel it unlock
      if (navigator.vibrate) navigator.vibrate(50) 
    }, 500)
    setLongPressTimer(timer)
  }

  const clearLongPress = () => {
    if (longPressTimer) clearTimeout(longPressTimer)
  }
  // -------------------------------------

  const handleCancelClick = (action) => {
    setPendingCloseAction(() => action)
    setShowCancelConfirm(true)
  }

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false)
    if (pendingCloseAction) {
      pendingCloseAction()
    }
    setPendingCloseAction(null)
  }

  const handleCancelCancel = () => {
    setShowCancelConfirm(false)
    setPendingCloseAction(null)
  }

  const PaginationControls = ({ total, page, setPage, perPage }) => {
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "10px", gap: "10px", alignItems: "center", fontWeight: "bold", color: "#666" }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
          <span key={num} onClick={() => setPage(num)} style={{ cursor: "pointer", color: page === num ? "#333" : "#ccc", fontSize: "16px", transform: page === num ? "scale(1.2)" : "scale(1)" }}>{num}</span>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif", background: colors.beige }}>
      
      {/* SIDEBAR */}
      <div className="sidebar-shell" style={{ width: sidebarCollapsed ? "78px" : "252px", flexShrink: 0, background: `linear-gradient(165deg, ${colors.green} 0%, #4A5D4B 100%)`, padding: sidebarCollapsed ? "20px 12px" : "24px 18px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)", boxShadow: "2px 0 18px rgba(0,0,0,0.18)" }}>
        <button
          className="icon-btn"
          onClick={() => setSidebarCollapsed(prev => !prev)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ position: "absolute", top: "18px", right: sidebarCollapsed ? "50%" : "14px", transform: sidebarCollapsed ? "translateX(50%)" : "none", background: "rgba(255,255,255,0.14)", borderRadius: "9px", width: "34px", height: "34px", color: "white", fontSize: "17px", transition: "background 0.2s ease, right 0.3s ease, transform 0.3s ease" }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.26)"}
          onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
        >
          <HiMenuAlt2 />
        </button>
        <div style={{ paddingBottom: "8px", paddingTop: sidebarCollapsed ? "36px" : "8px", textAlign: "center", transition: "padding 0.3s ease" }}><img src={logo} alt="WeekendMatcha Logo" style={{ width: sidebarCollapsed ? "36px" : "116px", height: "auto", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} /></div>
        {!sidebarCollapsed && <h2 style={{fontSize: typeScale.h3, marginBottom: "34px", marginTop: "-14px", textAlign: "center", fontWeight: 700}}>WeekendMatcha</h2>}
        {sidebarCollapsed && <div style={{ marginBottom: "26px" }} />}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}>
            <div
              onClick={actions.handleOpenSwitchProfile}
              onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.borderColor = "white"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
              style={{
                width: sidebarCollapsed ? "44px" : "80px", height: sidebarCollapsed ? "44px" : "80px", borderRadius: "50%", background: "#404f3d", display: "flex", justifyContent: "center", alignItems: "center",
                fontSize: sidebarCollapsed ? "18px" : "32px", marginBottom: "10px", border: "2px solid rgba(255,255,255,0.2)", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s, width 0.28s ease, height 0.28s ease, font-size 0.28s ease"
              }}
              title="Click to Switch Profile"
            >
              {state.currentUser?.User?.FirstName?.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <>
                <div style={{ fontSize: typeScale.h3, fontWeight: "bold" }}>{state.currentUser?.User?.FirstName}</div>
                <div style={{ fontSize: typeScale.small, opacity: 0.8 }}>ID: {state.currentUser?.EmployeeID}</div>
              </>
            )}
            <div style={{ width: "70%", height: "1px", background: "rgba(255,255,255,0.3)", marginTop: "20px" }}></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{...uiStyles.sidebarItem(state.activeTab === 'POS'), justifyContent: sidebarCollapsed ? "center" : "flex-start", display: "flex", alignItems: "center", gap: "12px"}} onClick={() => actions.setActiveTab('POS')} title="POS"><HiOutlineShoppingCart size={19} />{!sidebarCollapsed && "POS"}</div>
            <div style={{...uiStyles.sidebarItem(state.activeTab === 'CurrentOrders'), justifyContent: sidebarCollapsed ? "center" : "flex-start", display: "flex", alignItems: "center", gap: "12px"}} onClick={() => actions.setActiveTab('CurrentOrders')} title="Current Orders"><HiOutlineClipboardDocumentList size={19} />{!sidebarCollapsed && "Current Orders"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto", marginBottom: "20px" }}>
            {(() => {
              const canTimeIn = actions.canPosTimeIn()
              const isLocked = !state.posEmployeeTimedIn && !state.posEmployeeTimedOutToday && !canTimeIn
              return (
                <button
                  onClick={actions.handleOpenPOSTimeInOut}
                  disabled={state.posEmployeeTimedOutToday || state.loading || isLocked}
                  title={state.posEmployeeTimedOutToday ? "Shift completed for today" : (isLocked ? "Not yet within 1 hour of your scheduled shift" : (state.posEmployeeTimedIn ? "Time Out" : "Time In"))}
                  className="btn-animated"
                  style={{
                    padding: sidebarCollapsed ? "12px 0" : "12px 20px",
                    background: state.posEmployeeTimedOutToday || isLocked ? "#888" : (state.posEmployeeTimedIn ? colors.discountRed : colors.blueText),
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    cursor: state.posEmployeeTimedOutToday || state.loading || isLocked ? "not-allowed" : "pointer",
                    fontSize: typeScale.small,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  {state.loading ? <LoadingSpinner size={12} color="white" /> : (sidebarCollapsed && <HiOutlineClock size={16} />)}
                  {!sidebarCollapsed && (state.posEmployeeTimedOutToday ? "TIMED OUT" : (isLocked ? "SCHEDULED" : (state.posEmployeeTimedIn ? "TIME OUT" : "TIME IN")))}
                </button>
              )
            })()}
        </div>
        <div style={{ padding: sidebarCollapsed ? "20px 0" : "16px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "flex-start", gap: "12px", fontSize: typeScale.body, fontWeight: 600, borderRadius: "12px", transition: "background 0.2s ease" }}
          onClick={() => { supabase.auth.signOut(); navigate('/') }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          title="Log Out"
        >
          <HiOutlineArrowRightOnRectangle size={19} /> {!sidebarCollapsed && "Log Out"}
        </div>
      </div>

{/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 30px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* HEADER ROW (Title and Button perfectly aligned) */}
        <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
            <h1 style={{ color: "#5a6955", margin: 0, fontSize: typeScale.h1, fontWeight: 800 }}>Point of Sale System</h1>

            {/* This button will only appear when the Current Orders tab is active */}
            {state.activeTab === 'CurrentOrders' && (
                <button
                  className="btn-animated"
                  onClick={() => { actions.setRecentPage(1); actions.setShowRecentModal(true) }}
                  style={{ background: "#3b5998", color: "white", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", fontSize: typeScale.micro, cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}
                >
                  VIEW RECENT TRANSACTIONS
                </button>
            )}
        </div>

        {/* VIEW: POS */}
        {state.activeTab === 'POS' && (
            <div className="responsive-stack" style={{ display: "flex", gap: "25px", flex: 1, overflow: "hidden" }}>
                {/* MENU GRID */}
                <div style={{ flex: 2, background: colors.white, borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "25px", gap: "12px", flexWrap: "wrap" }}>
                        <input placeholder="Search" style={{ background: "#EAEAEA", border: "none", padding: "10px 20px", borderRadius: "30px", flex: 1, minWidth: "160px", outline: "none", fontSize: typeScale.body }} value={state.searchQuery} onChange={(e) => actions.setSearchQuery(e.target.value)} />
                        <button className="btn-animated" onClick={() => actions.setShowAdminLogin(true)} style={{ background: "#5a6955", color: "white", border: "none", padding: "10px 25px", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", fontSize: typeScale.micro, letterSpacing: "1px", whiteSpace: "nowrap" }}>MANAGE MENU</button>
                    </div>
                    <div className="responsive-grid-tight" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "18px", overflowY: "auto", paddingRight: "5px" }}>
                        {state.menu.filter(i => i.name.toLowerCase().includes(state.searchQuery.toLowerCase())).map(item => (
                            <div 
                                key={item.id} 
                                className="card-hover" 
                                
                                // --- DRAG & DROP ATTRIBUTES START HERE ---
                                draggable={draggableItemId === item.id}
                                onPointerDown={() => handlePointerDown(item)}
                                onPointerUp={clearLongPress}
                                onPointerLeave={clearLongPress}
                                onDragStart={(e) => actions.handleDragStart(e, item)}
                                onDragOver={actions.handleDragOver}
                                onDrop={(e) => {
                                    actions.handleDrop(e, item)
                                    setDraggableItemId(null)
                                }}
                                onDragEnd={() => setDraggableItemId(null)}
                                onClick={() => {
                                  // Prevents triggering a cart-add if they were just finishing a drag
                                  if (draggableItemId !== item.id) {
                                     actions.handleItemClick(item)
                                  }
                                  clearLongPress()
                                }}
                                // ------------------------------------------
                                
                                style={{ 
                                  border: "1px solid #e7e7e7", 
                                  borderRadius: "14px", 
                                  padding: "15px", 
                                  textAlign: "center", 
                                  display: "flex", 
                                  flexDirection: "column", 
                                  alignItems: "center", 
                                  background: "white", 
                                  
                                  // --- DYNAMIC STYLES FOR DRAG EFFECTS ---
                                  opacity: state.draggedItem?.id === item.id ? 0.4 : 1,
                                  transform: draggableItemId === item.id ? 'scale(1.05)' : 'scale(1)',
                                  boxShadow: draggableItemId === item.id ? '0 10px 20px rgba(0,0,0,0.2)' : "0 2px 8px rgba(0,0,0,0.06)",
                                  transition: "transform 0.2s, box-shadow 0.2s, opacity 0.2s",
                                  cursor: draggableItemId === item.id ? "grab" : "pointer",
                                  userSelect: "none", // Critical for mobile to prevent text highlighting
                                  WebkitUserSelect: "none"
                                  // ---------------------------------------
                                }}
                            >
                                <div style={{ width: "100px", height: "100px", marginBottom: "15px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                    {item.img ? <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} /> : <GiTeapotLeaves size={50} color="#8ba384" style={{pointerEvents: "none"}} />}
                                    <div style={{position: "absolute", bottom: 0, right: 0, background: item.category === 'Powder' ? '#5a6955' : '#E5C546', color: 'white', fontSize: typeScale.micro, padding: "2px 5px", borderRadius: "5px"}}>{item.category}</div>
                                </div>
                                <div style={{ fontSize: typeScale.body, fontWeight: "bold", color: "#333", marginBottom: "5px", minHeight: "35px", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.name}</div>
                                <div style={{ fontSize: typeScale.small, color: "#777", fontWeight: "bold" }}>₱{item.price.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CART */}
                <div style={{ flex: 1, background: colors.white, borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", minWidth: "300px", maxWidth: "400px" }}>
                    <h2 style={{ color: "#5a6955", margin: "0 0 25px 0", fontSize: typeScale.h2 }}>Current Order</h2>
                    <div style={{ flex: 1, overflowY: "auto", marginBottom: "20px" }}>
                        {state.cart.length === 0 ? <div style={{ textAlign: "center", color: "#999", marginTop: "100px", fontSize: typeScale.body }}>No items in order.</div> : state.cart.map(item => (
                            <div key={item.uniqueKey} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                                <div style={{width: "40%"}}>
                                    <div style={{ fontWeight: "bold", fontSize: typeScale.body, color: "#333" }}>{item.name}</div>
                                    <div style={{ fontSize: typeScale.small, color: colors.blueText, fontWeight: "bold" }}>{item.sweetness}</div>
                                    <div style={{ fontSize: typeScale.small, color: "#999" }}>{item.qty} x ₱{item.price}</div>
                                    {(item.category === 'Powder' || item.category === 'Add-on') && (
                                        <label style={{ fontSize: typeScale.small, color: "#5a6955", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", cursor: "pointer" }}>
                                            <input type="checkbox" checked={!!item.isSeniorPwdDiscounted} onChange={() => actions.toggleItemDiscount(item.uniqueKey)} />
                                            SC/PWD Discount
                                        </label>
                                    )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><button className="icon-btn" onClick={() => actions.decreaseQty(item.uniqueKey)} style={{ width: "26px", height: "26px", borderRadius: "50%", border: "1px solid #333", background: "white", fontWeight: "bold" }}>-</button><span style={{ fontWeight: "bold", fontSize: typeScale.body }}>{item.qty}</span><button className="icon-btn" onClick={() => actions.increaseQty(item.uniqueKey)} style={{ width: "26px", height: "26px", borderRadius: "50%", border: "1px solid #333", background: "white", fontWeight: "bold" }}>+</button></div>
                                <div style={{ width: "25%", textAlign: "right", fontWeight: "bold", fontSize: typeScale.body }}>
                                    {item.isSeniorPwdDiscounted ? (
                                        <>
                                            <div style={{ textDecoration: "line-through", color: "#ccc", fontSize: typeScale.small }}>₱{(item.price * item.qty).toFixed(2)}</div>
                                            <div style={{ color: "red" }}>₱{(item.price * item.qty * 0.9).toFixed(2)}</div>
                                        </>
                                    ) : (
                                        `₱${(item.price * item.qty).toFixed(2)}`
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}><h3 style={{ margin: 0, color: "#888", fontSize: typeScale.h3 }}>TOTAL</h3><h2 style={{ margin: 0, color: "#888", fontSize: typeScale.stat }}>₱{actions.getFinalTotal().toFixed(2)}</h2></div>
                        <button className="btn-animated" onClick={actions.handleOpenPayment} disabled={state.cart.length === 0 || state.loading} style={{ width: "100%", padding: "15px", background: state.cart.length === 0 || state.loading ? "#ccc" : colors.darkBtn, color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: state.cart.length === 0 || state.loading ? "default" : "pointer", marginBottom: "10px", fontSize: typeScale.body, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          {state.loading ? <LoadingSpinner size={14} color="white" /> : null}
                          {state.loading ? 'Processing...' : 'Process Payment'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: CURRENT ORDERS */}
        {state.activeTab === 'CurrentOrders' && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                <div style={{ flex: 1, background: colors.white, borderRadius: "15px", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ position: "sticky", top: 0, background: colors.green, color: "white", zIndex: 1 }}>
                                <tr>
                                    <th style={{ padding: "15px", textAlign: "left", width: "25%", paddingLeft: "25px" }}>Name</th>
                                    <th style={{ padding: "15px", textAlign: "left", width: "40%" }}>Orders</th>
                                    <th style={{ padding: "15px", textAlign: "center", width: "15%" }}>Transaction ID</th>
                                    <th style={{ padding: "15px", textAlign: "center", width: "20%", paddingRight: "25px" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginate(state.orders, state.orderPage, state.ordersPerPage).map(order => (
                                    <tr key={order.id} style={{ borderBottom: "1px solid #ddd", height: "80px", verticalAlign: "middle" }}>
                                        <td style={{ padding: "10px 15px", fontWeight: "bold", color: "#333", paddingLeft: "25px" }}>{order.customer.toUpperCase()}</td>
                                        <td style={{ padding: "10px 15px", color: "#333", fontSize: "13px", lineHeight: "1.6" }}>
                                            {order.items.map((item, idx) => (<div key={idx}><span style={{ fontWeight: "bold" }}>{item.name}</span> ({item.sweetness}) <span style={{ fontWeight: "bold" }}>x{item.qty}</span></div>))}
                                        </td>
                                        <td style={{ textAlign: "center", fontWeight: "bold", color: "#666" }}>{order.id}</td>
                                        <td style={{ textAlign: "center", paddingRight: "25px" }}>
                                            <button onClick={() => actions.handleStatusClick(order)} style={{ padding: "8px 20px", borderRadius: "20px", border: "none", background: order.status === 'NOT IN PROGRESS' ? colors.statusRed : (order.status === 'IN PROGRESS' ? colors.statusYellow : colors.statusGreen), color: "white", fontWeight: "bold", fontSize: "11px", cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>{order.status}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination kept nicely at the bottom with a little top border to separate it */}
                    <div style={{ padding: "10px 0", borderTop: "1px solid #eee", background: "white" }}>
                        <PaginationControls total={state.orders.length} page={state.orderPage} setPage={actions.setOrderPage} perPage={state.ordersPerPage} />
                    </div>
                </div>
            </div>
        )}
        
      </div>{/* SWITCH PROFILE MODAL */}
      {state.showSwitchProfileModal && (
        <div style={uiStyles.modalOverlay}>
            <style>
                {`
                .profile-switch-card {
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .profile-switch-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 15px rgba(0,0,0,0.1);
                }
                .profile-switch-card:active {
                    transform: scale(0.92);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                `}
            </style>
            <div style={{ background: "white", padding: "30px", borderRadius: "22px", width: "min(550px, 92vw)", position: "relative", boxShadow: "0 18px 45px rgba(0,0,0,0.28)" }}>
                {/* The 'X' Button */}
                <button className="icon-btn" onClick={() => actions.setShowSwitchProfileModal(false)} style={{ position: "absolute", top: "18px", right: "18px", background: "#f2f2f2", border: "none", borderRadius: "8px", width: "30px", height: "30px", fontSize: "16px", color: "#888" }} onMouseOver={e => e.currentTarget.style.color = "#333"} onMouseOut={e => e.currentTarget.style.color = "#888"}><IoClose /></button>

                <h2 style={{ color: "#5a6955", margin: "0 0 25px 0", textAlign: "center", fontSize: typeScale.h2 }}>Switch Profile</h2>

                <div className="responsive-grid-tight" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "15px", maxHeight: "400px", overflowY: "auto", padding: "10px" }}>
                    {state.availableEmployees.map(emp => (
                        <div
                            key={emp.EmployeeID}
                            className="profile-switch-card"
                            onClick={() => actions.handleSwitchProfile(emp)}
                            style={{
                              border: state.currentUser?.EmployeeID === emp.EmployeeID ? "2px solid #5a6955" : "1px solid #eee",
                              borderRadius: "15px", padding: "20px 10px", display: "flex", flexDirection: "column", alignItems: "center",
                              cursor: "pointer", background: state.currentUser?.EmployeeID === emp.EmployeeID ? "#f4f7f4" : "white"
                            }}
                        >
                            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#404f3d", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: typeScale.h3, marginBottom: "10px", fontWeight: "bold" }}>
                                {emp.User?.FirstName?.charAt(0)}
                            </div>
                            <div style={{ fontWeight: "bold", fontSize: typeScale.body, color: "#333", textAlign: "center" }}>{emp.User?.FirstName}</div>
                            <div style={{ fontSize: typeScale.small, color: "#888", marginTop: "2px" }}>ID: {emp.EmployeeID}</div>
                            <div style={{ fontSize: typeScale.micro, color: "#5a6955", fontWeight: "bold", marginTop: "5px", opacity: 0.8 }}>{emp.User?.RoleName}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
      {/* ALL POPUP MODALS INJECTED HERE */}
      <POSModals 
        state={state} 
        actions={actions} 
        ui={{...ui, showCancelConfirm, handleCancelClick, handleCancelConfirm, handleCancelCancel}} 
        PaginationControls={PaginationControls} 
      />

      <Notification message={state.notification.message} type={state.notification.type} onClose={() => actions.setNotification({ message: '', type: 'success' })} />
    </div>
  )
}

export default POSSystem