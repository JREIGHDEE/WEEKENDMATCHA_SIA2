import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useInventoryData() {
  const [inventory, setInventory] = useState([]);
  const [archiveLogs, setArchiveLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expiringCount, setExpiringCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);

  const [expiringItems, setExpiringItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);

  const fetchInventory = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('Inventory')
      .select('*')
      .order('InventoryID', { ascending: false });

    if (!error) {
      const safeData = data || [];
      setInventory(safeData);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lowStock = [];
      const expiringSoon = [];
      const expired = [];

      safeData.forEach(item => {
        // Check low stock
        if (item.Quantity <= item.ReorderThreshold) {
          lowStock.push(item);
        }

        // Check expiry
        if (item.Expiry) {
          const expiryDate = new Date(item.Expiry);
          expiryDate.setHours(0, 0, 0, 0);

          const diffTime = expiryDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            expired.push(item);
          } else if (diffDays <= 30) {
            expiringSoon.push(item);
          }
        }
      });

      setLowStockItems(lowStock);
      setExpiringItems(expiringSoon);
      setExpiredItems(expired);

      setLowStockCount(lowStock.length);
      setExpiringCount(expiringSoon.length);
      setExpiredCount(expired.length);
    } else {
      console.error('Error fetching inventory:', error);
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
      .on(
        'postgres_changes',
        { event: '*', table: 'Inventory', schema: 'public' },
        fetchInventory
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  return {
    inventory,
    archiveLogs,
    loading,

    expiringCount,
    lowStockCount,
    expiredCount,

    expiringItems,
    lowStockItems,
    expiredItems,

    fetchInventory,
    fetchArchiveLogs
  };
}