import React, { useState } from 'react';
import * as styles from '../../constants/inventoryStyles';
import CancelConfirmationModal from '../CancelConfirmationModal';

export const InventoryModals = ({
  modals, closeModal, formData, selectedItem, handleInputChange, handleAddSubmit,
  handleUpdateSubmit, executeUpdate, executeAddItem, setModals, executeArchive,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);

  const handleCancelClick = action => { setPendingCloseAction(() => action); setShowCancelConfirm(true); };
  const handleCancelConfirm = () => { setShowCancelConfirm(false); if (pendingCloseAction) pendingCloseAction(); setPendingCloseAction(null); };
  const handleCancelCancel = () => { setShowCancelConfirm(false); setPendingCloseAction(null); };

  const summaryBoxStyle = { textAlign: 'left', background: '#f9f9f9', padding: '15px', borderRadius: '10px', fontSize: '14px', marginBottom: '20px' };

  return (
    <>
      {(modals.add || modals.update) && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>&times;</button>
            <h2 style={{ color: styles.colors.darkGreen, marginTop: 0 }}>{modals.add ? 'Add New Item' : 'Update Item'}</h2>

            <form onSubmit={modals.add ? handleAddSubmit : handleUpdateSubmit}>
              <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Item Name<span style={{ color: '#D9534F' }}>*</span></label>
              <input name="ItemName" style={styles.inputStyle} value={formData.ItemName} onChange={handleInputChange} required />

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Category<span style={{ color: '#D9534F' }}>*</span></label>
                  <select name="Category" style={styles.inputStyle} value={formData.Category} onChange={handleInputChange}>
                    <option>Ingredients</option><option>Packaging</option><option>Equipment</option><option>Merchandise</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Unit Measurement<span style={{ color: '#D9534F' }}>*</span></label>
                  <select name="UnitMeasurement" style={{ ...styles.inputStyle, opacity: modals.update ? 0.6 : 1, cursor: modals.update ? 'not-allowed' : 'auto', background: modals.update ? '#f5f5f5' : 'white' }} value={formData.UnitMeasurement} onChange={handleInputChange} disabled={modals.update}>
                    <option value="g">grams (g)</option><option value="kg">kilograms (kg)</option><option value="ml">milliliters (ml)</option><option value="L">liters (L)</option><option value="pcs">pieces (pcs)</option>
                  </select>
                </div>
              </div>

              {/* --- NEW: PACKAGE MATH ROW --- */}
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Amount per Package<span style={{ color: '#D9534F' }}>*</span></label>
                  <input type="number" step="0.01" name="UnitsPerPackage" placeholder="e.g. 1000 for 1L" style={{ ...styles.inputStyle, opacity: modals.update ? 0.6 : 1, cursor: modals.update ? 'not-allowed' : 'auto', background: modals.update ? '#f5f5f5' : 'white' }} value={formData.UnitsPerPackage} onChange={handleInputChange} disabled={modals.update} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Packages Bought<span style={{ color: '#D9534F' }}>*</span></label>
                  <input type="number" step="0.01" name={modals.add ? "PackagesBought" : "Quantity"} style={{ ...styles.inputStyle, opacity: modals.update ? 0.6 : 1, cursor: modals.update ? 'not-allowed' : 'auto', background: modals.update ? '#f5f5f5' : 'white' }} value={modals.add ? formData.PackagesBought : formData.Quantity} onChange={handleInputChange} disabled={modals.update} required />
                </div>
              </div>
              {/* ----------------------------- */}

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Price per Package (₱)<span style={{ color: '#D9534F' }}>*</span></label>
                  <input type="number" step="0.01" name={modals.add ? "PackagePrice" : "UnitPrice"} style={{ ...styles.inputStyle, opacity: modals.update ? 0.6 : 1, cursor: modals.update ? 'not-allowed' : 'auto', background: modals.update ? '#f5f5f5' : 'white' }} value={modals.add ? formData.PackagePrice : formData.UnitPrice} onChange={handleInputChange} disabled={modals.update} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Low Alert Threshold<span style={{ color: '#D9534F' }}>*</span></label>
                  <input type="number" name="ReorderThreshold" placeholder={`in total ${formData.UnitMeasurement || 'units'}`} style={styles.inputStyle} value={formData.ReorderThreshold} onChange={handleInputChange} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Expiry Date<span style={{ color: '#D9534F' }}>*</span></label>
                  <input type="date" name="Expiry" style={{ ...styles.inputStyle, opacity: modals.update ? 0.6 : 1, cursor: modals.update ? 'not-allowed' : 'auto', background: modals.update ? '#f5f5f5' : 'white' }} value={formData.Expiry} onChange={handleInputChange} disabled={modals.update} required />
                </div>
                <div style={{ flex: 1 }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => handleCancelClick(closeModal)} style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}>Cancel</button>
                <button type="submit" style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}>{modals.add ? 'Next' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modals.confirmAdd && (
        <div style={{ ...styles.modalOverlay, zIndex: 1100 }}>
          <div style={{ ...styles.modalContent, width: '400px', textAlign: 'center' }}>
            <h2 style={{ color: styles.colors.darkGreen }}>Confirm Addition</h2>
            <div style={summaryBoxStyle}>
              <p><b>Name:</b> {formData.ItemName}</p>
              <p><b>Category:</b> {formData.Category}</p>
              <p><b>Quantity:</b> {formData.PackagesBought} pkgs ({parseFloat(formData.PackagesBought) * parseFloat(formData.UnitsPerPackage)} {formData.UnitMeasurement})</p>
              <p><b>Price per Pkg:</b> ₱{parseFloat(formData.PackagePrice || 0).toFixed(2)}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button onClick={() => setModals(prev => ({ ...prev, confirmAdd: false, add: true }))} style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}>Edit</button>
              <button onClick={executeAddItem} style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}>Confirm & Add</button>
            </div>
          </div>
        </div>
      )}

      {modals.confirmUpdate && (
        <div style={{ ...styles.modalOverlay, zIndex: 1100 }}>
          <div style={{ ...styles.modalContent, width: '420px', textAlign: 'center' }}>
            <h2 style={{ color: styles.colors.darkGreen }}>Confirm Update</h2>
            <div style={summaryBoxStyle}>
              <p><b>Name:</b> {formData.ItemName}</p>
              <p><b>Category:</b> {formData.Category}</p>
              <p><b>Quantity:</b> {formData.Quantity} {formData.UnitMeasurement} (Read Only)</p>
              <p><b>Low Alert Threshold:</b> {formData.ReorderThreshold} {formData.UnitMeasurement}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button onClick={() => setModals(prev => ({ ...prev, confirmUpdate: false, update: true }))} style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}>Edit</button>
              <button onClick={executeUpdate} style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}>Confirm & Update</button>
            </div>
          </div>
        </div>
      )}

      {modals.confirmArchive && (
        <div style={{ ...styles.modalOverlay, zIndex: 1100 }}>
          <div style={{ ...styles.modalContent, width: '420px', textAlign: 'center' }}>
            <h2 style={{ color: styles.colors.red }}>Confirm Delete</h2>
            <div style={summaryBoxStyle}>
              <p><b>Name:</b> {selectedItem?.ItemName || formData.ItemName}</p>
              <p><b>Category:</b> {selectedItem?.Category || formData.Category}</p>
              <p><b>Quantity:</b> {selectedItem?.Quantity || formData.Quantity} {selectedItem?.UnitMeasurement || formData.UnitMeasurement}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button onClick={() => setModals(prev => ({ ...prev, confirmArchive: false }))} style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}>Cancel</button>
              <button onClick={executeArchive} style={{ ...styles.btnStyle, background: styles.colors.red }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <CancelConfirmationModal isOpen={showCancelConfirm} onConfirm={handleCancelConfirm} onCancel={handleCancelCancel} colors={styles.colors} btnStyle={styles.btnStyle} />
    </>
  );
};