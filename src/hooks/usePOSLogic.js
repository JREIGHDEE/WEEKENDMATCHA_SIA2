import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export function usePOSLogic() {
  const navigate = useNavigate()
  
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
  
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [customPaymentMethod, setCustomPaymentMethod] = useState('')

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

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: userData } = await supabase
        .from('Employee')
        .select('EmployeeID, User(FirstName, LastName, RoleName)')
        .eq('UserID', user.id)
        .maybeSingle()

      setCurrentUser(userData)

      await fetchInventory()
      await fetchMenu()
      await fetchCurrentOrders()
      await fetchRecentTransactions()
      setLoading(false)
    }
    fetchData()
  }, [navigate])

  async function fetchMenu() {
    setLoadingMenu(true)

    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select('*')
      .order('ProductID', { ascending: true })

    if (productError) {
      console.error('Error fetching menu:', productError)
      setLoadingMenu(false)
      return
    }

    const { data: recipeData, error: recipeError } = await supabase
      .from('Recipe')
      .select(`
        RecipeID,
        ProductID,
        InventoryID,
        QuantityUsed,
        Inventory:InventoryID (
          InventoryID,
          ItemName,
          UnitMeasurement
        )
      `)

    if (recipeError) {
      console.error('Error fetching recipes:', recipeError)
      setLoadingMenu(false)
      return
    }

    const recipeMap = {}

    ;(recipeData || []).forEach(row => {
      if (!recipeMap[row.ProductID]) {
        recipeMap[row.ProductID] = []
      }

      recipeMap[row.ProductID].push({
        id: row.InventoryID,
        name: row.Inventory?.ItemName || 'Unknown Ingredient',
        unit: row.Inventory?.UnitMeasurement || '',
        amount: parseFloat(row.QuantityUsed) || 0
      })
    })

    const formattedMenu = (productData || []).map(item => ({
      id: item.ProductID,
      name: item.ProductName,
      price: item.ProductPrice,
      img: item.ProductImageURL,
      category: item.Category || 'Flavor',
      recipe: recipeMap[item.ProductID] || []
    }))

    setMenu(formattedMenu)
    setLoadingMenu(false)
  }

  async function fetchInventory() {
    const { data, error } = await supabase
      .from('Inventory')
      .select('*')
      .eq('Category', 'Ingredients')
      .eq('IsArchived', false)
      .order('ItemName', { ascending: true })

    if (error) {
      console.error('Inventory Fetch Error:', error)
    } else {
      const processedInventory = (data || []).map(item => ({
        ...item,
        isExpired: item.Expiry ? new Date(item.Expiry) < new Date() : false
      }))
      setInventory(processedInventory)
    }
  }

  const fetchRecentTransactions = async () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString()

    const { data, error } = await supabase
      .from('Order')
      .select('*')
      .eq('Status', 'COMPLETED')
      .gte('OrderDateTime', startOfDay)
      .lte('OrderDateTime', endOfDay)
      .order('OrderDateTime', { ascending: false })

    if (error) console.error('Error fetching recent transactions:', error)
    else {
      const formatted = data.map(t => ({
        id: t.OrderID,
        customer: t.CustomerName,
        employeeId: t.EmployeeID,
        total: t.TotalAmount,
        paymentMethod: t.PaymentMethod || 'Cash',
        date: new Date(t.OrderDateTime).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }))
      setCompletedOrders(formatted)
    }
  }

  const fetchCurrentOrders = async () => {
    const { data, error } = await supabase
      .from('Order')
      .select('*')
      .neq('Status', 'COMPLETED')
      .order('OrderDateTime', { ascending: false })

    if (error) {
      console.error('Error fetching current orders:', error)
      return
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from('OrderItem')
      .select('*')

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return
    }

    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('ProductID, ProductName')

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return
    }

    const productMap = {}
    products.forEach(p => {
      productMap[p.ProductID] = p.ProductName
    })

    const formatted = data.map(order => {
      const items = orderItems
        .filter(oi => oi.OrderID === order.OrderID)
        .map(oi => ({
          name: productMap[oi.ProductID] || `Product ${oi.ProductID}`,
          qty: oi.Quantity,
          price: oi.PriceAtTimeOfOrder,
          sweetness: 'N/A'
        }))

      return {
        id: order.OrderID,
        customer: order.CustomerName,
        items,
        status: order.Status,
        total: order.TotalAmount,
        employeeId: order.EmployeeID,
        date: new Date(order.OrderDateTime).toLocaleString()
      }
    })

    setOrders(formatted)
  }

  const canAddToCart = (cartItem, qtyToAdd = 1) => {
    if (!cartItem.recipe || !Array.isArray(cartItem.recipe) || cartItem.recipe.length === 0) {
      return true
    }

    const existingCartItem = cart.find(i => i.uniqueKey === cartItem.uniqueKey)
    const currentQtyInCart = existingCartItem ? existingCartItem.qty : 0
    const totalQtyAfterAdd = currentQtyInCart + qtyToAdd

    for (const ingredient of cartItem.recipe) {
      const stockItem = inventory.find(inv => inv.InventoryID === parseInt(ingredient.id))
      const totalNeeded = ingredient.amount * totalQtyAfterAdd

      if (!stockItem || stockItem.Quantity < totalNeeded) {
        setNotification({
          message: `${ingredient.name} is not enough in inventory.`,
          type: 'error'
        })
        return false
      }
    }

    return true
  }

  const handleItemClick = (item) => {
    if (item.category === 'Powder') {
      directAddToCart(item)
    } else {
      setSelectedItemForOptions(item)
      setSelectedSweetness('Balanced')
      setShowOptionsModal(true)
    }
  }

  const directAddToCart = (item) => {
    const cartItem = {
      ...item,
      sweetness: 'N/A',
      uniqueKey: `${item.id}-Standard`
    }

    if (!canAddToCart(cartItem)) return
    addToCartState(cartItem)
  }

  const confirmAddToCart = () => {
    if (!selectedItemForOptions) return

    const cartItem = {
      ...selectedItemForOptions,
      sweetness: selectedSweetness,
      uniqueKey: `${selectedItemForOptions.id}-${selectedSweetness}`
    }

    if (!canAddToCart(cartItem)) return

    addToCartState(cartItem)
    setShowOptionsModal(false)
    setSelectedItemForOptions(null)
  }

  const addToCartState = (cartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.uniqueKey === cartItem.uniqueKey)
      if (existing) {
        return prev.map(i =>
          i.uniqueKey === cartItem.uniqueKey
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      }
      return [...prev, { ...cartItem, qty: 1 }]
    })
  }

  const increaseQty = (uniqueKey) => {
    const item = cart.find(i => i.uniqueKey === uniqueKey)
    if (!item) return

    if (!canAddToCart(item)) return

    setCart(prev =>
      prev.map(i =>
        i.uniqueKey === uniqueKey
          ? { ...i, qty: i.qty + 1 }
          : i
      )
    )
  }

  const decreaseQty = (uniqueKey) =>
    setCart(prev =>
      prev
        .map(i =>
          i.uniqueKey === uniqueKey
            ? { ...i, qty: i.qty - 1 }
            : i
        )
        .filter(i => i.qty > 0)
    )

  const getSubtotal = () => cart.reduce((total, item) => total + (item.price * item.qty), 0)
  const getDiscountAmount = () => isDiscounted ? getSubtotal() * 0.20 : 0
  const getFinalTotal = () => getSubtotal() - getDiscountAmount()
  const getChange = () => (parseFloat(cashReceived) || 0) - getFinalTotal()

  const handleOpenPayment = () => {
    if (cart.length > 0) {
      setCustomerName('')
      setCashReceived('')
      setIsDiscounted(false)
      setPaymentMethod('Cash')
      setReferenceNumber('')
      setCustomPaymentMethod('')
      setShowPaymentModal(true)
    }
  }

  const handlePrintReceipt = () => {
    setReceiptPrinted(true)
    setNotification({ message: 'Printing Receipt...', type: 'info' })
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleCloseReceipt = () => {
    if (!receiptPrinted && !window.confirm('Receipt has not been printed. Close anyway?')) return
    setCart([])
    setCustomerName('')
    setCashReceived('')
    setPaymentMethod('Cash')
    setReferenceNumber('')
    setCustomPaymentMethod('')
    setShowReceiptModal(false)
  }

  const handleConfirmPayment = async () => {
    if (!customerName.trim()) {
      return setNotification({ message: 'Customer Name is required!', type: 'error' })
    }

    let finalMethod = paymentMethod
    if (paymentMethod === 'Others') {
      if (!customPaymentMethod.trim()) {
        return setNotification({ message: 'Please specify the custom payment method.', type: 'error' })
      }
      finalMethod = customPaymentMethod
    }

    if (paymentMethod !== 'Cash' && !referenceNumber.trim()) {
      return setNotification({ message: 'Reference Number is required for digital payments.', type: 'error' })
    }

    let amountGiven = 0
    let changeGiven = 0

    if (paymentMethod === 'Cash') {
      if (getChange() < 0) {
        return setNotification({ message: 'Insufficient Cash!', type: 'error' })
      }
      amountGiven = parseFloat(cashReceived) || 0
      changeGiven = getChange()
    } else {
      amountGiven = getFinalTotal()
      changeGiven = 0
    }

    setLoading(true)

    try {
      const totalNeeded = {}

      cart.forEach(cartItem => {
        if (cartItem.recipe && Array.isArray(cartItem.recipe)) {
          cartItem.recipe.forEach(ingredient => {
            const requiredAmount = ingredient.amount * cartItem.qty

            if (totalNeeded[ingredient.id]) {
              totalNeeded[ingredient.id].amount += requiredAmount
            } else {
              totalNeeded[ingredient.id] = {
                name: ingredient.name,
                amount: requiredAmount
              }
            }
          })
        }
      })

      for (const id in totalNeeded) {
        const stockItem = inventory.find(inv => inv.InventoryID === parseInt(id))
        const amountNeeded = totalNeeded[id].amount

        if (!stockItem || stockItem.Quantity < amountNeeded) {
          setNotification({
            message: `${totalNeeded[id].name} is not enough in inventory. Needed: ${amountNeeded}, Available: ${stockItem?.Quantity || 0}.`,
            type: 'error'
          })
          setLoading(false)
          return
        }
      }

      const orderData = {
        EmployeeID: currentUser?.EmployeeID || 1,
        CustomerName: customerName,
        OrderDateTime: new Date().toISOString(),
        Status: 'NOT IN PROGRESS',
        TotalAmount: getFinalTotal(),
        AmountGiven: amountGiven,
        ChangeGiven: changeGiven,
        DiscountAmount: getDiscountAmount(),
        PaymentMethod: finalMethod,
        ReferenceNumber: paymentMethod !== 'Cash' ? referenceNumber : null
      }

      const { data: insertedOrder, error: orderError } = await supabase
        .from('Order')
        .insert([orderData])
        .select()

      if (orderError || !insertedOrder || insertedOrder.length === 0) {
        throw new Error('Order creation failed.')
      }

      const newOrderID = insertedOrder[0].OrderID
      setCurrentOrderId(newOrderID)

      const itemsData = cart.map(item => ({
        OrderID: newOrderID,
        ProductID: item.id,
        Quantity: item.qty,
        PriceAtTimeOfOrder: item.price,
      }))

      const { error: itemsError } = await supabase.from('OrderItem').insert(itemsData)
      if (itemsError) throw itemsError

      await supabase.from('FinancialRecord').insert([{
        EmployeeID: currentUser?.EmployeeID || 1,
        TransactionDate: new Date().toISOString(),
        RecordType: 'Income',
        Amount: getFinalTotal(),
        Description: `POS Order #${newOrderID} - ${customerName} (${finalMethod})`,
        Status: 'Completed'
      }])

      for (const id in totalNeeded) {
        const stockItem = inventory.find(inv => inv.InventoryID === parseInt(id))
        if (!stockItem) continue

        const newQty = stockItem.Quantity - totalNeeded[id].amount

        if (newQty <= 0) {
          const { error: archiveError } = await supabase.from('InventoryArchive').insert([{
            EmployeeID: currentUser?.EmployeeID || null,
            ArchivedDate: new Date().toISOString(),
            Reason: `[AUTO] ${stockItem.ItemName} reached 0 stock after POS Order #${newOrderID}`
          }])

          if (archiveError) {
            console.error(`Error archiving ${stockItem.ItemName}:`, archiveError)
            throw new Error(`Failed to archive ${stockItem.ItemName}.`)
          }

          const { error: softArchiveError } = await supabase
            .from('Inventory')
            .update({
              Quantity: 0,
              IsArchived: true,
              ArchivedAt: new Date().toISOString()
            })
            .eq('InventoryID', id)

          if (softArchiveError) {
            console.error(`Error updating ${stockItem.ItemName}:`, softArchiveError)
            throw new Error(`Failed to archive ${stockItem.ItemName}.`)
          }

          setNotification({
            message: `${stockItem.ItemName} is now out of stock`,
            type: 'warning'
          })
        } else {
          const { error: updateError } = await supabase
            .from('Inventory')
            .update({ Quantity: newQty })
            .eq('InventoryID', id)

          if (updateError) {
            console.error(`Error updating ${totalNeeded[id].name}:`, updateError)
            throw updateError
          }

          if (newQty <= stockItem.ReorderThreshold) {
            setNotification({
              message: `Low stock: ${stockItem.ItemName} is now ${newQty.toFixed(2)}.`,
              type: 'warning'
            })
          }
        }
      }

      await fetchInventory()
      await fetchCurrentOrders()

      const newLocalOrder = {
        id: newOrderID,
        customer: customerName,
        items: [...cart],
        status: 'IN PROGRESS',
        total: getFinalTotal(),
        employeeId: currentUser?.EmployeeID || 'EMP',
        date: new Date().toLocaleString()
      }

      setOrders(prev => {
        const exists = prev.some(o => o.id === newLocalOrder.id)
        if (exists) return prev
        return [newLocalOrder, ...prev]
      })

      setShowPaymentModal(false)
      setReceiptPrinted(false)
      setShowReceiptModal(true)
    } catch (err) {
      console.error('Payment Process Error:', err)
      setNotification({ message: 'Transaction Failed: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusClick = (order) => {
    setSelectedOrder(order)
    setShowStatusModal(true)
  }

  const updateStatus = async (status) => {
    if (status === 'COMPLETED') {
      setShowCompleteConfirm(true)
    } else {
      await supabase.from('Order').update({ Status: status }).eq('OrderID', selectedOrder.id)
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status } : o))
      setShowStatusModal(false)
    }
  }

  const confirmCompletion = async () => {
    const orderToMove = orders.find(o => o.id === selectedOrder.id)
    if (orderToMove) {
      await supabase.from('Order').update({ Status: 'COMPLETED' }).eq('OrderID', selectedOrder.id)
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
      fetchRecentTransactions()
    }
    setShowCompleteConfirm(false)
    setShowStatusModal(false)
  }

  const handleCancelCompletion = () => {
    setShowCompleteConfirm(false)
  }

  const handleAdminLoginSubmit = async () => {
    if (!adminUser || !adminPass) {
      return setNotification({ message: 'Enter credentials', type: 'error' })
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: adminUser,
      password: adminPass
    })

    if (error) return setNotification({ message: 'Login Failed', type: 'error' })

    const { data } = await supabase
      .from('User')
      .select('RoleName')
      .eq('UserID', authData.user.id)
      .maybeSingle()

    if (data && ['HR Admin', 'Inventory Admin', 'Sales Admin'].includes(data.RoleName)) {
      setAdminUser('')
      setAdminPass('')
      setShowAdminLogin(false)
      setShowManageMenu(true)
    } else {
      setNotification({ message: 'Access Denied: Only admins can manage the menu. Please use an admin account.', type: 'error' })
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewItemFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleAddIngredientToRecipe = () => {
    if (!selectedIngId || !selectedIngAmount) return

    const ing = inventory.find(i => i.InventoryID === parseInt(selectedIngId))
    if (ing) {
      setNewItemRecipe([
        ...newItemRecipe,
        {
          id: ing.InventoryID,
          name: ing.ItemName,
          unit: ing.UnitMeasurement,
          amount: parseFloat(selectedIngAmount)
        }
      ])
      setSelectedIngId('')
      setSelectedIngAmount('')
    }
  }

  const removeIngredientFromRecipe = (idx) => {
    const updated = [...newItemRecipe]
    updated.splice(idx, 1)
    setNewItemRecipe(updated)
  }

  const handleSaveItem = async () => {
    if (!newItemName || !newItemPrice) {
      return setNotification({ message: 'Name and Price are required.', type: 'error' })
    }

    setLoading(true)
    let publicUrl = previewUrl

    try {
      if (newItemFile) {
        const fileName = `${Date.now()}.${newItemFile.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage.from('product').upload(fileName, newItemFile)
        if (uploadError) throw uploadError
        publicUrl = supabase.storage.from('product').getPublicUrl(fileName).data.publicUrl
      }

      const productData = {
        ProductName: newItemName,
        ProductPrice: parseFloat(newItemPrice),
        ProductImageURL: publicUrl,
        Category: newItemCategory
      }

      let productId = editItemId

      if (isEditing) {
        const { error: productError } = await supabase
          .from('Product')
          .update(productData)
          .eq('ProductID', editItemId)

        if (productError) throw productError

        const { error: deleteRecipeError } = await supabase
          .from('Recipe')
          .delete()
          .eq('ProductID', editItemId)

        if (deleteRecipeError) throw deleteRecipeError

        productId = editItemId
      } else {
        const { data: insertedProduct, error: insertError } = await supabase
          .from('Product')
          .insert([productData])
          .select()
          .single()

        if (insertError) throw insertError
        productId = insertedProduct.ProductID
      }

      if (newItemRecipe.length > 0) {
        const recipeRows = newItemRecipe.map(ingredient => ({
          ProductID: productId,
          InventoryID: ingredient.id,
          QuantityUsed: parseFloat(ingredient.amount)
        }))

        const { error: recipeInsertError } = await supabase
          .from('Recipe')
          .insert(recipeRows)

        if (recipeInsertError) throw recipeInsertError
      }

      setNotification({
        message: isEditing ? 'Item Updated Successfully!' : 'Item Added Successfully!',
        type: 'success'
      })

      resetForm()
      await fetchMenu()
    } catch (error) {
      setNotification({ message: 'Error saving item: ' + error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleEditPrep = (item) => {
    setIsEditing(true)
    setEditItemId(item.id)
    setNewItemName(item.name)
    setNewItemPrice(item.price)
    setNewItemCategory(item.category)
    setNewItemRecipe(item.recipe || [])
    setPreviewUrl(item.img)
    setNewItemFile(null)
  }

  const resetForm = () => {
    setIsEditing(false)
    setEditItemId(null)
    setNewItemName('')
    setNewItemPrice('')
    setNewItemCategory('Flavor')
    setNewItemRecipe([])
    setNewItemFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return

    setLoading(true)

    try {
      const { error: recipeDeleteError } = await supabase
        .from('Recipe')
        .delete()
        .eq('ProductID', id)

      if (recipeDeleteError) throw recipeDeleteError

      const { error: productDeleteError } = await supabase
        .from('Product')
        .delete()
        .eq('ProductID', id)

      if (productDeleteError) throw productDeleteError

      setNotification({ message: 'Deleted', type: 'success' })
      await fetchMenu()
    } catch (error) {
      setNotification({ message: 'Error deleting item: ' + error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const colors = {
    green: '#6B7C65',
    beige: '#E8DCC6',
    white: '#ffffff',
    darkBtn: '#5a6955',
    redBtn: '#FF6B6B',
    statusRed: '#FF6B6B',
    statusYellow: '#E5C546',
    statusGreen: '#538D4E',
    blueText: '#337AB7',
    discountRed: '#D9534F'
  }

  const uiStyles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    },
    modalContent: {
      background: 'white',
      padding: '30px',
      borderRadius: '20px',
      width: '450px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
    },
    inputStyle: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #333',
      fontSize: '16px',
      boxSizing: 'border-box',
      fontWeight: 'bold'
    },
    sidebarItem: (active) => ({
      padding: '12px 20px',
      background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
      fontWeight: active ? 'bold' : 'normal',
      borderLeft: active ? '5px solid #E8DCC6' : '5px solid transparent',
      cursor: 'pointer'
    })
  }

  const paginate = (items, page, perPage) =>
    items.slice((page - 1) * perPage, (page - 1) * perPage + perPage)

  return {
    state: {
      activeTab,
      currentUser,
      menu,
      loadingMenu,
      selectedIngAmount,
      inventory,
      cart,
      searchQuery,
      loading,
      showPaymentModal,
      showReceiptModal,
      showOptionsModal,
      selectedItemForOptions,
      selectedSweetness,
      customerName,
      cashReceived,
      isDiscounted,
      paymentMethod,
      referenceNumber,
      customPaymentMethod,
      currentOrderId,
      receiptPrinted,
      orders,
      selectedOrder,
      showStatusModal,
      showCompleteConfirm,
      completedOrders,
      showRecentModal,
      showAdminLogin,
      showManageMenu,
      adminUser,
      adminPass,
      isEditing,
      editItemId,
      newItemName,
      newItemPrice,
      newItemCategory,
      newItemFile,
      previewUrl,
      fileInputRef,
      newItemRecipe,
      selectedIngId,
      notification,
      orderPage,
      recentPage,
      ordersPerPage,
      recentPerPage
    },
    actions: {
      setActiveTab,
      handleItemClick,
      confirmAddToCart,
      increaseQty,
      decreaseQty,
      getSubtotal,
      getDiscountAmount,
      getFinalTotal,
      getChange,
      handleOpenPayment,
      handlePrintReceipt,
      handleCloseReceipt,
      handleConfirmPayment,
      handleStatusClick,
      updateStatus,
      confirmCompletion,
      handleCancelCompletion,
      fetchRecentTransactions,
      fetchCurrentOrders,
      handleAdminLoginSubmit,
      handleImageUpload,
      handleAddIngredientToRecipe,
      removeIngredientFromRecipe,
      handleSaveItem,
      handleEditPrep,
      resetForm,
      handleDeleteItem,
      setSearchQuery,
      setOrderPage,
      setRecentPage,
      setCustomerName,
      setCashReceived,
      setIsDiscounted,
      setPaymentMethod,
      setReferenceNumber,
      setCustomPaymentMethod,
      setSelectedSweetness,
      setSelectedIngAmount,
      setSelectedIngId,
      setNewItemCategory,
      setNewItemName,
      setNewItemPrice,
      setShowOptionsModal,
      setShowPaymentModal,
      setShowStatusModal,
      setShowCompleteConfirm,
      setShowAdminLogin,
      setShowManageMenu,
      setShowRecentModal,
      setAdminUser,
      setAdminPass,
      setNotification
    },
    ui: { colors, uiStyles, paginate },
    navigate
  }
}