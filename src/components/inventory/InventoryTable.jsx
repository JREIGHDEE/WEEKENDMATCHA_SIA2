import React from 'react';
import * as styles from '../../constants/inventoryStyles';

// Notice we added prepareUpdate and prepareArchive to the props
export function InventoryTable({ items, loading, prepareUpdate, prepareArchive }) {
    if (loading) {
        return <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>Loading Inventory...</div>;
    }

    return (
        <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: styles.colors.green, color: "white", zIndex: 1 }}>
                    <tr>
                        {/* Removed the Select th */}
                        <th style={{ width: "100px", padding: "15px" }}>ID</th>
                        <th style={{ textAlign: "left", paddingLeft: "20px" }}>Item Name</th>
                        <th style={{ width: "120px" }}>Category</th>
                        <th style={{ width: "120px" }}>Stock</th>
                        <th style={{ width: "120px" }}>Unit Price</th>
                        <th style={{ width: "150px" }}>Expiry Date</th>
                        <th style={{ width: "150px" }}>Status</th>
                        {/* Added Actions th */}
                        <th style={{ width: "120px", paddingRight: "15px" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr><td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>No items found.</td></tr>
                    ) : (
                        items.map(item => {
                            const isExpired = item.ExpiryDate ? new Date(item.ExpiryDate) < new Date() : false;
                            const isLowStock = item.Quantity <= item.ReorderThreshold && !isExpired;
                            
                            let statusText = "Good";
                            let statusColor = styles.colors.green;
                            if (isExpired) { statusText = "Expired"; statusColor = styles.colors.red; }
                            else if (isLowStock) { statusText = "Low Stock"; statusColor = styles.colors.yellow; }

                            return (
                                <tr key={item.InventoryID} style={{ borderBottom: "1px solid #eee", textAlign: "center", height: "50px", fontSize: "13px" }}>
                                    {/* Removed the radio button td */}
                                    <td style={{ width: "100px" }}>INV-{String(item.InventoryID).padStart(3, '0')}</td>
                                    <td style={{ textAlign: "left", paddingLeft: "20px", fontWeight: "bold" }}>{item.ItemName}</td>
                                    <td style={{ width: "120px", fontWeight: "bold" }}>{item.Category}</td>
                                    <td style={{ width: "120px", fontWeight: "bold", color: isLowStock || isExpired ? styles.colors.red : "inherit" }}>
                                        {item.Quantity} {item.UnitMeasurement}
                                    </td>
                                    <td style={{ width: "120px", fontWeight: "bold" }}>₱{parseFloat(item.UnitPrice).toFixed(2)}</td>
                                    <td style={{ width: "150px", fontWeight: "bold", color: isExpired ? styles.colors.red : "inherit" }}>
                                        {item.ExpiryDate ? new Date(item.ExpiryDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td style={{ width: "150px", fontWeight: "bold", color: statusColor }}>{statusText}</td>
                                    
                                    {/* Added Actions td */}
                                    <td style={{ width: "120px", paddingRight: "15px" }}>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                            {/* Update Button */}
                                            <button 
                                                onClick={() => prepareUpdate(item.InventoryID)} 
                                                style={{ padding: "6px 10px", background: styles.colors.yellow, color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }}
                                                title="Update Item"
                                            >
                                                Update
                                            </button>
                                            {/* Archive Button */}
                                            <button 
                                                onClick={() => prepareArchive(item.InventoryID)} 
                                                style={{ padding: "6px 10px", background: styles.colors.red, color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" }}
                                                title="Archive Item"
                                            >
                                                Archive
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}