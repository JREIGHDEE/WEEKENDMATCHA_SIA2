import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Notification } from '../components/Notification';
import { useInventoryData } from '../hooks/useInventoryData';
import { PaginationControls } from '../components/PaginationControls';
import * as styles from '../constants/inventoryStyles';
import { AlertBanners } from '../components/inventory/AlertBanners';
import { InventoryTable } from '../components/inventory/InventoryTable';
import { InventoryModals } from '../components/inventory/InventoryModals';
import Sidebar from '../components/Sidebar';
import { type as typeScale } from '../constants/uiStyles';
import { HiOutlineSearch } from 'react-icons/hi';

function InventorySystem() {
  const { inventory, loading, fetchInventory } = useInventoryData();

  const rowRefs = useRef({});
  const searchContainerRef = useRef(null);

  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [sortExpiryAsc, setSortExpiryAsc] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);

  useEffect(() => {
    const fetchCurrentEmployee = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('Employee')
        .select('EmployeeID')
        .eq('UserID', user.id)
        .maybeSingle();
      setCurrentEmployeeId(data?.EmployeeID || null);
    };
    fetchCurrentEmployee();
  }, []);

  // --- NEW: RENAMED FOR PACKAGES ---
  const [stockInPackages, setStockInPackages] = useState('');
  const [stockInPackagePrice, setStockInPackagePrice] = useState('');
  const [stockInExpiry, setStockInExpiry] = useState('');

  const [modals, setModals] = useState({
    add: false, confirmAdd: false, update: false, confirmUpdate: false,
    archive: false, confirmArchive: false, stockIn: false
  });

  const itemsPerPage = 8;

  // --- NEW: ADDED PACKAGE STATE ---
  const initialFormState = {
    ItemName: '', Category: 'Ingredients',
    PackagesBought: '', UnitsPerPackage: '1000', UnitMeasurement: 'ml', PackagePrice: '',
    ReorderThreshold: '', Expiry: '', StockIn: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const scrollToItem = (id) => {
    const el = rowRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.backgroundColor = '#fff3cd';
      setTimeout(() => { el.style.backgroundColor = ''; }, 2000);
    }
  };

  useEffect(() => {
    let result = [...inventory];
    const lowerTerm = searchTerm.toLowerCase();

    if (searchTerm) {
      result = result.filter(item => {
        const check = val => val ? String(val).toLowerCase().includes(lowerTerm) : false;
        if (filterCategory === 'All') return check(item.ItemName) || check(item.Category) || check(item.InventoryID);
        if (filterCategory === 'ID') return check(item.InventoryID);
        if (filterCategory === 'Item Name') return check(item.ItemName);
        if (filterCategory === 'Category') return check(item.Category);
        if (filterCategory === 'Price') return check(item.UnitPrice);
        return false;
      });
    }

    if (sortExpiryAsc) {
      result.sort((a, b) => {
        if (!a.Expiry) return 1; if (!b.Expiry) return -1;
        return new Date(a.Expiry) - new Date(b.Expiry);
      });
    }

    setFilteredInventory(result);
    setCurrentPage(1);
  }, [searchTerm, filterCategory, inventory, sortExpiryAsc]);

  useEffect(() => {
    const handleClick = e => { if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setShowFilterMenu(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleInputChange = e => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const closeModal = () => {
    setModals({ add: false, confirmAdd: false, update: false, confirmUpdate: false, archive: false, confirmArchive: false, stockIn: false });
    setFormData(initialFormState);
    setSelectedId(null);
    setStockInPackages('');
    setStockInPackagePrice('');
    setStockInExpiry('');
  };

  const handleAddSubmit = e => {
    e.preventDefault();
    if (!formData.ItemName || !formData.PackagesBought || !formData.PackagePrice || !formData.Expiry) {
      setNotification({ message: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    setModals(prev => ({ ...prev, add: false, confirmAdd: true }));
  };

  const executeAddItem = async () => {
    // --- NEW: THE MAGIC MATH HAPPENS HERE ---
    const baseQty = parseFloat(formData.PackagesBought) * parseFloat(formData.UnitsPerPackage);
    const basePrice = parseFloat(formData.PackagePrice) / parseFloat(formData.UnitsPerPackage);
    // ----------------------------------------

    const { data: insertedItem, error: itemError } = await supabase.from('Inventory').insert([
      {
        ItemName: formData.ItemName,
        Category: formData.Category,
        UnitMeasurement: formData.UnitMeasurement,
        UnitsPerPackage: parseFloat(formData.UnitsPerPackage), // Saving it to DB!
        Quantity: baseQty,
        UnitPrice: basePrice,
        ReorderThreshold: parseInt(formData.ReorderThreshold),
        StockIn: new Date().toISOString(),
        Expiry: formData.Expiry,
        IsArchived: false,
        ArchivedAt: null,
        CreatedBy: currentEmployeeId
      }
    ]).select().single();

    if (itemError) { setNotification({ message: 'Error: ' + itemError.message, type: 'error' }); return; }

    const { error: batchError } = await supabase.from('InventoryBatch').insert([{
      InventoryID: insertedItem.InventoryID,
      Quantity: baseQty,
      UnitPrice: basePrice,
      StockInDate: new Date().toISOString(),
      Expiry: formData.Expiry,
      IsArchived: false
    }]);

    if (batchError) { setNotification({ message: 'Batch error: ' + batchError.message, type: 'error' }); return; }

    setNotification({ message: 'Item Added Successfully!', type: 'success' });
    closeModal();
    fetchInventory();
  };

  const prepareUpdate = id => {
    setSelectedId(id);
    const item = inventory.find(i => i.InventoryID === id);
    if (!item) return;
    setFormData(item);
    setModals(prev => ({ ...prev, update: true }));
  };

  const handleUpdateSubmit = e => {
    e.preventDefault();
    if (!formData.ItemName || !formData.Category || !formData.ReorderThreshold) {
      setNotification({ message: 'Please fill in all required fields.', type: 'error' }); return;
    }
    setModals(prev => ({ ...prev, update: false, confirmUpdate: true }));
  };

  const executeUpdate = async () => {
    const { error } = await supabase.from('Inventory').update({
      ItemName: formData.ItemName, Category: formData.Category, ReorderThreshold: parseInt(formData.ReorderThreshold)
    }).eq('InventoryID', selectedId);

    if (error) { setNotification({ message: 'Error: ' + error.message, type: 'error' });
    } else { setNotification({ message: 'Item Updated Successfully!', type: 'success' }); closeModal(); fetchInventory(); }
  };

  const prepareArchive = id => {
    setSelectedId(id);
    const item = inventory.find(i => i.InventoryID === id);
    if (!item) return;
    setFormData(item);
    setModals(prev => ({ ...prev, confirmArchive: true }));
  };

  const executeArchive = async () => {
    const { error } = await supabase.from('Inventory').update({ IsArchived: true, ArchivedAt: new Date().toISOString() }).eq('InventoryID', selectedId);
    if (error) { setNotification({ message: 'Delete failed: ' + error.message, type: 'error' }); return; }
    setNotification({ message: 'Item Deleted Successfully.', type: 'success' }); closeModal(); fetchInventory();
  };

  const prepareStockIn = id => {
    setSelectedId(id);
    const item = inventory.find(i => i.InventoryID === id);
    if (!item) return;
    setFormData(item);
    setModals(prev => ({ ...prev, stockIn: true }));
  };

  const executeStockIn = async () => {
    if (!selectedId || !stockInPackages || !stockInPackagePrice || !stockInExpiry) {
      setNotification({ message: 'Please fill in all stock-in fields.', type: 'error' }); return;
    }

    // --- NEW: THE MAGIC MATH FOR STOCK IN ---
    const item = inventory.find(i => i.InventoryID === selectedId);
    const unitPerPkg = parseFloat(item?.UnitsPerPackage) || 1;
    const totalQty = parseFloat(stockInPackages) * unitPerPkg;
    const pricePerUnit = parseFloat(stockInPackagePrice) / unitPerPkg;
    // ----------------------------------------

    const { error } = await supabase.from('InventoryBatch').insert([{
      InventoryID: selectedId, Quantity: totalQty, UnitPrice: pricePerUnit,
      StockInDate: new Date().toISOString(), Expiry: stockInExpiry, IsArchived: false
    }]);

    if (error) { setNotification({ message: 'Stock-in failed: ' + error.message, type: 'error' }); return; }
    setNotification({ message: 'Stock added successfully!', type: 'success' });
    closeModal(); fetchInventory();
  };

  const paginate = (items, page, perPage) => { return items.slice((page - 1) * perPage, page * perPage); };
  const selectedItem = inventory.find(i => i.InventoryID === selectedId) || null;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, background: `linear-gradient(180deg, ${styles.colors.beige} 0%, #f3ead9 100%)`, padding: 'clamp(16px, 2vw, 30px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <h1 style={{ margin: 0, fontSize: typeScale.h1, fontWeight: 800, color: styles.colors.darkGreen, marginBottom: '20px', letterSpacing: '-0.3px' }}>Inventory Management</h1>
        <AlertBanners inventory={inventory} onItemClick={scrollToItem} />
        <div className="responsive-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }} ref={searchContainerRef}>
            <div style={{ position: 'relative' }}>
              <HiOutlineSearch size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input placeholder={`Search by ${filterCategory}...`} style={{ padding: '10px 15px 10px 38px', borderRadius: '25px', border: '1px solid #ddd', width: 'min(300px, 60vw)', outline: 'none', fontSize: typeScale.body, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onFocus={() => setShowFilterMenu(true)} />
            </div>
            {showFilterMenu && (
              <div style={{ position: 'absolute', top: '115%', left: 0, background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 10px 28px rgba(30,35,25,0.16)', zIndex: 50, width: 'min(400px, 85vw)', border: '1px solid #eee' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: typeScale.micro, fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>Filter by Category</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['All', 'ID', 'Item Name', 'Category', 'Price'].map(cat => (
                    <button key={cat} style={styles.pillBtn(filterCategory === cat)} onClick={() => { setFilterCategory(cat); setShowFilterMenu(false); }}>{cat.toUpperCase()}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="btn-animated" style={{ ...styles.btnStyle, background: styles.colors.blue }} onClick={() => setModals(prev => ({ ...prev, add: true }))}>ADD</button>
        </div>
        <div className="fade-in-card" style={{ flex: 1, background: 'white', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <InventoryTable items={paginate(filteredInventory, currentPage, itemsPerPage)} prepareUpdate={prepareUpdate} prepareArchive={prepareArchive} prepareStockIn={prepareStockIn} loading={loading} sortExpiryAsc={sortExpiryAsc} setSortExpiryAsc={setSortExpiryAsc} rowRefs={rowRefs} />
          <PaginationControls total={filteredInventory.length} page={currentPage} setPage={setCurrentPage} perPage={itemsPerPage} />
        </div>
      </div>

      <InventoryModals modals={modals} closeModal={closeModal} formData={formData} selectedItem={selectedItem} handleInputChange={handleInputChange} handleAddSubmit={handleAddSubmit} handleUpdateSubmit={handleUpdateSubmit} executeUpdate={executeUpdate} executeAddItem={executeAddItem} setModals={setModals} executeArchive={executeArchive} />

      {modals.stockIn && (
        <div style={styles.modalOverlay}>
          <div className="fade-in-card" style={styles.modalContent}>
            <h2 style={{ color: styles.colors.darkGreen, marginTop: 0, fontSize: typeScale.h2 }}>Stock In: {formData.ItemName}</h2>
            
            {/* --- NEW: PACKAGE LAYOUT --- */}
            <label style={styles.labelStyle}>Packages Bought</label>
            <input type="number" step="0.01" value={stockInPackages} onChange={e => setStockInPackages(e.target.value)} style={styles.inputStyle} />
            <label style={styles.labelStyle}>Price per Package (₱)</label>
            <input type="number" step="0.01" value={stockInPackagePrice} onChange={e => setStockInPackagePrice(e.target.value)} style={styles.inputStyle} />
            {/* --------------------------- */}
            
            <label style={styles.labelStyle}>Expiry Date</label>
            <input type="date" value={stockInExpiry} onChange={e => setStockInExpiry(e.target.value)} style={styles.inputStyle} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={closeModal} style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}>Cancel</button>
              <button onClick={executeStockIn} style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}>Confirm Stock In</button>
            </div>
          </div>
        </div>
      )}
      <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: 'success' })} />
    </div>
  );
}

export default InventorySystem;