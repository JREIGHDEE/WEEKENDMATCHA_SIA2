import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export function usePOSLogic() {
  const navigate = useNavigate()
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('POS') 
  const [currentUser, setCurrentUser] = useState(null)
  const [menu, setMenu] = useState([]) 
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [selectedIngAmount, setSelectedIngAmount] = useState('') 
  const [inventory, setInventory] = useState([])
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showOptionsModal, setShowOptionsModal] = useState(false) 
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null)
  const [selectedSweetness, setSelectedSweetness] = useState('Balanced') 
  const [customerName, setCustomerName] = useState('')
  const [cashReceived, setCashReceived] = useState('')
  const [isDiscounted, setIsDiscounted] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState(null) 
  const [receiptPrinted, setReceiptPrinted] = useState(false) 
  const [orders, setOrders] = useState([]) 
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [completedOrders, setCompletedOrders] = useState([]) 
  const [showRecentModal, setShowRecentModal] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showManageMenu, setShowManageMenu] = useState(false)
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [isEditing, setIsEditing] = useState(false) 
  const [editItemId, setEditItemId] = useState(null)
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('Flavor') 
  const [newItemFile, setNewItemFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)
  const [newItemRecipe, setNewItemRecipe] = useState([]) 
  const [selectedIngId, setSelectedIngId] = useState('')
  const [notification, setNotification] = useState({ message: '', type: 'success' })
  const [orderPage, setOrderPage] = useState(1); const ordersPerPage = 6
  const [recentPage, setRecentPage] = useState(1); const recentPerPage = 5

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/login'); return }

        const { data: userData } = await supabase.from('Employee').select('EmployeeID, User(FirstName, LastName, RoleName)').eq('UserID', user.id).maybeSingle()
        setCurrentUser(userData)

        fetchMenu()
        fetchInventory() 
        fetchRecentTransactions()
        setLoading(false)
    }
    fetchData()
  }, [navigate])

  async function fetchMenu() {
    const { data, error } = await supabase.from('Product').select('*').order('ProductID', { ascending: true })
    if (error) console.error("Error fetching menu:", error)
    else {
        setMenu(data.map(item => ({ 
            id: item.ProductID, name: item.ProductName, price: item.ProductPrice, img: item.ProductImageURL,
            category: item.Category || 'Flavor', recipe: item.Recipe || [] 
        })))
    }
    setLoadingMenu(false)
  }

  async function fetchInventory() {
    const { data, error } = await supabase.from('Inventory').select('*').eq('Category', 'Ingredients').order('ItemName', { ascending: true })
    if (error) console.error("Inventory Fetch Error:", error)
    else {
        const processedInventory = data.map(item => ({ ...item, isExpired: item.ExpiryDate ? new Date(item.ExpiryDate) < new Date() : false }))
        setInventory(processedInventory)
    }
  }

  const fetchRecentTransactions = async () => {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    const { data, error } = await supabase.from('Order').select('*').eq('Status', 'COMPLETED').gte('OrderDateTime', startOfDay).lte('OrderDateTime', endOfDay).order('OrderDateTime', { ascending: false })
    if (error) console.error("Error fetching recent transactions:", error)
    else {
        const formatted = data.map(t => ({
            id: t.OrderID, customer: t.CustomerName, employeeId: t.EmployeeID, total: t.TotalAmount,
            date: new Date(t.OrderDateTime).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        }))
        setCompletedOrders(formatted)
    }
  }

  // --- LOGIC FUNCTIONS ---
  const handleItemClick = (item) => {
      if (item.category === 'Powder') directAddToCart(item)
      else { setSelectedItemForOptions(item); setSelectedSweetness('Balanced'); setShowOptionsModal(true) }
  }

  const directAddToCart = (item) => addToCartState({ ...item, sweetness: 'N/A', uniqueKey: `${item.id}-Standard` })

  const confirmAddToCart = () => {
      if (!selectedItemForOptions) return
      addToCartState({ ...selectedItemForOptions, sweetness: selectedSweetness, uniqueKey: `${selectedItemForOptions.id}-${selectedSweetness}` })
      setShowOptionsModal(false); setSelectedItemForOptions(null)
  }

  const addToCartState = (cartItem) => {
    setCart(prev => {
        const existing = prev.find(i => i.uniqueKey === cartItem.uniqueKey)
        if (existing) return prev.map(i => i.uniqueKey === cartItem.uniqueKey ? { ...i, qty: i.qty + 1 } : i)
        else return [...prev, { ...cartItem, qty: 1 }]
    })
  }

  const increaseQty = (uniqueKey) => setCart(prev => prev.map(i => i.uniqueKey === uniqueKey ? { ...i, qty: i.qty + 1 } : i))
  const decreaseQty = (uniqueKey) => setCart(prev => prev.map(i => i.uniqueKey === uniqueKey ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0))

  const getSubtotal = () => cart.reduce((total, item) => total + (item.price * item.qty), 0)
  const getDiscountAmount = () => isDiscounted ? getSubtotal() * 0.20 : 0
  const getFinalTotal = () => getSubtotal() - getDiscountAmount()
  const getChange = () => (parseFloat(cashReceived) || 0) - getFinalTotal()

  const handleOpenPayment = () => { if (cart.length > 0) { setCustomerName(''); setCashReceived(''); setIsDiscounted(false); setShowPaymentModal(true) } }
  const handlePrintReceipt = () => { setReceiptPrinted(true); setNotification({ message: "Printing Receipt...", type: 'info' }) }

  const handleCloseReceipt = () => {
    if (!receiptPrinted && !window.confirm("Receipt has not been printed. Close anyway?")) return
    setCart([]); setCustomerName(''); setCashReceived(''); setShowReceiptModal(false)
  }

  const handleConfirmPayment = async () => {
    if (!customerName.trim()) return setNotification({ message: "Customer Name is required!", type: 'error' })
    if (getChange() < 0) return setNotification({ message: "Insufficient Cash!", type: 'error' })

    setLoading(true)
    try {
        const orderData = { EmployeeID: currentUser?.EmployeeID || 1, CustomerName: customerName, OrderDateTime: new Date().toISOString(), Status: 'IN PROGRESS', TotalAmount: getFinalTotal(), AmountGiven: parseFloat(cashReceived), ChangeGiven: getChange(), DiscountAmount: getDiscountAmount() }
        const { data: insertedOrder, error: orderError } = await supabase.from('Order').insert([orderData]).select()
        if (orderError || !insertedOrder || insertedOrder.length === 0) throw new Error("No data returned from Order insert.")

        const newOrderID = insertedOrder[0].OrderID
        setCurrentOrderId(newOrderID)

        const itemsData = cart.map(item => ({ OrderID: newOrderID, ProductID: item.id, Quantity: item.qty, PriceAtTimeOfOrder: item.price }))
        const { error: itemsError } = await supabase.from('OrderItem').insert(itemsData)
        if (itemsError) throw itemsError

        await supabase.from('FinancialRecord').insert([{ EmployeeID: currentUser?.EmployeeID || 1, TransactionDate: new Date().toISOString(), RecordType: 'Income', Amount: getFinalTotal(), Description: `POS Order #${newOrderID} - ${customerName}`, Status: 'Completed' }])

        for (const cartItem of cart) {
            if (cartItem.recipe && Array.isArray(cartItem.recipe)) {
                for (const ingredient of cartItem.recipe) {
                    const totalDeduction = ingredient.amount * cartItem.qty
                    if (totalDeduction > 0) {
                        const { data: currentItem } = await supabase.from('Inventory').select('Quantity, ReorderThreshold, ItemName').eq('InventoryID', ingredient.id).maybeSingle()
                        if (currentItem) {
                            const newQty = currentItem.Quantity - totalDeduction
                            await supabase.from('Inventory').update({ Quantity: newQty }).eq('InventoryID', ingredient.id)
                            if (newQty <= currentItem.ReorderThreshold) setNotification({ message: `LOW STOCK: ${currentItem.ItemName} is now ${newQty}. (Limit: ${currentItem.ReorderThreshold})`, type: 'warning' })
                        }
                    }
                }
            }
        }

        const newLocalOrder = { id: newOrderID, customer: customerName, items: [...cart], status: "IN PROGRESS", total: getFinalTotal(), employeeId: currentUser?.EmployeeID || "EMP", date: new Date().toLocaleString() }
        setOrders(prev => [newLocalOrder, ...prev])
        setShowPaymentModal(false); setReceiptPrinted(false); setShowReceiptModal(true)
    } catch (err) {
        console.error("Payment Process Error:", err)
        setNotification({ message: "Transaction Failed: " + err.message, type: 'error' })
    } finally {
        setLoading(false)
    }
  }

  const handleStatusClick = (order) => { setSelectedOrder(order); setShowStatusModal(true) }
  const updateStatus = async (status) => {
    if (status === 'COMPLETED') { setShowStatusModal(false); setShowCompleteConfirm(true) } 
    else { await supabase.from('Order').update({ Status: status }).eq('OrderID', selectedOrder.id); setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: status } : o)); setShowStatusModal(false) }
  }

  const confirmCompletion = async () => {
      const orderToMove = orders.find(o => o.id === selectedOrder.id)
      if (orderToMove) {
          await supabase.from('Order').update({ Status: 'COMPLETED' }).eq('OrderID', selectedOrder.id)
          setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
          fetchRecentTransactions()
      }
      setShowCompleteConfirm(false)
  }

  const handleAdminLoginSubmit = async () => {
    if (!adminUser || !adminPass) return setNotification({ message: "Enter credentials", type: 'error' })
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email: adminUser, password: adminPass })
    if (error) return setNotification({ message: "Login Failed", type: 'error' })
    const { data } = await supabase.from('User').select('RoleName').eq('UserID', authData.user.id).maybeSingle()
    if (data && ['HR Admin', 'Inventory Admin', 'Sales Admin'].includes(data.RoleName)) {
        setAdminUser(''); setAdminPass(''); setShowAdminLogin(false); setShowManageMenu(true)
    } else { setNotification({ message: "Access Denied", type: 'error' }) }
  }

  const handleImageUpload = (e) => { const file = e.target.files[0]; if(file) { setNewItemFile(file); setPreviewUrl(URL.createObjectURL(file)) } }

  const handleAddIngredientToRecipe = () => {
    if(!selectedIngId || !selectedIngAmount) return 
    const ing = inventory.find(i => i.InventoryID === parseInt(selectedIngId))
    if(ing) {
        setNewItemRecipe([...newItemRecipe, { id: ing.InventoryID, name: ing.ItemName, unit: ing.UnitMeasurement, amount: parseFloat(selectedIngAmount) }])
        setSelectedIngId(''); setSelectedIngAmount('')
    }
  }

  const removeIngredientFromRecipe = (idx) => { const updated = [...newItemRecipe]; updated.splice(idx, 1); setNewItemRecipe(updated) }

  const handleSaveItem = async () => {
      if (!newItemName || !newItemPrice) return setNotification({ message: "Name and Price are required.", type: 'error' })
      setLoading(true)
      let publicUrl = previewUrl
      try {
          if (newItemFile) {
              const fileName = `${Date.now()}.${newItemFile.name.split('.').pop()}`
              const { error: uploadError } = await supabase.storage.from('product').upload(fileName, newItemFile)
              if (uploadError) throw uploadError
              publicUrl = supabase.storage.from('product').getPublicUrl(fileName).data.publicUrl
          }
          const productData = { ProductName: newItemName, ProductPrice: parseFloat(newItemPrice), ProductImageURL: publicUrl, Category: newItemCategory, Recipe: newItemRecipe }
          if (isEditing) {
               const { error } = await supabase.from('Product').update(productData).eq('ProductID', editItemId)
               if(error) throw error; alert("Item Updated Successfully!")
          } else {
               const { error } = await supabase.from('Product').insert([productData])
               if(error) throw error; setNotification({ message: "Item Added Successfully!", type: 'success' })
          }
          resetForm(); fetchMenu() 
      } catch (error) { setNotification({ message: "Error saving item: " + error.message, type: 'error' }) } 
      finally { setLoading(false) }
  }

  const handleEditPrep = (item) => {
      setIsEditing(true); setEditItemId(item.id); setNewItemName(item.name); setNewItemPrice(item.price); setNewItemCategory(item.category); setNewItemRecipe(item.recipe || []); setPreviewUrl(item.img); setNewItemFile(null)
  }

  const resetForm = () => {
      setIsEditing(false); setEditItemId(null); setNewItemName(''); setNewItemPrice(''); setNewItemCategory('Flavor'); setNewItemRecipe([]); setNewItemFile(null); setPreviewUrl(null); if(fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDeleteItem = async (id) => {
      if (!window.confirm("Delete this item?")) return
      setLoading(true); await supabase.from('Product').delete().eq('ProductID', id); setNotification({ message: "Deleted", type: 'success' }); fetchMenu(); setLoading(false)
  }

  // --- STYLES & UI CONSTANTS (Kept here to pass down cleanly) ---
  const colors = { green: "#6B7C65", beige: "#E8DCC6", white: "#ffffff", darkBtn: "#5a6955", redBtn: "#FF6B6B", statusRed: "#FF6B6B", statusYellow: "#E5C546", statusGreen: "#538D4E", blueText: "#337AB7", discountRed: "#D9534F" }
  const uiStyles = {
      modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 },
      modalContent: { background: "white", padding: "30px", borderRadius: "20px", width: "450px", display: "flex", flexDirection: "column", gap: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" },
      inputStyle: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", fontSize: "16px", boxSizing: "border-box", fontWeight: "bold" },
      sidebarItem: (active) => ({ padding: "12px 20px", background: active ? "rgba(255,255,255,0.2)" : "transparent", fontWeight: active ? "bold" : "normal", borderLeft: active ? "5px solid #E8DCC6" : "5px solid transparent", cursor: "pointer" })
  }
  const paginate = (items, page, perPage) => items.slice((page - 1) * perPage, (page - 1) * perPage + perPage)

  return {
      state: { activeTab, currentUser, menu, loadingMenu, selectedIngAmount, inventory, cart, searchQuery, loading, showPaymentModal, showReceiptModal, showOptionsModal, selectedItemForOptions, selectedSweetness, customerName, cashReceived, isDiscounted, currentOrderId, receiptPrinted, orders, selectedOrder, showStatusModal, showCompleteConfirm, completedOrders, showRecentModal, showAdminLogin, showManageMenu, adminUser, adminPass, isEditing, editItemId, newItemName, newItemPrice, newItemCategory, newItemFile, previewUrl, fileInputRef, newItemRecipe, selectedIngId, notification, orderPage, recentPage, ordersPerPage, recentPerPage },
      actions: { setActiveTab, handleItemClick, confirmAddToCart, increaseQty, decreaseQty, getSubtotal, getDiscountAmount, getFinalTotal, getChange, handleOpenPayment, handlePrintReceipt, handleCloseReceipt, handleConfirmPayment, handleStatusClick, updateStatus, confirmCompletion, fetchRecentTransactions, handleAdminLoginSubmit, handleImageUpload, handleAddIngredientToRecipe, removeIngredientFromRecipe, handleSaveItem, handleEditPrep, resetForm, handleDeleteItem, setSearchQuery, setOrderPage, setRecentPage, setCustomerName, setCashReceived, setIsDiscounted, setSelectedSweetness, setSelectedIngAmount, setSelectedIngId, setNewItemCategory, setNewItemName, setNewItemPrice, setShowOptionsModal, setShowPaymentModal, setShowAdminLogin, setShowManageMenu, setShowRecentModal, setAdminUser, setAdminPass, setNotification },
      ui: { colors, uiStyles, paginate },
      navigate
  }
}