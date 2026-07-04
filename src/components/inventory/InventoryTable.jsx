import React from 'react';
import * as styles from '../../constants/inventoryStyles';
import { HiChevronUp, HiChevronDown } from 'react-icons/hi2';

export function InventoryTable({
  items,
  loading,
  prepareUpdate,
  prepareArchive,
  prepareStockIn,
  sortExpiryAsc,
  setSortExpiryAsc,
  rowRefs
}) {
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        Loading Inventory...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
        <thead
          style={{
            position: 'sticky',
            top: 0,
            background: styles.colors.green,
            color: 'white',
            zIndex: 1
          }}
        >
          <tr>
            <th style={{ width: '90px', padding: '15px' }}>ID</th>
            <th style={{ textAlign: 'left', paddingLeft: '20px', width: '180px' }}>Item Name</th>
            <th style={{ width: '110px' }}>Category</th>
            <th style={{ width: '120px' }}>Stock</th>
            <th style={{ width: '110px' }}>Unit Price</th>
            <th style={{ width: '130px' }}>Stock In</th>

            <th style={{ width: '130px' }}>
              Expiry Date
              <button
                type="button"
                className="icon-btn"
                onClick={() => setSortExpiryAsc(prev => !prev)}
                style={{
                  marginLeft: '6px',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '6px',
                  width: '22px',
                  height: '22px',
                  color: 'white',
                  verticalAlign: 'middle'
                }}
                title="Sort by nearest expiry"
              >
                {sortExpiryAsc ? <HiChevronUp size={14} /> : <HiChevronDown size={14} />}
              </button>
            </th>

            <th style={{ width: '120px' }}>Status</th>
            <th style={{ width: '180px', paddingRight: '15px' }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                No items found.
              </td>
            </tr>
          ) : (
            items.map(item => {
              const isExpired = item.Expiry ? new Date(item.Expiry) < new Date() : false;
              const isLowStock = item.Quantity <= item.ReorderThreshold && !isExpired;

              let statusText = 'Good';
              let statusColor = styles.colors.green;

              if (isExpired) {
                statusText = 'Expired';
                statusColor = styles.colors.red;
              } else if (isLowStock) {
                statusText = 'Low Stock';
                statusColor = styles.colors.yellow;
              }

              return (
                <tr
                  key={item.InventoryID}
                  ref={el => {
                    if (rowRefs?.current) {
                      rowRefs.current[item.InventoryID] = el;
                    }
                  }}
                  style={{
                    borderBottom: '1px solid #eee',
                    textAlign: 'center',
                    height: '50px',
                    fontSize: '13px'
                  }}
                >
                  <td style={{ width: '90px' }}>
                    INV-{String(item.InventoryID).padStart(3, '0')}
                  </td>

                  <td style={{ textAlign: 'left', paddingLeft: '20px', fontWeight: 'bold', width: '180px' }}>
                    {item.ItemName}
                  </td>

                  <td style={{ width: '110px', fontWeight: 'bold' }}>
                    {item.Category}
                  </td>

                  <td
                    style={{
                      width: '120px',
                      fontWeight: 'bold',
                      color: isLowStock || isExpired ? styles.colors.red : 'inherit'
                    }}
                  >
                    {item.Quantity} {item.UnitMeasurement}
                  </td>

                  <td style={{ width: '110px', fontWeight: 'bold' }}>
                    ₱{parseFloat(item.UnitPrice || 0).toFixed(2)}
                  </td>

                  <td style={{ width: '130px', fontWeight: 'bold' }}>
                    {item.StockIn ? new Date(item.StockIn).toLocaleDateString() : 'N/A'}
                  </td>

                  <td
                    style={{
                      width: '130px',
                      fontWeight: 'bold',
                      color: isExpired ? styles.colors.red : 'inherit'
                    }}
                  >
                    {item.Expiry ? new Date(item.Expiry).toLocaleDateString() : 'N/A'}
                  </td>

                  <td style={{ width: '120px', fontWeight: 'bold', color: statusColor }}>
                    {statusText}
                  </td>

                  <td style={{ width: '180px', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn-animated"
                        onClick={() => prepareStockIn(item.InventoryID)}
                        style={{
                          padding: '6px 10px',
                          background: styles.colors.green,
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Stock In
                      </button>

                      <button
                        className="btn-animated"
                        onClick={() => prepareUpdate(item.InventoryID)}
                        style={{
                          padding: '6px 10px',
                          background: styles.colors.yellow,
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Update
                      </button>

                      <button
                        className="btn-animated"
                        onClick={() => prepareArchive(item.InventoryID)}
                        style={{
                          padding: '6px 10px',
                          background: styles.colors.red,
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
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