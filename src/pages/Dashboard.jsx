import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom' // Needed to switch pages
import { supabase } from '../supabaseClient'

function Dashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  
  // Input states for adding new items
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  // 1. Function to Read Data
  async function fetchProducts() {
    const { data, error } = await supabase
      .from('Product') // Make sure this matches your Table Name!
      .select('*')
      .order('ProductID', { ascending: true })
    
    if (error) console.log('Error fetching:', error)
    else setProducts(data)
  }

  // 2. Function to Add Data
  async function addProduct(e) {
    e.preventDefault()
    if (!newName || !newPrice) return alert("Please fill in Name and Price")

    const { error } = await supabase
      .from('Product')
      .insert([
        { 
          ProductName: newName, 
          ProductPrice: parseFloat(newPrice),
          ProductDescription: newDesc 
        }
      ])

    if (error) {
      alert(error.message)
    } else {
      setNewName('')
      setNewPrice('')
      setNewDesc('')
      fetchProducts() // Refresh the list
    }
  }

  // 3. NEW: Function to Log Out
  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/') // Go back to Login page
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      
      {/* HEADER WITH LOGOUT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🍔 Inventory Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{ padding: "10px 20px", background: "red", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}
        >
          Sign Out
        </button>
      </div>

      {/* FORM TO ADD ITEMS */}
      <div style={{ border: "1px solid #ccc", padding: "20px", marginBottom: "40px", borderRadius: "8px", background: "#f9f9f9" }}>
        <h3>Add New Product</h3>
        <form onSubmit={addProduct} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          
          <input 
            type="text" 
            placeholder="Product Name" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ padding: "8px" }}
          />

          <input 
            type="number" 
            placeholder="Price" 
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            style={{ padding: "8px" }}
          />

          <input 
            type="text" 
            placeholder="Description" 
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            style={{ padding: "8px" }}
          />

          <button type="submit" style={{ padding: "8px 16px", background: "green", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
            Add
          </button>

        </form>
      </div>

      {/* TABLE OF ITEMS */}
      <h3>Current Menu</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd" }}>
        <thead>
          <tr style={{ background: "#eee", textAlign: "left" }}>
            <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>ID</th>
            <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Name</th>
            <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Description</th>
            <th style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.ProductID} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "12px" }}>{product.ProductID}</td>
              <td style={{ padding: "12px", fontWeight: "bold" }}>{product.ProductName}</td>
              <td style={{ padding: "12px" }}>{product.ProductDescription}</td>
              <td style={{ padding: "12px" }}>${product.ProductPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Dashboard