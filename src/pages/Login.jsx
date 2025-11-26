import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      alert("Login failed: " + error.message)
    } else {
      // If successful, go to the Dashboard
      navigate('/dashboard')
    }
  }

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>Inventory System Login</h1>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", width: "300px", margin: "auto", gap: "10px" }}>
        <input 
          type="email" 
          placeholder="Enter Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "10px" }}
        />
        <input 
          type="password" 
          placeholder="Enter Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px" }}
        />
        <button type="submit" style={{ padding: "10px", background: "blue", color: "white", cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  )
}

export default Login