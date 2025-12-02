import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import AdminMenu from './pages/AdminMenu'
import HRSystem from './pages/HRSystem'
import PersonalView from './pages/PersonalView' // <--- IMPORT THIS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-menu" element={<AdminMenu />} />
        <Route path="/hr-system" element={<HRSystem />} />
        <Route path="/personal-view" element={<PersonalView />} /> {/* <--- ADD THIS */}
      </Routes>
    </BrowserRouter>
  )
}

export default App