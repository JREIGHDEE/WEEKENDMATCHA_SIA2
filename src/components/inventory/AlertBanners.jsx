import React from 'react';
import * as styles from '../../constants/inventoryStyles';

export const AlertBanners = ({ expiringCount, lowStockCount }) => (
  <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
    {expiringCount > 0 && (
      <div style={{ flex: 1, background: styles.colors.orange, color: "white", padding: "15px", borderRadius: "10px" }}>
        ⚠️ <b>{expiringCount} Item(s) Expiring Soon!</b>
      </div>
    )}
    {lowStockCount > 0 && (
      <div style={{ flex: 1, background: styles.colors.red, color: "white", padding: "15px", borderRadius: "10px" }}>
        📉 <b>{lowStockCount} Item(s) Below Threshold!</b>
      </div>
    )}
  </div>
);