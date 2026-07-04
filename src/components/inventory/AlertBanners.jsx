import React from 'react';
import * as styles from '../../constants/inventoryStyles';
import { HiOutlineNoSymbol, HiOutlineExclamationTriangle, HiOutlineArrowTrendingDown } from 'react-icons/hi2';

export const AlertBanners = ({ inventory = [], onItemClick }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredItems = [];
  const expiringItems = [];
  const lowStockItems = [];

  inventory.forEach(item => {
    if (Number(item.Quantity) <= Number(item.ReorderThreshold)) {
      lowStockItems.push(item);
    }

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

  const bannerStyle = color => ({
    flex: 1,
    minWidth: '200px',
    background: color,
    color: 'white',
    padding: '15px 18px',
    borderRadius: '14px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
    fontSize: '14px'
  });

  const bannerHeader = { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 };

  const renderItems = items => {
    return items.slice(0, 3).map(item => (
      <div
        key={item.InventoryID}
        onClick={() => onItemClick && onItemClick(item.InventoryID)}
        style={{
          fontSize: '13px',
          cursor: 'pointer',
          textDecoration: 'underline',
          marginTop: '4px'
        }}
        title="Click to view item"
      >
        • {item.ItemName}
      </div>
    ));
  };

  return (
    <div className="responsive-stack" style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
      {expiredItems.length > 0 && (
        <div className="card-hover" style={bannerStyle(styles.colors.red)}>
          <div style={bannerHeader}><HiOutlineNoSymbol size={18} /> {expiredItems.length} Expired Item(s)</div>
          {renderItems(expiredItems)}
        </div>
      )}

      {expiringItems.length > 0 && (
        <div className="card-hover" style={bannerStyle(styles.colors.orange)}>
          <div style={bannerHeader}><HiOutlineExclamationTriangle size={18} /> {expiringItems.length} Expiring Soon</div>
          {renderItems(expiringItems)}
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="card-hover" style={bannerStyle(styles.colors.red)}>
          <div style={bannerHeader}><HiOutlineArrowTrendingDown size={18} /> {lowStockItems.length} Low Stock</div>
          {renderItems(lowStockItems)}
        </div>
      )}
    </div>
  );
};