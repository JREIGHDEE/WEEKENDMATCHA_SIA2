import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/wm-logo.svg';
import { Notification } from '../components/Notification';

// Modular Imports (Ensure these files exist!)
import { useInventoryData } from '../hooks/useInventoryData';
import { PaginationControls } from '../components/PaginationControls';
import * as styles from '../constants/inventoryStyles';

// Sub-Component Imports
import { AlertBanners } from '../components/inventory/AlertBanners';
import { InventoryTable } from '../components/inventory/InventoryTable';
import { InventoryModals } from '../components/inventory/InventoryModals';

function InventorySystem() {
  const navigate = useNavigate();
  
  // --- DATA HOOK ---
  const { 
    inventory, archiveLogs, loading, expiringCount, 
    lowStockCount, fetchInventory, fetchArchiveLogs 
  } = useInventoryData();

  // --- UI STATE ---
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [archivePage, setArchivePage] = useState(1);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [modals, setModals] = useState({ add: false, confirmAdd: false, update: false, archive: false, viewLog: false });
  const [archiveReason, setArchiveReason] = useState('');
  const searchContainerRef = useRef(null);
  const itemsPerPage = 7;

  // --- FORM STATE ---
  const initialFormState = {
    ItemName: '', Category: 'Ingredients', Quantity: '', UnitMeasurement: 'grams',
    UnitPrice: '', ReorderThreshold: '', Expiry: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = inventory;
    const lowerTerm = searchTerm.toLowerCase();
    if (searchTerm) {
      result = result.filter(item => {
        const check = (val) => (val ? String(val).toLowerCase().includes(lowerTerm) : false);
        if (filterCategory === 'All') return check(item.ItemName) || check(item.Category) || check(item.InventoryID);
        if (filterCategory === 'ID') return check(item.InventoryID);
        if (filterCategory === 'Item Name') return check(item.ItemName);
        if (filterCategory === 'Category') return check(item.Category);
        if (filterCategory === 'Price') return check(item.UnitPrice);
        return false;
      });
    }
    setFilteredInventory(result);
    setCurrentPage(1);
  }, [searchTerm, filterCategory, inventory]);

  // Handle outside clicks for search filter
  useEffect(() => {
    const handleClick = (e) => { if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowFilterMenu(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // --- ACTION HANDLERS ---
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const closeModal = () => {
    setModals({ add: false, confirmAdd: false, update: false, archive: false, viewLog: false });
    setFormData(initialFormState);
    setArchiveReason('');
    setSelectedId(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if(!formData.ItemName || !formData.Quantity || !formData.UnitPrice || !formData.Expiry) {
        setNotification({ message: "Please fill in all required fields.", type: 'error' });
        return;
    }
    setModals({ ...modals, add: false, confirmAdd: true });
  };

  const executeAddItem = async () => {
    const { error } = await supabase.from('Inventory').insert([{
      ...formData,
      Quantity: parseFloat(formData.Quantity),
      UnitPrice: parseFloat(formData.UnitPrice),
      ReorderThreshold: parseInt(formData.ReorderThreshold),
      StockIn: new Date().toISOString()
    }]);
    if (error) setNotification({ message: "Error: " + error.message, type: 'error' });
    else { 
        setNotification({ message: "Item Added Successfully!", type: 'success' }); 
        closeModal(); 
        fetchInventory(); 
    }
  };

  const prepareUpdate = () => {
    if (!selectedId) return setNotification({ message: "Please select an item to update.", type: 'error' });
    const item = inventory.find(i => i.InventoryID === selectedId);
    setFormData(item);
    setModals({ ...modals, update: true });
  };

const executeUpdate = async (e) => {
    e.preventDefault();
    
    // We only include ItemName, Category, Quantity, and ReorderThreshold
    // UnitPrice and Expiry are removed from this list to prevent updates
    const { error } = await supabase.from('Inventory').update({
        ItemName: formData.ItemName, 
        Category: formData.Category,
        Quantity: parseFloat(formData.Quantity), 
        ReorderThreshold: parseInt(formData.ReorderThreshold), 
    }).eq('InventoryID', selectedId);

    if (error) setNotification({ message: "Error: " + error.message, type: 'error' });
    else { 
        setNotification({ message: "Item Updated Successfully!", type: 'success' }); 
        closeModal(); 
        fetchInventory(); 
    }
  };

  const executeArchive = async () => {
    if (!archiveReason) return setNotification({ message: "Please provide a reason.", type: 'error' });
    const itemToArchive = inventory.find(i => i.InventoryID === selectedId);
    
    const { data: { user } } = await supabase.auth.getUser();
    let employeeID = null;
    if (user) {
        const { data: empData } = await supabase.from('Employee').select('EmployeeID').eq('UserID', user.id).maybeSingle();
        if (empData) employeeID = empData.EmployeeID;
    }

    const { error: archiveError } = await supabase.from('InventoryArchive').insert([{
        EmployeeID: employeeID,
        ArchivedDate: new Date(),
        Reason: `[${itemToArchive.Category}] ${itemToArchive.ItemName} - ${archiveReason}`
    }]);

    if (!archiveError) {
        await supabase.from('Inventory').delete().eq('InventoryID', selectedId);
        setNotification({ message: "Item Archived Successfully.", type: 'success' });
        fetchInventory();
        closeModal();
    }
  };

  const paginate = (items, page, perPage) => items.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "250px", flexShrink: 0, background: styles.colors.green, padding: "30px 20px", color: "white", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ paddingBottom: "10px", textAlign: "center" }}>
            <img src={logo} alt="Logo" style={{ width: "130px", height: "auto" }} />
        </div>
        <h2 style={{fontSize: "18px", marginBottom: "40px", marginTop: -20, textAlign: "center"}}>WeekendMatcha</h2>
        
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", background: "#5a6955"}}>Inventory System ➤</div>
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/sales-system')}>Sales System</div>
        {/* RESTORED HUMAN RESOURCE BUTTON */}
        <div style={{ padding: "10px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", marginBottom: "10px", color: "white", cursor: "pointer", opacity: 0.5}} onClick={() => navigate('/hr-system')}>Human Resource</div>
        
        <div style={{ marginTop: "auto", cursor: "pointer", opacity: 0.8, display:"flex", alignItems:"center", gap:"10px", fontSize:"18px" }} onClick={() => navigate('/')}><span>↪</span> Log Out</div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: styles.colors.beige, padding: "30px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <h1 style={{ margin: 0, fontSize: "28px", color: styles.colors.darkGreen, marginBottom: "20px" }}>Inventory Management</h1>

        <AlertBanners expiringCount={expiringCount} lowStockCount={lowStockCount} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            {/* SEARCH */}
            <div style={{ position: "relative" }} ref={searchContainerRef}>
                <input 
                    placeholder={`🔍 Search by ${filterCategory}...`} 
                    style={{ padding: "10px 15px", borderRadius: "25px", border: "1px solid #ccc", width: "300px", outline: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowFilterMenu(true)}
                />
                {showFilterMenu && (
                    <div style={{ position: "absolute", top: "115%", left: 0, background: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 5px 20px rgba(0,0,0,0.15)", zIndex: 50, width: "400px", border: "1px solid #eee" }}>
                        <p style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "bold", color: "#888", textTransform: "uppercase" }}>Filter by Category</p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {['All', 'ID', 'Item Name', 'Category', 'Price'].map(cat => (
                                <button key={cat} style={styles.pillBtn(filterCategory === cat)} onClick={() => { setFilterCategory(cat); setShowFilterMenu(false) }}>{cat.toUpperCase()}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: "10px" }}>
                <button style={{...styles.btnStyle, background: styles.colors.darkGreen}} onClick={() => setModals({...modals, add: true})}>ADD</button>
                <button style={{...styles.btnStyle, background: styles.colors.yellow}} onClick={prepareUpdate}>UPDATE</button>
                <button style={{...styles.btnStyle, background: styles.colors.red}} onClick={() => selectedId ? setModals({...modals, archive: true}) : setNotification({ message: "Select an item.", type: 'error' })}>ARCHIVE</button>
                <button style={{...styles.btnStyle, background: styles.colors.blue}} onClick={() => { fetchArchiveLogs(); setModals({...modals, viewLog: true}); }}>ARCHIVE LOGS</button>
            </div>
        </div>

        {/* TABLE SECTION */}
        <div style={{ flex: 1, background: "white", borderRadius: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <InventoryTable 
                items={paginate(filteredInventory, currentPage, itemsPerPage)} 
                selectedId={selectedId} 
                setSelectedId={setSelectedId} 
                loading={loading} 
            />
            <PaginationControls total={filteredInventory.length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
        </div>
      </div>

      {/* ALL MODALS (Add, Update, Confirm, Archive, Logs) */}
      <InventoryModals 
         modals={modals} 
         closeModal={closeModal} 
         formData={formData} 
         handleInputChange={handleInputChange} 
         handleAddSubmit={handleAddSubmit}
         executeUpdate={executeUpdate} 
         executeAddItem={executeAddItem} 
         setModals={setModals}
         executeArchive={executeArchive} 
         archiveReason={archiveReason} 
         setArchiveReason={setArchiveReason}
         archiveLogs={archiveLogs} 
         archivePage={archivePage} 
         setArchivePage={setArchivePage}
      />

      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: 'success' })} 
      />
    </div>
  );
}

export default InventorySystem;