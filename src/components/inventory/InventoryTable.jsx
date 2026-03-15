import React from 'react';
import * as styles from '../../constants/inventoryStyles';

export const InventoryTable = ({ items, selectedId, setSelectedId, loading }) => (
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead style={{ position: "sticky", top: 0, background: styles.colors.green, color: "white", zIndex: 1 }}>
      <tr>
        <th style={{ padding: "15px" }}>Select</th>
        <th>Item Name</th>
        <th>Category</th>
        <th>Quantity</th>
        <th>Unit</th>
        <th>Price</th>
        <th>Expiry</th>
        <th>Stock In</th>
      </tr>
    </thead>
    <tbody style={{ textAlign: "center" }}>
      {loading && <tr><td colSpan="8" style={{padding:"20px"}}>Loading...</td></tr>}
      {!loading && items.map(item => (
        <tr key={item.InventoryID} style={{ borderBottom: "1px solid #eee", height: "50px" }}>
          <td>
            <input 
              type="radio" 
              checked={selectedId === item.InventoryID} 
              onChange={() => setSelectedId(item.InventoryID)} 
              style={{ transform: "scale(1.5)", cursor: "pointer" }} 
            />
          </td>
          <td style={{ fontWeight: "bold" }}>{item.ItemName}</td>
          <td><span style={{background: "#eee", padding: "4px 8px", borderRadius: "5px", fontSize: "12px"}}>{item.Category}</span></td>
          <td style={{ color: item.Quantity <= item.ReorderThreshold ? "red" : styles.colors.darkGreen, fontWeight: "bold" }}>{item.Quantity}</td>
          <td>{item.UnitMeasurement}</td>
          <td>₱{parseFloat(item.UnitPrice || 0).toFixed(2)}</td>
          <td>{item.Expiry ? new Date(item.Expiry).toLocaleDateString() : 'N/A'}</td>
          <td style={{fontSize:"11px", color:"#777"}}>{item.StockIn ? new Date(item.StockIn).toLocaleString() : "N/A"}</td>
        </tr>
      ))}
    </tbody>
  </table>
);