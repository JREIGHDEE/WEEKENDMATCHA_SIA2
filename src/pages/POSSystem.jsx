import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function POSSystem() {
  const navigate = useNavigate()
  
  // --- TABS & USER STATE ---
  const [activeTab, setActiveTab] = useState('POS') 
  const [currentUser, setCurrentUser] = useState(null)
  
  // --- PERSISTENCE: LOAD DATA ---
  // 1. Transaction ID
  const [transactionId, setTransactionId] = useState(() => {
    const saved = localStorage.getItem('pos_transaction_id')
    return saved ? parseInt(saved) : 1
  })

  // 2. Current Orders
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('pos_current_orders')
    return saved ? JSON.parse(saved) : []
  })

  // 3. Completed Orders (Filter for Today)
  const [completedOrders, setCompletedOrders] = useState(() => {
    const saved = localStorage.getItem('pos_completed_orders')
    if (!saved) return []
    const parsed = JSON.parse(saved)
    const today = new Date().toLocaleDateString('en-CA') 
    return parsed.filter(order => order.rawDate === today)
  })

  // 4. MENU (NEW: Load from Storage or Default)
  const [menu, setMenu] = useState(() => {
    const savedMenu = localStorage.getItem('pos_menu')
    if (savedMenu) {
        return JSON.parse(savedMenu)
    } else {
        // Default Menu if nothing is saved
        return [
            { id: 1, name: 'Pistachio Matcha', price: 290.00, img: '🍵' },
            { id: 2, name: 'Matcha Latte', price: 210.00, img: '🥛' },
            { id: 3, name: 'Hojicha', price: 190.00, img: '🍂' },
            { id: 4, name: 'Strawberry Matcha', price: 250.00, img: '🍓' },
            { id: 5, name: 'Peach Mango Matcha', price: 250.00, img: '🍑' },
            { id: 6, name: 'Blueberry Matcha', price: 250.00, img: '🫐' },
        ]
    }
  })

  // --- PERSISTENCE: SAVE EFFECTS ---
  useEffect(() => { localStorage.setItem('pos_transaction_id', transactionId) }, [transactionId])
  useEffect(() => { localStorage.setItem('pos_current_orders', JSON.stringify(orders)) }, [orders])
  useEffect(() => { localStorage.setItem('pos_completed_orders', JSON.stringify(completedOrders)) }, [completedOrders])
  useEffect(() => { localStorage.setItem('pos_menu', JSON.stringify(menu)) }, [menu]) // Save Menu Changes

  // --- OTHER STATE ---
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // --- POS MODAL STATE ---
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  
  // --- PAYMENT FORM STATE ---
  const [customerName, setCustomerName] = useState('')
  const [cashReceived, setCashReceived] = useState('')
  const [isDiscounted, setIsDiscounted] = useState(false)

  // --- ORDER MANAGEMENT STATE ---
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  
  // --- RECENT TRANSACTIONS STATE ---
  const [showRecentModal, setShowRecentModal] = useState(false)

  // --- MANAGE MENU STATE ---
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showManageMenu, setShowManageMenu] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [menuItemToRemove, setMenuItemToRemove] = useState(null)

  // New Item Form State
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemImage, setNewItemImage] = useState(null)
  const fileInputRef = useRef(null)

  // Recipe Builder State
  const [newItemIngredients, setNewItemIngredients] = useState([])
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [showIngDropdown, setShowIngDropdown] = useState(false)

  // Dummy Inventory for Dropdown
  const inventoryItems = [
    { id: 1, name: 'Matcha Powder', unit: 'g' },
    { id: 2, name: 'Fresh Milk', unit: 'ml' },
    { id: 3, name: 'Vanilla Syrup', unit: 'ml' },
    { id: 4, name: 'Ice Cubes', unit: 'pcs' },
    { id: 5, name: 'Water', unit: 'ml' },
    { id: 6, name: 'Brown Sugar', unit: 'g' },
    { id: 7, name: 'Tapioca Pearls', unit: 'g' }
  ]

  // --- PAGINATION STATES ---
  const [orderPage, setOrderPage] = useState(1) 
  const ordersPerPage = 6
  const [recentPage, setRecentPage] = useState(1) 
  const recentPerPage = 5
  const [ingredientPage, setIngredientPage] = useState(1) 
  const ingredientsPerPage = 3 

  // --- 1. FETCH USER ---
  useEffect(() => {
    async function fetchUser() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        const { data, error } = await supabase
            .from('Employee')
            .select('EmployeeID, User(FirstName, LastName, RoleName)')
            .eq('UserID', user.id)
            .maybeSingle()

        if (error || !data) {
            console.error("Error fetching user:", error)
        } else {
            setCurrentUser(data)
        }
        setLoading(false)
    }
    fetchUser()
  }, [])

  // --- 2. POS CORE FUNCTIONS ---
  const addToCart = (item) => setCart(prev => {
    const existing = prev.find(i => i.id === item.id)
    return existing ? prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...item, qty: 1 }]
  })

  const decreaseQty = (itemId) => setCart(prev => prev.map(item => item.id === itemId ? { ...item, qty: item.qty - 1 } : item).filter(item => item.qty > 0))
  const getSubtotal = () => cart.reduce((total, item) => total + (item.price * item.qty), 0)
  const getDiscountAmount = () => isDiscounted ? getSubtotal() * 0.20 : 0
  const getFinalTotal = () => getSubtotal() - getDiscountAmount()
  const getChange = () => (parseFloat(cashReceived) || 0) - getFinalTotal()

  // --- 3. PAYMENT HANDLERS ---
  const handleOpenPayment = () => { if (cart.length > 0) { setCustomerName(''); setCashReceived(''); setIsDiscounted(false); setShowPaymentModal(true) } }

  const handleConfirmPayment = () => {
    if (!customerName.trim()) { alert("⚠️ Customer Name is required!"); return }
    if (getChange() < 0) return 
    
    const newOrder = {
        id: transactionId,
        customer: customerName,
        items: [...cart],
        status: "NOT IN PROGRESS",
        total: getFinalTotal(),
        employeeId: currentUser?.EmployeeID || "EMP000", 
        date: new Date().toLocaleDateString('en-CA'),
        rawDate: new Date().toLocaleDateString('en-CA')
    }
    
    setOrders(prev => [...prev, newOrder]) 
    setTransactionId(prev => prev + 1)
    setShowPaymentModal(false)
    setShowReceiptModal(true)
  }

  const handleNewOrder = () => { setCart([]); setShowReceiptModal(false) }

  // --- 4. ORDER STATUS HANDLERS ---
  const handleStatusClick = (order) => { setSelectedOrder(order); setShowStatusModal(true) }

  const updateStatus = (status) => {
    if (status === 'COMPLETED') {
        setShowStatusModal(false)
        setShowCompleteConfirm(true) 
    } else {
        setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: status } : o))
        setShowStatusModal(false)
    }
  }

  const confirmCompletion = () => {
    const orderToMove = orders.find(o => o.id === selectedOrder.id)
    if (orderToMove) {
        const completedOrder = {
            ...orderToMove,
            status: 'COMPLETED',
            date: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            rawDate: new Date().toLocaleDateString('en-CA')
        }
        setCompletedOrders(prev => [completedOrder, ...prev])
        setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
    }
    setShowCompleteConfirm(false)
  }

  // --- 5. MANAGE MENU HANDLERS ---
  const handleAdminLoginSubmit = async () => {
    if (!adminUser || !adminPass) return alert("Please enter Admin credentials")

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: adminUser,
        password: adminPass,
    })

    if (authError) { alert("Login Failed: " + authError.message); return }

    const { data: userData, error: userError } = await supabase.from('User').select('RoleName').eq('UserID', authData.user.id).maybeSingle()

    if (userError || !userData) { alert("Error verifying role."); return }

    const ADMIN_ROLES = ['HR Admin', 'Inventory Admin', 'Sales Admin']

    if (ADMIN_ROLES.includes(userData.RoleName)) {
        setAdminUser(''); setAdminPass('')
        setShowAdminLogin(false)
        setShowManageMenu(true)
    } else {
        alert("⛔ Access Denied: You do not have Admin privileges.")
    }
  }

  const handleRemoveClick = (item) => { setMenuItemToRemove(item); setShowRemoveConfirm(true) }
  const confirmRemoveItem = () => { setMenu(prev => prev.filter(i => i.id !== menuItemToRemove.id)); setShowRemoveConfirm(false) }
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
        // Use FileReader for Base64 string (better for localStorage than Blob URL which expires)
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewItemImage(reader.result);
        };
        reader.readAsDataURL(file);
    }
  }

  const addIngredient = (ing) => {
    if (!newItemIngredients.find(i => i.id === ing.id)) {
        setNewItemIngredients([...newItemIngredients, { ...ing, amount: '' }])
    }
    setIngredientSearch('')
    setShowIngDropdown(false)
  }

  const removeIngredient = (id) => {
    setNewItemIngredients(prev => prev.filter(i => i.id !== id))
  }

  const handleAddItem = () => {
      if (newItemName && newItemPrice) {
        const newItem = {
            id: Date.now(), // Unique ID based on time
            name: newItemName,
            price: parseFloat(newItemPrice),
            img: newItemImage || '🥤' 
        }
        setMenu([...menu, newItem])
        setNewItemName(''); setNewItemPrice(''); setNewItemImage(null); setNewItemIngredients([])
    }
  }

  const handleSaveMenu = () => {
    // Since we are using the useEffect hook on [menu], it saves automatically to localStorage
    // This button acts as a confirmation/close
    setShowSaveConfirm(false)
    alert("Menu changes saved successfully!")
  }

  // --- STYLES ---
  const colors = { green: "#6B7C65", beige: "#E8DCC6", white: "#ffffff", darkBtn: "#5a6955", redBtn: "#FF6B6B", greyBtn: "#A5A5A5", blueText: "#3b5998", discountRed: "#ff4d4d", statusRed: "#FF6B6B", statusYellow: "#E5C546", statusGreen: "#538D4E" }
  const sidebarItem = (active) => ({ padding: "12px 20px", background: active ? "rgba(255,255,255,0.2)" : "transparent", fontWeight: active ? "bold" : "normal", borderLeft: active ? "5px solid #E8DCC6" : "5px solid transparent", cursor: "pointer" })
  const modalOverlay = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }
  const modalContent = { background: "white", padding: "30px", borderRadius: "20px", width: "450px", display: "flex", flexDirection: "column", gap: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }
  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", fontSize: "16px", boxSizing: "border-box", fontWeight: "bold" }

  const paginate = (items, page, perPage) => items.slice((page - 1) * perPage, (page - 1) * perPage + perPage)
  const PaginationControls = ({ total, page, setPage, perPage }) => {
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "10px", gap: "10px", alignItems: "center", fontWeight: "bold", color: "#666" }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
          <span key={num} onClick={() => setPage(num)} style={{ cursor: "pointer", color: page === num ? "#333" : "#ccc", fontSize: "16px", transform: page === num ? "scale(1.2)" : "scale(1)" }}>{num}</span>
        ))}
        <span onClick={() => setPage(p => Math.min(p + 1, totalPages))} style={{ cursor: "pointer" }}>&gt;</span>
      </div>
    )
  }

  if (loading) return <div style={{height: "100vh", background: colors.green}}></div>

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif", background: colors.beige }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "260px", flexShrink: 0, background: colors.green, display: "flex", flexDirection: "column", color: "white" }}>
        <div style={{ padding: "30px 0 20px", textAlign: "center" }}><h1 style={{ fontSize: "3.5rem", margin: 0, lineHeight: "0.8", fontFamily: "cursive" }}>wm.</h1><p style={{ margin: "5px 0 0", fontSize: "12px", opacity: 0.9 }}>WeekendMatcha</p></div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#404f3d", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "32px", marginBottom: "10px", border: "2px solid rgba(255,255,255,0.2)" }}>{currentUser?.User?.FirstName?.charAt(0)}</div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>{currentUser?.User?.FirstName} {currentUser?.User?.LastName}</div>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>ID: {currentUser?.EmployeeID}</div>
            <div style={{ width: "70%", height: "1px", background: "rgba(255,255,255,0.3)", marginTop: "20px" }}></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={sidebarItem(activeTab === 'POS')} onClick={() => setActiveTab('POS')}>POS</div>
            <div style={sidebarItem(activeTab === 'CurrentOrders')} onClick={() => setActiveTab('CurrentOrders')}>Current Orders</div>
        </div>
        <div style={{ marginTop: "auto", padding: "30px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "16px" }} onClick={() => { supabase.auth.signOut(); navigate('/') }}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px 30px", display: "flex", flexDirection: "column" }}>
        <h1 style={{ color: "#5a6955", margin: "0 0 15px 0", fontSize: "28px" }}>Point of Sale System</h1>

        {/* --- VIEW: POS --- */}
        {activeTab === 'POS' && (
            <div style={{ display: "flex", gap: "25px", flex: 1, overflow: "hidden" }}>
                <div style={{ flex: 2, background: colors.white, borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "25px" }}>
                        <input placeholder="Search" style={{ background: "#EAEAEA", border: "none", padding: "10px 20px", borderRadius: "30px", width: "50%", outline: "none" }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        {/* MANAGE MENU BUTTON */}
                        <button onClick={() => setShowAdminLogin(true)} style={{ background: "#5a6955", color: "white", border: "none", padding: "10px 25px", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", fontSize: "12px", letterSpacing: "1px" }}>MANAGE MENU</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", overflowY: "auto", paddingRight: "5px" }}>
                        {menu.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                            <div key={item.id} onClick={() => addToCart(item)} style={{ border: "2px solid #333", borderRadius: "10px", padding: "15px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", transition: "0.2s", background: "white" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                                <div style={{ fontSize: "60px", marginBottom: "15px" }}>
                                    {typeof item.img === 'string' && item.img.startsWith('data:image') ? <img src={item.img} alt={item.name} style={{width:"60px", height:"60px", objectFit:"cover"}} /> : item.img}
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#333", marginBottom: "5px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.name}</div>
                                <div style={{ fontSize: "12px", color: "#777", fontWeight: "bold" }}>₱{item.price.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ flex: 1, background: colors.white, borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", maxWidth: "400px" }}>
                    <h2 style={{ color: "#5a6955", margin: "0 0 25px 0", fontSize: "22px" }}>Current Order</h2>
                    <div style={{ flex: 1, overflowY: "auto", marginBottom: "20px" }}>
                        {cart.length === 0 ? <div style={{ textAlign: "center", color: "#999", marginTop: "100px", fontSize: "14px" }}>No items in order.</div> : cart.map(item => (
                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                                <div style={{width: "40%"}}><div style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>{item.name}</div><div style={{ fontSize: "11px", color: "#999" }}>{item.qty} x ₱{item.price}</div></div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><button onClick={() => decreaseQty(item.id)} style={{ width: "25px", height: "25px", borderRadius: "50%", border: "1px solid #333", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button><span style={{ fontWeight: "bold", fontSize: "14px" }}>{item.qty}</span><button onClick={() => addToCart(item)} style={{ width: "25px", height: "25px", borderRadius: "50%", border: "1px solid #333", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button></div>
                                <div style={{ width: "25%", textAlign: "right", fontWeight: "bold", fontSize: "14px" }}>₱{(item.price * item.qty).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}><h3 style={{ margin: 0, color: "#888", fontSize: "16px" }}>TOTAL</h3><h2 style={{ margin: 0, color: "#888", fontSize: "24px" }}>₱{getSubtotal().toFixed(2)}</h2></div>
                        <button onClick={handleOpenPayment} disabled={cart.length === 0} style={{ width: "100%", padding: "15px", background: cart.length === 0 ? "#ccc" : colors.darkBtn, color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: cart.length === 0 ? "default" : "pointer", marginBottom: "10px", fontSize: "14px" }}>Process Payment</button>
                        <button onClick={() => setCart([])} disabled={cart.length === 0} style={{ width: "100%", padding: "15px", background: cart.length === 0 ? "#ccc" : colors.redBtn, color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: cart.length === 0 ? "default" : "pointer", fontSize: "14px" }}>Cancel Order</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- VIEW: CURRENT ORDERS --- */}
        {activeTab === 'CurrentOrders' && (
            <div style={{ flex: 1, background: colors.white, borderRadius: "20px", padding: "0", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                <div style={{ padding: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => { setRecentPage(1); setShowRecentModal(true) }} style={{ background: "#3b5998", color: "white", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>VIEW RECENT TRANSACTIONS</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "#6B7C65", color: "white", borderRadius: "10px 10px 0 0" }}>
                            <tr><th style={{ padding: "15px", textAlign: "left", width: "25%" }}>Name</th><th style={{ padding: "15px", textAlign: "left", width: "40%" }}>Orders</th><th style={{ padding: "15px", textAlign: "center", width: "15%" }}>Transaction ID</th><th style={{ padding: "15px", textAlign: "center", width: "20%" }}>Status</th></tr>
                        </thead>
                        <tbody>
                            {paginate(orders, orderPage, ordersPerPage).map(order => (
                                <tr key={order.id} style={{ borderBottom: "1px solid #ddd", height: "80px", verticalAlign: "middle" }}>
                                    <td style={{ padding: "10px 15px", fontWeight: "bold", color: "#333" }}>{order.customer.toUpperCase()}</td>
                                    <td style={{ padding: "10px 15px", color: "#333", fontSize: "13px", lineHeight: "1.6" }}>{order.items.map((item, idx) => (<div key={idx}><span style={{ fontWeight: "bold" }}>{item.name}</span> <span style={{ fontWeight: "bold" }}>(x{item.qty})</span></div>))}</td>
                                    <td style={{ textAlign: "center", fontWeight: "bold", color: "#666" }}>{order.id}</td>
                                    <td style={{ textAlign: "center" }}><button onClick={() => handleStatusClick(order)} style={{ padding: "8px 20px", borderRadius: "20px", border: "none", background: order.status === 'NOT IN PROGRESS' ? colors.statusRed : (order.status === 'IN PROGRESS' ? colors.statusYellow : colors.statusGreen), color: "white", fontWeight: "bold", fontSize: "11px", cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>{order.status}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationControls total={orders.length} page={orderPage} setPage={setOrderPage} perPage={ordersPerPage} />
            </div>
        )}

      </div>

      {/* --- MODAL: ADMIN LOGIN --- */}
      {showAdminLogin && (
        <div style={modalOverlay}>
            <div style={{background: "#4A5D4B", padding: "40px", borderRadius: "15px", width: "400px", display: "flex", flexDirection: "column", gap: "20px", color: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"}}>
                <h2 style={{textAlign: "center", marginTop: 0}}>Admin Login</h2>
                <div><label style={{fontSize: "14px", fontWeight: "bold"}}>Email (Admin):</label><input style={{...inputStyle, marginTop: "5px"}} value={adminUser} onChange={e => setAdminUser(e.target.value)} /></div>
                <div><label style={{fontSize: "14px", fontWeight: "bold"}}>Password:</label><input type="password" style={{...inputStyle, marginTop: "5px"}} value={adminPass} onChange={e => setAdminPass(e.target.value)} /></div>
                <button onClick={handleAdminLoginSubmit} style={{background: "#6B7C65", color: "white", padding: "12px", border: "1px solid white", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", marginTop: "10px"}}>LOG IN</button>
                <button onClick={() => setShowAdminLogin(false)} style={{background: "transparent", color: "white", border: "none", textDecoration: "underline", cursor: "pointer"}}>Cancel</button>
            </div>
        </div>
      )}

      {/* --- MODAL: MANAGE MENU --- */}
      {showManageMenu && (
        <div style={modalOverlay}>
            <div style={{background: "white", padding: "30px", borderRadius: "20px", width: "900px", height: "700px", display: "flex", flexDirection: "column", boxShadow: "0 10px 40px rgba(0,0,0,0.2)"}}>
                
                {/* Header */}
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
                    <h1 style={{color: "#5a6955", margin: 0, fontSize: "28px"}}>Manage Menu</h1>
                    <button onClick={() => setShowManageMenu(false)} style={{background: "transparent", border: "none", fontSize: "20px", fontWeight: "bold", cursor: "pointer", color: "#999"}}>✕</button>
                </div>

                <div style={{display: "flex", gap: "40px", flex: 1, overflow: "hidden"}}>
                    
                    {/* LEFT: Add Item & Recipe */}
                    <div style={{flex: 1, display: "flex", flexDirection: "column", gap: "10px", height: "100%"}}>
                        <h3 style={{margin: "0 0 5px", color: "#333", fontSize: "16px"}}>Add New Item</h3>
                        <div><label style={{fontWeight: "bold", fontSize: "13px", color: "#555"}}>Product Name</label><input style={{...inputStyle, padding: "8px", fontWeight: "normal"}} value={newItemName} onChange={e => setNewItemName(e.target.value)} /></div>
                        <div><label style={{fontWeight: "bold", fontSize: "13px", color: "#555"}}>Product Price</label><input type="number" style={{...inputStyle, padding: "8px", fontWeight: "normal"}} value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} /></div>
                        
                        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", margin: "5px 0"}}>
                            <div style={{width: "100px", height: "100px", border: "1px solid #333", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", fontSize: "12px", background: "#f9f9f9", overflow:"hidden"}}>
                                {newItemImage ? <img src={newItemImage} style={{width:"100%", height:"100%", objectFit:"cover"}} /> : "image\nPreview"}
                            </div>
                            <input type="file" accept="image/*" ref={fileInputRef} style={{display:"none"}} onChange={handleImageUpload} />
                            <button onClick={() => fileInputRef.current.click()} style={{width: "100%", padding: "8px", border: "1px solid #333", background: "#f0f0f0", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold"}}>Upload Image</button>
                        </div>

                        {/* Recipe Builder */}
                        <div style={{borderTop: "1px solid #ddd", paddingTop: "10px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden"}}>
                            <h3 style={{margin: "0 0 10px", color: "#333", fontSize: "16px"}}>Build Recipe</h3>
                            <div style={{position: "relative", marginBottom: "10px"}}>
                                <input placeholder="Search for an Ingredient to add" style={{...inputStyle, padding: "8px", fontWeight: "normal"}} value={ingredientSearch} onChange={(e) => { setIngredientSearch(e.target.value); setShowIngDropdown(true) }} onFocus={() => setShowIngDropdown(true)} />
                                {showIngDropdown && (
                                    <div style={{position: "absolute", top: "100%", left: 0, width: "100%", background: "white", border: "1px solid #ccc", zIndex: 10, maxHeight: "150px", overflowY: "auto"}}>
                                        {inventoryItems.filter(i => i.name.toLowerCase().includes(ingredientSearch.toLowerCase())).map(item => (
                                            <div key={item.id} onClick={() => addIngredient(item)} style={{padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "13px"}}>{item.name} ({item.unit})</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{flex: 1, overflowY: "auto", paddingRight: "5px"}}>
                                {paginate(newItemIngredients, ingredientPage, ingredientsPerPage).map((ing, idx) => (
                                    <div key={idx} style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px"}}>
                                        <span style={{flex: 1, fontWeight: "bold", fontSize: "13px"}}>{ing.name}</span>
                                        <input style={{width: "50px", padding: "5px", border: "1px solid #333", borderRadius: "5px", textAlign: "center"}} placeholder="0" />
                                        <span style={{width: "20px", fontSize: "12px"}}>{ing.unit}</span>
                                        <button onClick={() => removeIngredient(ing.id)} style={{background: "#FF6B6B", color: "white", border: "none", borderRadius: "5px", width: "25px", height: "25px", cursor: "pointer", fontWeight: "bold"}}>X</button>
                                    </div>
                                ))}
                            </div>
                            <div style={{marginTop: "auto"}}>
                                <PaginationControls total={newItemIngredients.length} page={ingredientPage} setPage={setIngredientPage} perPage={ingredientsPerPage} />
                            </div>
                        </div>
                        
                        <button onClick={handleAddItem} style={{marginTop: "10px", width: "100%", padding: "12px", background: "#607D8B", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", height: "50px"}}>ADD ITEM</button>
                    </div>

                    {/* RIGHT: Current Menu List */}
                    <div style={{flex: 1, borderLeft: "1px solid #ccc", paddingLeft: "40px", display: "flex", flexDirection: "column", height: "100%"}}>
                        <h3 style={{margin: "0 0 20px", color: "#333"}}>Current Menu Items</h3>
                        <div style={{flex: 1, overflowY: "auto", paddingRight: "10px"}}>
                            {menu.map(item => (
                                <div key={item.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eee"}}>
                                    <span style={{fontSize: "14px", color: "#333"}}>{item.name} - <b>₱{item.price.toFixed(2)}</b></span>
                                    <button onClick={() => handleRemoveClick(item)} style={{background: "#FF6B6B", color: "white", border: "none", padding: "6px 20px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: "bold"}}>Remove</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowSaveConfirm(true)} style={{marginTop: "10px", width: "100%", padding: "12px", background: "#538D4E", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", height: "50px"}}>Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- CONFIRM REMOVE --- */}
      {showRemoveConfirm && (
        <div style={modalOverlay}>
            <div style={{...modalContent, width: "350px", textAlign: "center", zIndex: 2200}}>
                <h2 style={{color: "#5a6955", margin: 0}}>Remove Menu Item?</h2>
                <p style={{fontSize: "14px", color: "#666"}}>Are you sure you want to remove this item from the menu? Please review details before proceeding.</p>
                <div style={{display: "flex", justifyContent: "space-between", padding: "0 20px", marginTop: "10px"}}>
                    <button onClick={() => setShowRemoveConfirm(false)} style={{background: "none", border: "none", color: "#FF6B6B", fontWeight: "bold", cursor: "pointer"}}>Cancel</button>
                    <button onClick={confirmRemoveItem} style={{background: "none", border: "none", color: "#5a6955", fontWeight: "bold", cursor: "pointer"}}>Confirm</button>
                </div>
            </div>
        </div>
      )}

      {/* --- CONFIRM SAVE --- */}
      {showSaveConfirm && (
        <div style={modalOverlay}>
            <div style={{...modalContent, width: "350px", textAlign: "center", zIndex: 2200}}>
                <h2 style={{color: "#5a6955", margin: 0}}>Save Changes?</h2>
                <p style={{fontSize: "14px", color: "#666"}}>Are you sure you want to edit this menu? Please review the details before proceeding.</p>
                <div style={{display: "flex", justifyContent: "space-between", padding: "0 20px", marginTop: "10px"}}>
                    <button onClick={() => setShowSaveConfirm(false)} style={{background: "none", border: "none", color: "#FF6B6B", fontWeight: "bold", cursor: "pointer"}}>Cancel</button>
                    <button onClick={handleSaveMenu} style={{background: "none", border: "none", color: "#5a6955", fontWeight: "bold", cursor: "pointer"}}>Confirm</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 1: PROCESS PAYMENT --- */}
      {showPaymentModal && (
        <div style={modalOverlay}>
            <div style={modalContent}>
                <h2 style={{ textAlign: "center", color: "#6B7C65", marginTop: 0, fontSize: "24px" }}>Process Payment</h2>
                <div><label style={{fontWeight: "bold", fontSize: "14px"}}>Name of Customer</label><input style={inputStyle} value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
                <div>
                    <label style={{fontWeight: "bold", fontSize: "14px"}}>Total Amount</label>
                    <div style={{ ...inputStyle, background: "#f0f0f0", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
                        {isDiscounted && <span style={{ textDecoration: "line-through", color: "#ccc", fontSize: "14px" }}>₱{getSubtotal().toFixed(2)}</span>}
                        <span style={{ color: isDiscounted ? "red" : "black", fontSize: "18px" }}>₱{getFinalTotal().toFixed(2)}</span>
                    </div>
                    <div style={{ marginTop: "5px", fontSize: "12px", fontStyle: "italic", display: "flex", alignItems: "center" }}>
                        Apply Discount for Senior Citizen and PWD (20%) <input type="checkbox" checked={isDiscounted} onChange={(e) => setIsDiscounted(e.target.checked)} style={{ marginLeft: "5px", transform: "scale(1.2)" }} />
                    </div>
                </div>
                <div><label style={{fontWeight: "bold", fontSize: "14px"}}>Cash Received</label><input type="number" style={inputStyle} value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="₱0.00" /></div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>Change :</div>
                    {getChange() < 0 ? <div style={{ color: colors.blueText, fontWeight: "bold", fontSize: "18px" }}>Insufficient Amount</div> : <div style={{ color: "black", fontWeight: "bold", fontSize: "18px" }}>₱{getChange().toFixed(2)}</div>}
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button onClick={() => setShowPaymentModal(false)} style={{ flex: 1, padding: "12px", background: colors.redBtn, color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>Cancel Order</button>
                    <button onClick={handleConfirmPayment} disabled={getChange() < 0} style={{ flex: 1, padding: "12px", background: getChange() < 0 ? "#ccc" : colors.darkBtn, color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: getChange() < 0 ? "default" : "pointer" }}>Confirm</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: RECEIPT --- */}
      {showReceiptModal && (
        <div style={modalOverlay}>
            <div style={{...modalContent, width: "400px", textAlign: "center"}}>
                <h2 style={{ color: "#6B7C65", margin: "0 0 10px 0" }}>Transaction Complete!</h2>
                <p style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 20px 0" }}>Transaction ID: {transactionId}</p>
                <hr style={{ width: "100%", border: "1px solid #ccc", marginBottom: "15px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "18px", fontWeight: "bold" }}><span>NAME : {customerName.toUpperCase()}</span><span>₱{getSubtotal().toFixed(2)}</span></div>
                <hr style={{ width: "100%", border: "1px solid #ccc", marginBottom: "15px" }} />
                {isDiscounted && <div style={{ display: "flex", justifyContent: "flex-end", color: colors.discountRed, fontStyle: "italic", fontSize: "14px", marginBottom: "5px" }}>Discount Applied -₱{getDiscountAmount().toFixed(2)}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "18px", marginBottom: "5px" }}><span>Total</span><span>₱{getFinalTotal().toFixed(2)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "5px" }}><span>Cash Paid</span><span>₱{parseFloat(cashReceived).toFixed(2)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "20px" }}><span>Change</span><span>₱{getChange().toFixed(2)}</span></div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button style={{ flex: 1, padding: "12px", background: "#607D8B", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>Print Receipt</button>
                    <button onClick={handleNewOrder} style={{ flex: 1, padding: "12px", background: "#A5A5A5", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>Start New Order</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 3: STATUS CHANGE --- */}
      {showStatusModal && (
        <div style={modalOverlay}>
            <div style={{background: "white", padding: "40px", borderRadius: "25px", width: "320px", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"}}>
                <h3 style={{color:"#5a6955", margin: "0 0 10px 0", fontSize: "22px"}}>Choose Order Status</h3>
                <button onClick={() => updateStatus('COMPLETED')} style={{ width: "220px", padding: "15px", background: colors.statusGreen, color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>COMPLETED</button>
                <button onClick={() => updateStatus('IN PROGRESS')} style={{ width: "220px", padding: "15px", background: colors.statusYellow, color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>IN PROGRESS</button>
                <button onClick={() => updateStatus('NOT IN PROGRESS')} style={{ width: "220px", padding: "15px", background: colors.statusRed, color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>NOT IN PROGRESS</button>
                <button onClick={() => setShowStatusModal(false)} style={{ marginTop: "10px", background: "none", border: "none", color: "#999", cursor: "pointer", textDecoration: "underline" }}>Cancel</button>
            </div>
        </div>
      )}

      {/* --- MODAL 4: CONFIRM COMPLETION --- */}
      {showCompleteConfirm && (
        <div style={modalOverlay}>
            <div style={{background: "white", padding: "40px", borderRadius: "25px", width: "350px", textAlign: "center", display: "flex", flexDirection: "column", gap: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"}}>
                <h2 style={{color:"#5a6955", margin:0, fontSize: "24px", textAlign: "left"}}>Complete Order?</h2>
                <p style={{fontSize:"14px", color:"#666", lineHeight: "1.5", textAlign: "left"}}>Are you sure you want to complete this order? This action cannot be undone.<br/>Please review the details before continuing.</p>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px", gap: "20px" }}>
                    <button onClick={() => setShowCompleteConfirm(false)} style={{ background: "none", border: "none", color: colors.redBtn, fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
                    <button onClick={confirmCompletion} style={{ background: "none", border: "none", color: colors.darkBtn, fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Confirm</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 5: RECENT TRANSACTIONS --- */}
      {showRecentModal && (
        <div style={modalOverlay}>
            <div style={{ background: "white", padding: "20px", borderRadius: "20px", width: "800px", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", height: "70vh" }}>
                <h2 style={{ color: "#5a6955", textAlign: "center", margin: "10px 0 20px 0", fontSize: "28px" }}>Recent Transactions</h2>
                <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "#7E8E77", color: "white", position: "sticky", top: 0 }}>
                            <tr><th style={{ padding: "12px" }}>Name</th><th style={{ padding: "12px" }}>Transaction ID</th><th style={{ padding: "12px" }}>EmployeeID</th><th style={{ padding: "12px" }}>Total Amount</th><th style={{ padding: "12px" }}>Date/Time</th></tr>
                        </thead>
                        <tbody>
                            {completedOrders.length === 0 ? (<tr><td colSpan="5" style={{textAlign:"center", padding:"30px"}}>No completed transactions yet.</td></tr>) : (paginate(completedOrders, recentPage, recentPerPage).map(t => (
                                <tr key={t.id} style={{ borderBottom: "1px solid #ddd", textAlign: "center", height: "50px", fontSize: "14px" }}><td style={{ fontWeight: "bold" }}>{t.customer.toUpperCase()}</td><td>{t.id}</td><td>{t.employeeId}</td><td style={{ fontWeight: "bold" }}>₱{t.total.toFixed(2)}</td><td>{t.date}</td></tr>
                            )))}
                        </tbody>
                    </table>
                </div>
                <div style={{marginTop: "10px"}}><PaginationControls total={completedOrders.length} page={recentPage} setPage={setRecentPage} perPage={recentPerPage} /></div>
                <button onClick={() => setShowRecentModal(false)} style={{ background: "#FF6B6B", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", width: "200px", alignSelf: "center", marginTop: "10px" }}>Close</button>
            </div>
        </div>
      )}

    </div>
  )
}

export default POSSystem