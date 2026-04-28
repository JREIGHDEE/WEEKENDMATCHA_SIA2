import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useInventoryData() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiringCount, setExpiringCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchInventory = async () => {
    setLoading(true);

    const { data: items, error: itemError } = await supabase
      .from('Inventory')
      .select('*')
      .eq('IsArchived', false)
      .order('InventoryID', { ascending: false });

    const { data: batches, error: batchError } = await supabase
      .from('InventoryBatch')
      .select('*')
      .eq('IsArchived', false)
      .order('Expiry', { ascending: true });

    if (itemError || batchError) {
      console.error('Inventory fetch error:', itemError || batchError);
      setLoading(false);
      return;
    }

    const safeItems = items || [];
    const safeBatches = batches || [];

    const processed = safeItems.map(item => {
      const itemBatches = safeBatches.filter(
        batch =>
          batch.InventoryID === item.InventoryID &&
          Number(batch.Quantity) > 0
      );

      const totalQuantity = itemBatches.reduce(
        (sum, batch) => sum + Number(batch.Quantity || 0),
        0
      );

      const nearestBatch = itemBatches[0];

      return {
        ...item,
        Quantity: totalQuantity,
        UnitPrice: nearestBatch?.UnitPrice || item.UnitPrice || 0,
        StockIn: nearestBatch?.StockInDate || item.StockIn || null,
        Expiry: nearestBatch?.Expiry || item.Expiry || null,
        Batches: itemBatches
      };
    });

    setInventory(processed);

    setLowStockCount(
      processed.filter(
        item => Number(item.Quantity) <= Number(item.ReorderThreshold)
      ).length
    );

    const today = new Date();

    const eCount = processed.filter(item => {
      if (!item.Expiry) return false;

      const diffTime = new Date(item.Expiry) - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays <= 30 && diffDays >= 0;
    }).length;

    setExpiringCount(eCount);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();

    const inventoryChannel = supabase
      .channel('inventory-and-batch-changes')
      .on(
        'postgres_changes',
        { event: '*', table: 'Inventory', schema: 'public' },
        fetchInventory
      )
      .on(
        'postgres_changes',
        { event: '*', table: 'InventoryBatch', schema: 'public' },
        fetchInventory
      )
      .subscribe();

    return () => supabase.removeChannel(inventoryChannel);
  }, []);

  return {
    inventory,
    loading,
    expiringCount,
    lowStockCount,
    fetchInventory
  };
}