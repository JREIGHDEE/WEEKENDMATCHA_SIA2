import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/wm-logo.svg' 

function POSSystem() {
  const navigate = useNavigate()
  
  // --- USER & MENU STATE ---
  const [activeTab, setActiveTab] = useState('POS') 
  const [currentUser, setCurrentUser] = useState(null)
  const [menu, setMenu] = useState([]) 
  const [loadingMenu, setLoadingMenu] = useState(true)

  // --- CART & ORDER STATE ---
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // --- MODALS ---
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showOptionsModal, setShowOptionsModal] = useState(false) 
  
  // --- SELECTION STATE ---
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null)
  const [selectedSweetness, setSelectedSweetness] = useState('Balanced') 

  // --- PAYMENT FORM ---
  const [customerName, setCustomerName] = useState('')
  const [cashReceived, setCashReceived] = useState('')
  const [isDiscounted, setIsDiscounted] = useState(false)
  
  // --- RECEIPT LOGIC ---
  const [currentOrderId, setCurrentOrderId] = useState(null) 
  const [receiptPrinted, setReceiptPrinted] = useState(false) 

  // --- ORDER MANAGEMENT ---
  const [orders, setOrders] = useState([]) 
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [completedOrders, setCompletedOrders] = useState([]) 
  const [showRecentModal, setShowRecentModal] = useState(false)

  // --- MANAGE MENU (Admin) ---
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showManageMenu, setShowManageMenu] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [menuItemToRemove, setMenuItemToRemove] = useState(null)
  
  // New Item
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemFile, setNewItemFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)
  
  // Recipe Builder (Optional/Visual for now)
  const [newItemIngredients, setNewItemIngredients] = useState([])
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [showIngDropdown, setShowIngDropdown] = useState(false)

  // Inventory & Pagination
  const inventoryItems = [
    { id: 1, name: 'Matcha Powder', unit: 'g' },
    { id: 2, name: 'Fresh Milk', unit: 'ml' },
    { id: 3, name: 'Vanilla Syrup', unit: 'ml' },
    { id: 4, name: 'Ice Cubes', unit: 'pcs' },
    { id: 5, name: 'Water', unit: 'ml' },
    { id: 6, name: 'Brown Sugar', unit: 'g' },
    { id: 7, name: 'Tapioca Pearls', unit: 'g' }
  ]
  const [orderPage, setOrderPage] = useState(1); const ordersPerPage = 6
  const [recentPage, setRecentPage] = useState(1); const recentPerPage = 5
  const [ingredientPage, setIngredientPage] = useState(1); const ingredientsPerPage = 3

  
  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        const { data: userData } = await supabase.from('Employee').select('EmployeeID, User(FirstName, LastName, RoleName)').eq('UserID', user.id).maybeSingle()
        setCurrentUser(userData)

        // Load Menu
        fetchMenu()
        
        // Load Recent Transactions
        fetchRecentTransactions()

        setLoading(false)
    }
    fetchData()
  }, [])

  // --- HELPER: FETCH MENU ---
  async function fetchMenu() {
    const { data, error } = await supabase.from('Product').select('*').order('ProductID', { ascending: true })
    if (error) console.error("Error fetching menu:", error)
    else {
        setMenu(data.map(item => ({ 
            id: item.ProductID, 
            name: item.ProductName, 
            price: item.ProductPrice, 
            img: item.ProductImageURL 
        })))
    }
    setLoadingMenu(false)
  }

  // --- HELPER: FETCH RECENT TRANSACTIONS (TODAY ONLY) ---
  const fetchRecentTransactions = async () => {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    const { data, error } = await supabase
        .from('Order')
        .select('*')
        .eq('Status', 'COMPLETED')
        .gte('OrderDateTime', startOfDay)
        .lte('OrderDateTime', endOfDay)
        .order('OrderDateTime', { ascending: false })

    if (error) {
        console.error("Error fetching recent transactions:", error)
    } else {
        const formatted = data.map(t => ({
            id: t.OrderID,
            customer: t.CustomerName,
            employeeId: t.EmployeeID,
            total: t.TotalAmount,
            date: new Date(t.OrderDateTime).toLocaleString('en-US', { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit' 
            })
        }))
        setCompletedOrders(formatted)
    }
  }

  // --- 1. OPEN OPTIONS MODAL ---
  const handleItemClick = (item) => {
      setSelectedItemForOptions(item)
      setSelectedSweetness('Balanced') 
      setShowOptionsModal(true)
  }

  // --- 2. ADD TO CART WITH SWEETNESS ---
  const confirmAddToCart = () => {
      if (!selectedItemForOptions) return

      const cartItem = {
          ...selectedItemForOptions,
          sweetness: selectedSweetness,
          uniqueKey: `${selectedItemForOptions.id}-${selectedSweetness}` 
      }

      setCart(prev => {
          const existing = prev.find(i => i.uniqueKey === cartItem.uniqueKey)
          if (existing) {
              return prev.map(i => i.uniqueKey === cartItem.uniqueKey ? { ...i, qty: i.qty + 1 } : i)
          } else {
              return [...prev, { ...cartItem, qty: 1 }]
          }
      })

      setShowOptionsModal(false)
      setSelectedItemForOptions(null)
  }

  // --- CART HELPERS ---
  const increaseQty = (uniqueKey) => {
      setCart(prev => prev.map(i => i.uniqueKey === uniqueKey ? { ...i, qty: i.qty + 1 } : i))
  }

  const decreaseQty = (uniqueKey) => {
      setCart(prev => prev.map(i => i.uniqueKey === uniqueKey ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0))
  }

  const getSubtotal = () => cart.reduce((total, item) => total + (item.price * item.qty), 0)
  const getDiscountAmount = () => isDiscounted ? getSubtotal() * 0.20 : 0
  const getFinalTotal = () => getSubtotal() - getDiscountAmount()
  const getChange = () => (parseFloat(cashReceived) || 0) - getFinalTotal()

  // --- PAYMENT ---
  const handleOpenPayment = () => { if (cart.length > 0) { setCustomerName(''); setCashReceived(''); setIsDiscounted(false); setShowPaymentModal(true) } }

  const handleConfirmPayment = async () => {
    if (!customerName.trim()) { alert("⚠️ Customer Name is required!"); return }
    if (getChange() < 0) return 
    setLoading(true)

    const orderData = {
        EmployeeID: currentUser?.EmployeeID || 1, 
        CustomerName: customerName,
        OrderDateTime: new Date().toISOString(),
        Status: 'IN PROGRESS',
        TotalAmount: getFinalTotal(),
        AmountGiven: parseFloat(cashReceived),
        ChangeGiven: getChange(),
        DiscountAmount: getDiscountAmount()
    }

    const { data: insertedOrder, error: orderError } = await supabase.from('Order').insert([orderData]).select() 
    if (orderError) { alert("Transaction Failed: " + orderError.message); setLoading(false); return }

    const newOrderID = insertedOrder[0].OrderID
    setCurrentOrderId(newOrderID)

    // Save Items
    const itemsData = cart.map(item => ({
        OrderID: newOrderID,
        ProductID: item.id, 
        Quantity: item.qty,
        PriceAtTimeOfOrder: item.price
    }))

    const { error: itemsError } = await supabase.from('OrderItem').insert(itemsData)
    if (itemsError) alert("Warning: Items save failed: " + itemsError.message)

    // Save to Financial Record
    await supabase.from('FinancialRecord').insert([{
        EmployeeID: currentUser?.EmployeeID || 1,
        TransactionDate: new Date().toISOString(),
        RecordType: 'Income',
        Amount: getFinalTotal(),
        Description: `POS Order #${newOrderID} - ${customerName}`,
        Status: 'Completed'
    }])
    
    // Update Local View
    const newLocalOrder = {
        id: newOrderID,
        customer: customerName,
        items: [...cart], 
        status: "IN PROGRESS",
        total: getFinalTotal(),
        employeeId: currentUser?.EmployeeID || "EMP", 
        date: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' }),
    }
    setOrders(prev => [newLocalOrder, ...prev])

    setLoading(false)
    setShowPaymentModal(false)
    setReceiptPrinted(false) 
    setShowReceiptModal(true) 
  }

  const handlePrintReceipt = () => { setReceiptPrinted(true); alert("🖨️ Printing Receipt...") }
  const handleCloseReceipt = () => {
    if (!receiptPrinted) { if(!confirm("Receipt has not been printed. Close anyway?")) return; }
    setCart([])
    setShowReceiptModal(false)
  }

  // --- OTHER HANDLERS ---
  const handleStatusClick = (order) => { setSelectedOrder(order); setShowStatusModal(true) }
  const updateStatus = (status) => {
    if (status === 'COMPLETED') { setShowStatusModal(false); setShowCompleteConfirm(true) } 
    else { setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: status } : o)); setShowStatusModal(false) }
  }
  const confirmCompletion = async () => {
      const orderToMove = orders.find(o => o.id === selectedOrder.id)
      if (orderToMove) {
          await supabase.from('Order').update({ Status: 'COMPLETED' }).eq('OrderID', selectedOrder.id)
          setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
          fetchRecentTransactions() // Refresh Recent List
      }
      setShowCompleteConfirm(false)
  }

  // --- MANAGE MENU: ADMIN CHECK ---
  const handleAdminLoginSubmit = async () => {
    if (!adminUser || !adminPass) return alert("Enter credentials")
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email: adminUser, password: adminPass })
    if (error) { alert("Login Failed"); return }
    const { data } = await supabase.from('User').select('RoleName').eq('UserID', authData.user.id).maybeSingle()
    if (data && ['HR Admin', 'Inventory Admin', 'Sales Admin'].includes(data.RoleName)) {
        setAdminUser(''); setAdminPass(''); setShowAdminLogin(false); setShowManageMenu(true)
    } else alert("Access Denied")
  }

  // --- MANAGE MENU: ADD ITEM & UPLOAD ---
  const handleImageUpload = (e) => { 
      const file = e.target.files[0]; 
      if(file) { 
          setNewItemFile(file); 
          setPreviewUrl(URL.createObjectURL(file)) 
      } 
  }

  const handleAddItem = async () => {
      if (!newItemName || !newItemPrice) return alert("Name and Price are required.")
      setLoading(true)
      
      let publicUrl = null

      try {
          // 1. Upload Image to Storage (If selected)
          if (newItemFile) {
              const fileExt = newItemFile.name.split('.').pop()
              const fileName = `${Date.now()}.${fileExt}`
              
              const { error: uploadError } = await supabase.storage
                  .from('products') // Make sure this bucket exists and is public!
                  .upload(fileName, newItemFile)

              if (uploadError) throw uploadError

              const { data: urlData } = supabase.storage
                  .from('products')
                  .getPublicUrl(fileName)
              
              publicUrl = urlData.publicUrl
          }

          // 2. Save to Database
          const { error: insertError } = await supabase
              .from('Product')
              .insert([{ 
                  ProductName: newItemName, 
                  ProductPrice: parseFloat(newItemPrice), 
                  ProductImageURL: publicUrl,
                  ProductDescription: "Added via POS" // Optional
              }])

          if (insertError) throw insertError

          alert("Item Added Successfully!")
          
          // 3. Reset & Refresh
          setNewItemName(''); setNewItemPrice(''); setNewItemFile(null); setPreviewUrl(null); 
          if(fileInputRef.current) fileInputRef.current.value = ""
          
          fetchMenu() // Refresh the grid immediately

      } catch (error) {
          alert("Error adding item: " + error.message)
      } finally {
          setLoading(false)
      }
  }

  // --- MANAGE MENU: DELETE ITEM & IMAGE ---
  const handleDeleteItem = async (id) => {
      if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return

      setLoading(true)

      try {
          // 1. Get the Product Image URL first
          const { data: productData, error: fetchError } = await supabase
              .from('Product')
              .select('ProductImageURL')
              .eq('ProductID', id)
              .single()
          
          if (fetchError) throw fetchError

          // 2. Delete the Image from Storage (if it exists)
          if (productData?.ProductImageURL) {
              const fileName = productData.ProductImageURL.split('/').pop()
              const { error: storageError } = await supabase.storage
                  .from('products')
                  .remove([fileName])

              if (storageError) console.error("Error deleting image:", storageError)
          }

          // 3. Delete the Record from the Database
          const { error: deleteError } = await supabase
              .from('Product')
              .delete()
              .eq('ProductID', id)

          if (deleteError) throw deleteError

          alert("Item and Image deleted successfully!")
          fetchMenu() // Refresh UI

      } catch (error) {
          alert("Error deleting item: " + error.message)
      } finally {
          setLoading(false)
      }
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

  if (loading) return <div style={{height: "100vh", background: colors.green, display:"flex", justifyContent:"center", alignItems:"center", color:"white"}}>Loading POS...</div>

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif", background: colors.beige }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", flexShrink: 0, background: colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="WeekendMatcha Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
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
                {/* MENU GRID */}
                <div style={{ flex: 2, background: colors.white, borderRadius: "20px", padding: "25px", display: "flex", flexDirection: "column", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "25px" }}>
                        <input placeholder="Search" style={{ background: "#EAEAEA", border: "none", padding: "10px 20px", borderRadius: "30px", width: "50%", outline: "none" }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <button onClick={() => setShowAdminLogin(true)} style={{ background: "#5a6955", color: "white", border: "none", padding: "10px 25px", borderRadius: "30px", fontWeight: "bold", cursor: "pointer", fontSize: "12px", letterSpacing: "1px" }}>MANAGE MENU</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", overflowY: "auto", paddingRight: "5px" }}>
                        {menu.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                            <div key={item.id} onClick={() => handleItemClick(item)} style={{ border: "2px solid #333", borderRadius: "10px", padding: "15px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", transition: "0.2s", background: "white" }}>
                                <div style={{ width: "100px", height: "100px", marginBottom: "15px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {item.img ? <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: "50px" }}>🍵</span>}
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
                        {cart.length === 0 ? <div style={{ textAlign: "center", color: "#999", marginTop: "100px", fontSize: "14px" }}>No items in order.</div> : cart.map(item => (
                            <div key={item.uniqueKey} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                                <div style={{width: "40%"}}>
                                    <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>{item.name}</div>
                                    <div style={{ fontSize: "11px", color: colors.blueText, fontWeight: "bold" }}>{item.sweetness}</div>
                                    <div style={{ fontSize: "11px", color: "#999" }}>{item.qty} x ₱{item.price}</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><button onClick={() => decreaseQty(item.uniqueKey)} style={{ width: "25px", height: "25px", borderRadius: "50%", border: "1px solid #333", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button><span style={{ fontWeight: "bold", fontSize: "14px" }}>{item.qty}</span><button onClick={() => increaseQty(item.uniqueKey)} style={{ width: "25px", height: "25px", borderRadius: "50%", border: "1px solid #333", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button></div>
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

        {/* --- VIEW: CURRENT ORDERS LIST --- */}
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
                                    <td style={{ padding: "10px 15px", color: "#333", fontSize: "13px", lineHeight: "1.6" }}>
                                        {order.items.map((item, idx) => (
                                            <div key={idx}><span style={{ fontWeight: "bold" }}>{item.name}</span> ({item.sweetness}) <span style={{ fontWeight: "bold" }}>x{item.qty}</span></div>
                                        ))}
                                    </td>
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

      {/* --- NEW MODAL: SWEETNESS SELECTION --- */}
      {showOptionsModal && selectedItemForOptions && (
        <div style={modalOverlay}>
            <div style={{background: "white", padding: "40px", borderRadius: "20px", width: "350px", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px"}}>
                <h2 style={{color: "#5a6955", margin: 0}}>Select Sweetness</h2>
                <div style={{fontSize: "18px", fontWeight: "bold"}}>{selectedItemForOptions.name}</div>
                <select 
                    style={{padding: "15px", fontSize: "16px", borderRadius: "10px", border: "1px solid #ccc", outline: "none"}}
                    value={selectedSweetness}
                    onChange={(e) => setSelectedSweetness(e.target.value)}
                >
                    <option value="Balanced">Balanced</option>
                    <option value="Sweet">Sweet</option>
                    <option value="Umami">Umami</option>
                </select>
                <div style={{display: "flex", gap: "10px"}}>
                    <button onClick={() => setShowOptionsModal(false)} style={{flex: 1, padding: "12px", background: "#ccc", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer"}}>Cancel</button>
                    <button onClick={confirmAddToCart} style={{flex: 1, padding: "12px", background: "#5a6955", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer"}}>Add to Cart</button>
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
            <div style={{background: "white", padding: "40px", borderRadius: "20px", width: "350px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.4)"}}>
                <h3 style={{margin: "0 0 5px 0", fontSize: "18px", fontWeight: "bold"}}>WeekendMatcha</h3>
                <p style={{fontSize: "12px", color: "#666", margin: "0 0 15px 0"}}>Emerald St., Marfori Heights Subd., Davao City<br/>{new Date().toLocaleString()}</p>
                <hr style={{borderTop: "1px solid #333", borderBottom: "none", margin: "10px 0"}} />
                <div style={{textAlign: "right", fontSize: "12px", color: "#555", marginBottom: "5px"}}>Cashier: {currentUser?.User?.FirstName}</div>
                <div style={{textAlign: "right", fontSize: "12px", color: "#555", marginBottom: "5px"}}>Customer: {customerName}</div>
                <div style={{textAlign: "right", fontSize: "12px", color: "#555", marginBottom: "15px"}}>Order ID: {currentOrderId}</div>
                <hr style={{borderTop: "1px solid #333", borderBottom: "none", margin: "10px 0"}} />
                <div style={{textAlign: "left", marginBottom: "15px"}}>
                    <div style={{display:"flex", justifyContent:"space-between", fontWeight:"bold", fontSize:"12px", marginBottom:"5px"}}><span>Item</span><span>Price</span></div>
                    {cart.map((item, i) => (
                        <div key={i} style={{marginBottom:"5px"}}>
                            <div style={{display:"flex", justifyContent:"space-between", fontSize:"12px"}}>
                                <span>{item.qty}x {item.name}</span>
                                <span>₱{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                            <div style={{fontSize:"10px", color:"#666", fontStyle:"italic", paddingLeft: "10px"}}>- {item.sweetness}</div>
                        </div>
                    ))}
                </div>
                <hr style={{borderTop: "1px solid #333", borderBottom: "none", margin: "10px 0"}} />
                {isDiscounted && <div style={{display:"flex", justifyContent:"space-between", fontSize:"12px", color: colors.discountRed, fontStyle:"italic", marginBottom:"5px"}}><span>Discount Applied</span><span>-₱{getDiscountAmount().toFixed(2)}</span></div>}
                <div style={{display:"flex", justifyContent:"space-between", fontWeight:"bold", fontSize:"16px", marginBottom:"5px"}}><span>Total:</span><span>₱{getFinalTotal().toFixed(2)}</span></div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"2px"}}><span>Cash Paid:</span><span>₱{parseFloat(cashReceived).toFixed(2)}</span></div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"20px"}}><span>Change:</span><span>₱{getChange().toFixed(2)}</span></div>
                <p style={{fontSize: "12px", color: "#666", marginTop: "10px", fontStyle:"italic"}}>Thank you for your purchase!</p>
                <div style={{ marginTop: "20px" }}>
                    {!receiptPrinted ? (
                        <button onClick={handlePrintReceipt} style={{ width: "100%", padding: "12px", background: "#FF6B6B", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", marginBottom: "10px" }}>Print Receipt</button>
                    ) : (
                        <button onClick={handleCloseReceipt} style={{ width: "100%", padding: "12px", background: "#538D4E", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>Close & Start New Order</button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- OTHER MODALS (Status, Admin, etc) --- */}
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

      {showManageMenu && (
        <div style={modalOverlay}>
            <div style={{background: "white", padding: "30px", borderRadius: "20px", width: "900px", height: "700px", display: "flex", flexDirection: "column", boxShadow: "0 10px 40px rgba(0,0,0,0.2)"}}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
                    <h1 style={{color: "#5a6955", margin: 0, fontSize: "28px"}}>Manage Menu</h1>
                    <button onClick={() => setShowManageMenu(false)} style={{background: "transparent", border: "none", fontSize: "20px", fontWeight: "bold", cursor: "pointer", color: "#999"}}>✕</button>
                </div>
                <div style={{display: "flex", gap: "40px", flex: 1, overflow: "hidden"}}>
                    <div style={{flex: 1, display: "flex", flexDirection: "column", gap: "10px", height: "100%"}}>
                        <h3 style={{margin: "0 0 5px", color: "#333", fontSize: "16px"}}>Add New Item</h3>
                        <div><label style={{fontWeight: "bold", fontSize: "13px", color: "#555"}}>Product Name</label><input style={{...inputStyle, padding: "8px", fontWeight: "normal"}} value={newItemName} onChange={e => setNewItemName(e.target.value)} /></div>
                        <div><label style={{fontWeight: "bold", fontSize: "13px", color: "#555"}}>Product Price</label><input type="number" style={{...inputStyle, padding: "8px", fontWeight: "normal"}} value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} /></div>
                        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", margin: "5px 0"}}>
                            <div style={{width: "100px", height: "100px", border: "1px solid #333", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", fontSize: "12px", background: "#f9f9f9", overflow:"hidden"}}>
                                {previewUrl ? <img src={previewUrl} style={{width:"100%", height:"100%", objectFit:"cover"}} /> : "No Image\nSelected"}
                            </div>
                            <input type="file" accept="image/*" ref={fileInputRef} style={{display:"none"}} onChange={handleImageUpload} />
                            <button onClick={() => fileInputRef.current.click()} style={{width: "100%", padding: "8px", border: "1px solid #333", background: "#f0f0f0", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold"}}>Upload Image</button>
                        </div>
                        <button onClick={handleAddItem} style={{marginTop: "10px", width: "100%", padding: "12px", background: "#607D8B", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", height: "50px"}}>ADD ITEM</button>
                    </div>
                    <div style={{flex: 1, borderLeft: "1px solid #ccc", paddingLeft: "40px", display: "flex", flexDirection: "column", height: "100%"}}>
                        <h3 style={{margin: "0 0 20px", color: "#333"}}>Current Menu Items</h3>
                        <div style={{flex: 1, overflowY: "auto", paddingRight: "10px"}}>
                            {menu.map(item => (
                                <div key={item.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eee"}}>
                                    <span style={{fontSize: "14px", color: "#333"}}>{item.name} - <b>₱{item.price.toFixed(2)}</b></span>
                                    <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        style={{
                                            background: "#FF6B6B", 
                                            color: "white", 
                                            border: "none", 
                                            borderRadius: "50%", 
                                            width: "24px", 
                                            height: "24px", 
                                            cursor: "pointer", 
                                            display: "flex", 
                                            alignItems: "center", 
                                            justifyContent: "center",
                                            fontWeight: "bold",
                                            fontSize: "18px",
                                            lineHeight: "0"
                                        }}
                                        title="Delete Item"
                                    >
                                        -
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

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
                {/* NEW: Today's Total Footer */}
                <div style={{ marginTop: "15px", textAlign: "right", color: "#32323278", fontSize: "16px" }}>
                    Today's Total: <span style={{ fontWeight: "bold" }}>₱{completedOrders.reduce((sum, order) => sum + order.total, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
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