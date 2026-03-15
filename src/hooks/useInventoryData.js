import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useInventoryData() {
  const [inventory, setInventory] = useState([]);
  const [archiveLogs, setArchiveLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiringCount, setExpiringCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Inventory')
      .select('*')
      .order('InventoryID', { ascending: false });

    if (!error) {
      const safeData = data || [];
      setInventory(safeData);
      
      // Calculate Low Stock
      setLowStockCount(safeData.filter(item => item.Quantity <= item.ReorderThreshold).length);

      // Calculate Expiring
      const today = new Date();
      const eCount = safeData.filter(item => {
        if (!item.Expiry) return false;
        const diffTime = new Date(item.Expiry) - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
      }).length;
      setExpiringCount(eCount);
    }
    setLoading(false);
  };

  const fetchArchiveLogs = async () => {
    const { data, error } = await supabase
      .from('InventoryArchive')
      .select(`*, Employee (User (FirstName, LastName))`)
      .order('ArchivedDate', { ascending: false });
    if (!error) setArchiveLogs(data || []);
  };

  useEffect(() => {
    fetchInventory();
    const subscription = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', table: 'Inventory', schema: 'public' }, fetchInventory)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  return { inventory, archiveLogs, loading, expiringCount, lowStockCount, fetchInventory, fetchArchiveLogs };
}