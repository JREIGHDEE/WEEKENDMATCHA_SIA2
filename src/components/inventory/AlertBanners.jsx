import React from 'react';
import * as styles from '../../constants/inventoryStyles';

export const AlertBanners = ({ inventory = [] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredItems = [];
  const expiringItems = [];
  const lowStockItems = [];

  inventory.forEach(item => {
    // LOW STOCK
    if (item.Quantity <= item.ReorderThreshold) {
      lowStockItems.push(item);
    }

    // EXPIRY
    if (item.Expiry) {
      const expiryDate = new Date(item.Expiry);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        expiredItems.push(item);
      } else if (diffDays <= 30) {
        expiringItems.push(item);
      }
    }
  });

  const bannerStyle = (color) => ({
    flex: 1,
    background: color,
    color: 'white',
    padding: '15px',
    borderRadius: '10px'
  });

  const renderItems = (items) => {
    return items.slice(0, 3).map(item => (
      <div key={item.InventoryID} style={{ fontSize: '13px' }}>
        • {item.ItemName}
      </div>
    ));
  };

  return (
    <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>

      {expiredItems.length > 0 && (
        <div style={bannerStyle(styles.colors.red)}>
          ⛔ <b>{expiredItems.length} Expired Item(s)</b>
          {renderItems(expiredItems)}
        </div>
      )}

      {expiringItems.length > 0 && (
        <div style={bannerStyle(styles.colors.orange)}>
          ⚠️ <b>{expiringItems.length} Expiring Soon</b>
          {renderItems(expiringItems)}
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div style={bannerStyle(styles.colors.red)}>
          📉 <b>{lowStockItems.length} Low Stock</b>
          {renderItems(lowStockItems)}
        </div>
      )}

    </div>
  );
};