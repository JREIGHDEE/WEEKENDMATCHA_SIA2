import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Notification } from '../components/Notification'
import logo from '../assets/wm-logo.svg'
import cafePhoto from '../assets/cafe-photo.png'
import Sidebar from '../components/Sidebar'

function AdminMenu() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: 'success' })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
  }

  const clearNotification = () => {
    setNotification({ message: '', type: 'success' })
  }

  // SECURITY CHECK
  useEffect(() => {
    const checkSecurity = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      const { data } = await supabase
        .from('User')
        .select('RoleName')
        .eq('UserID', user.id)
        .maybeSingle()

      const ALLOWED = ['HR Admin', 'Inventory Admin', 'Sales Admin']

      if (!data || !ALLOWED.includes(data.RoleName)) {
        showNotification("Access Denied: You are not an Admin.", 'error')
        setTimeout(() => navigate('/personal-view'), 2000)
      } else {
        setLoading(false) 
      }
    }
    checkSecurity()
  }, [])

  if (loading) return <div style={{height:"100vh", background:"#6B7C65"}}></div>

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>

      <Sidebar />

          <div style={{
              flex: 1, 
              // Set the background image
              backgroundImage: `url(${cafePhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              
              // Add the 80% color overlay (using the same #DD571C color)
              boxShadow: `inset 0 0 0 1000px rgba(221, 87, 28, 0.3)` 
          }}>
              <img
                src={logo}
                alt="WeekendMatcha Logo Center"
                // Set opacity to 1.0 so the logo is crisp on the overlay
                style={{ width: "min(600px, 70vw)", height: "auto", opacity: 1.0 }}
              />
          </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={clearNotification}
      />
    </div>
  )
}
export default AdminMenu