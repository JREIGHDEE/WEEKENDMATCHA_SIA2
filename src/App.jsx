import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [products, setProducts] = useState([])
  
  // 1. These variables hold what you type in the boxes
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  // 2. Function to READ data (Select)
  async function fetchProducts() {
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .order('ProductID', { ascending: true }) // Sort by ID
    
    if (error) console.log('Error fetching:', error)
    else setProducts(data)
  }

  // 3. Function to WRITE data (Insert)
  async function addProduct(e) {
    e.preventDefault() // Stop page from reloading

    if (!newName || !newPrice) return alert("Please fill in Name and Price")

    const { data, error } = await supabase
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
      // Clear the inputs
      setNewName('')
      setNewPrice('')
      setNewDesc('')
      // Refresh the list so we see the new item immediately
      fetchProducts()
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>🍔 Inventory System - Product Admin</h1>
      
      {/* THE FORM TO ADD ITEMS */}
      <div style={{ border: "1px solid #ccc", padding: "20px", marginBottom: "40px", borderRadius: "8px" }}>
        <h3>Add New Product</h3>
        <form onSubmit={addProduct} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          <input 
            type="text" 
            placeholder="Product Name (e.g. Fries)" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ padding: "8px" }}
          />

          <input 
            type="number" 
            placeholder="Price (e.g. 2.50)" 
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            style={{ padding: "8px" }}
          />

          <input 
            type="text" 
            placeholder="Description (Optional)" 
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            style={{ padding: "8px" }}
          />

          <button type="submit" style={{ padding: "8px 16px", background: "green", color: "white", border: "none", cursor: "pointer" }}>
            Add Product
          </button>

        </form>
      </div>

      {/* THE LIST OF EXISTING ITEMS */}
      <h3>Current Menu</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0f0f0", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>ID</th>
            <th style={{ padding: "10px" }}>Name</th>
            <th style={{ padding: "10px" }}>Description</th>
            <th style={{ padding: "10px" }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.ProductID} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px" }}>{product.ProductID}</td>
              <td style={{ padding: "10px", fontWeight: "bold" }}>{product.ProductName}</td>
              <td style={{ padding: "10px" }}>{product.ProductDescription}</td>
              <td style={{ padding: "10px" }}>${product.ProductPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App