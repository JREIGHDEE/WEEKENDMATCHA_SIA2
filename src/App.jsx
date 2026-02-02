import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage_TEMP'
import Login from './pages/Login'
import AdminMenu from './pages/AdminMenu'
import HRSystem from './pages/HRSystem'
import PersonalView from './pages/PersonalView' // <--- IMPORT THIS
import SalesSystem from './pages/SalesSystem' 
import SalesReports from './pages/SalesReports' // <--- IMPORT THIS
import Inventory from './pages/Inventory' 
import POSSystem from './pages/POSSystem'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-menu" element={<AdminMenu />} />
        <Route path="/hr-system" element={<HRSystem />} />
        <Route path="/personal-view" element={<PersonalView />} /> {/* <--- ADD THIS */}
        <Route path="/sales-system" element={<SalesSystem />} /> {/* <--- Add this route! */}
        <Route path="/sales-reports" element={<SalesReports />} /> {/* <--- ADD THIS ROUTE */}
        <Route path="/inventory-system" element={<Inventory />} />
        <Route path="/pos" element={<POSSystem />} /> 
      </Routes>
    </BrowserRouter>
  )
}

export default App