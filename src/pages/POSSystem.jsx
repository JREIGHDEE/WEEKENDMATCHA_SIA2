import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import logo from '../assets/wm-logo.svg' 
import { Notification } from '../components/Notification'
import CancelConfirmationModal from '../components/CancelConfirmationModal'
import { usePOSLogic } from '../hooks/usePOSLogic'
import POSModals from '../components/POSModals'

function POSSystem() {
  const { state, actions, ui, navigate } = usePOSLogic();
  const { colors, uiStyles, paginate } = ui;

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [pendingCloseAction, setPendingCloseAction] = useState(null)

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

  if (state.loading) return <div style={{height: "100vh", background: colors.green, display:"flex", justifyContent:"center", alignItems:"center", color:"white"}}>Loading POS...</div>

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif", background: colors.beige }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ paddingBottom: "10px", textAlign: "center" }}><img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} /></div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#404f3d", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "32px", marginBottom: "10px", border: "2px solid rgba(255,255,255,0.2)" }}>{state.currentUser?.User?.FirstName?.charAt(0)}</div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>{state.currentUser?.User?.FirstName}</div>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>ID: {state.currentUser?.EmployeeID}</div>
            <div style={{ width: "70%", height: "1px", background: "rgba(255,255,255,0.3)", marginTop: "20px" }}></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={uiStyles.sidebarItem(state.activeTab === 'POS')} onClick={() => actions.setActiveTab('POS')}>POS</div>
            <div style={uiStyles.sidebarItem(state.activeTab === 'CurrentOrders')} onClick={() => actions.setActiveTab('CurrentOrders')}>Current Orders</div>
        </div>
        <div style={{ marginTop: "auto", padding: "30px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "16px" }} onClick={() => { supabase.auth.signOut(); navigate('/') }}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px 30px", display: "flex", flexDirection: "column" }}>
        <h1 style={{ color: "#5a6955", margin: "0 0 15px 0", fontSize: "28px" }}>Point of Sale System</h1>

        {/* VIEW: POS */}
        {state.activeTab === 'POS' && (
            <div style={{ display: "flex", gap: "25px", flex: 1, overflow: "hidden" }}>
                {/* MENU GRID */}
                <div style={{ flex: 2, background: colors.white, borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "25px" }}>
                        <input placeholder="Search" style={{ background: "#EAEAEA", border: "none", padding: "10px 20px", borderRadius: "30px", width: "50%", outline: "none" }} value={state.searchQuery} onChange={(e) => actions.setSearchQuery(e.target.value)} />
                        <button onClick={() => actions.setShowAdminLogin(true)} style={{ background: "#5a6955", color: "white", border: "none", padding: "10px 25px", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", fontSize: "12px", letterSpacing: "1px" }}>MANAGE MENU</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", overflowY: "auto", paddingRight: "5px" }}>
                        {state.menu.filter(i => i.name.toLowerCase().includes(state.searchQuery.toLowerCase())).map(item => (
                            <div key={item.id} onClick={() => actions.handleItemClick(item)} style={{ border: "2px solid #333", borderRadius: "10px", padding: "15px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", transition: "0.2s", background: "white" }}>
                                <div style={{ width: "100px", height: "100px", marginBottom: "15px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                    {item.img ? <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: "50px" }}>🍵</span>}
                                    <div style={{position: "absolute", bottom: 0, right: 0, background: item.category === 'Powder' ? '#5a6955' : '#E5C546', color: 'white', fontSize: "10px", padding: "2px 5px", borderRadius: "5px"}}>{item.category}</div>
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#333", marginBottom: "5px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.name}</div>
                                <div style={{ fontSize: "12px", color: "#777", fontWeight: "bold" }}>₱{item.price.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CART */}
                <div style={{ flex: 1, background: colors.white, borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", maxWidth: "400px" }}>
                    <h2 style={{ color: "#5a6955", margin: "0 0 25px 0", fontSize: "22px" }}>Current Order</h2>
                    <div style={{ flex: 1, overflowY: "auto", marginBottom: "20px" }}>
                        {state.cart.length === 0 ? <div style={{ textAlign: "center", color: "#999", marginTop: "100px", fontSize: "14px" }}>No items in order.</div> : state.cart.map(item => (
                            <div key={item.uniqueKey} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                                <div style={{width: "40%"}}>
                                    <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>{item.name}</div>
                                    <div style={{ fontSize: "11px", color: colors.blueText, fontWeight: "bold" }}>{item.sweetness}</div>
                                    <div style={{ fontSize: "11px", color: "#999" }}>{item.qty} x ₱{item.price}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><button onClick={() => actions.decreaseQty(item.uniqueKey)} style={{ width: "25px", height: "25px", borderRadius: "50%", border: "1px solid #333", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button><span style={{ fontWeight: "bold", fontSize: "14px" }}>{item.qty}</span><button onClick={() => actions.increaseQty(item.uniqueKey)} style={{ width: "25px", height: "25px", borderRadius: "50%", border: "1px solid #333", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button></div>
                                <div style={{ width: "25%", textAlign: "right", fontWeight: "bold", fontSize: "14px" }}>₱{(item.price * item.qty).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}><h3 style={{ margin: 0, color: "#888", fontSize: "16px" }}>TOTAL</h3><h2 style={{ margin: 0, color: "#888", fontSize: "24px" }}>₱{actions.getSubtotal().toFixed(2)}</h2></div>
                        <button onClick={actions.handleOpenPayment} disabled={state.cart.length === 0} style={{ width: "100%", padding: "15px", background: state.cart.length === 0 ? "#ccc" : colors.darkBtn, color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: state.cart.length === 0 ? "default" : "pointer", marginBottom: "10px", fontSize: "14px" }}>Process Payment</button>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: CURRENT ORDERS */}
        {state.activeTab === 'CurrentOrders' && (
            <div style={{ flex: 1, background: colors.white, borderRadius: "20px", padding: "0", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                <div style={{ padding: "20px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    {/* <button onClick={() => { actions.fetchRecentTransactions(); actions.setNotification({ message: 'Data refreshed', type: 'success' }) }} style={{ background: "#FF9800", color: "white", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>REFRESH</button> */}
                    <button onClick={() => { actions.setRecentPage(1); actions.setShowRecentModal(true) }} style={{ background: "#3b5998", color: "white", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>VIEW RECENT TRANSACTIONS</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "#6B7C65", color: "white", borderRadius: "10px 10px 0 0" }}>
                            <tr><th style={{ padding: "15px", textAlign: "left", width: "25%" }}>Name</th><th style={{ padding: "15px", textAlign: "left", width: "40%" }}>Orders</th><th style={{ padding: "15px", textAlign: "center", width: "15%" }}>Transaction ID</th><th style={{ padding: "15px", textAlign: "center", width: "20%" }}>Status</th></tr>
                        </thead>
                        <tbody>
                            {paginate(state.orders, state.orderPage, state.ordersPerPage).map(order => (
                                <tr key={order.id} style={{ borderBottom: "1px solid #ddd", height: "80px", verticalAlign: "middle" }}>
                                    <td style={{ padding: "10px 15px", fontWeight: "bold", color: "#333" }}>{order.customer.toUpperCase()}</td>
                                    <td style={{ padding: "10px 15px", color: "#333", fontSize: "13px", lineHeight: "1.6" }}>
                                        {order.items.map((item, idx) => (<div key={idx}><span style={{ fontWeight: "bold" }}>{item.name}</span> ({item.sweetness}) <span style={{ fontWeight: "bold" }}>x{item.qty}</span></div>))}
                                    </td>
                                    <td style={{ textAlign: "center", fontWeight: "bold", color: "#666" }}>{order.id}</td>
                                    <td style={{ textAlign: "center" }}><button onClick={() => actions.handleStatusClick(order)} style={{ padding: "8px 20px", borderRadius: "20px", border: "none", background: order.status === 'NOT IN PROGRESS' ? colors.statusRed : (order.status === 'IN PROGRESS' ? colors.statusYellow : colors.statusGreen), color: "white", fontWeight: "bold", fontSize: "11px", cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>{order.status}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationControls total={state.orders.length} page={state.orderPage} setPage={actions.setOrderPage} perPage={state.ordersPerPage} />
            </div>
        )}
      </div>

      {/* ALL POPUP MODALS INJECTED HERE */}
      <POSModals 
        state={state} 
        actions={actions} 
        ui={{...ui, showCancelConfirm, handleCancelClick, handleCancelConfirm, handleCancelCancel}} 
        PaginationControls={PaginationControls} 
      />

      <CancelConfirmationModal 
        isOpen={showCancelConfirm} 
        onConfirm={handleCancelConfirm} 
        onCancel={handleCancelCancel}
        colors={colors}
        btnStyle={uiStyles.btnStyle || {padding: "8px 16px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold", color: "white"}}
      />

      <Notification message={state.notification.message} type={state.notification.type} onClose={() => actions.setNotification({ message: '', type: 'success' })} />
    </div>
  )
}

export default POSSystem