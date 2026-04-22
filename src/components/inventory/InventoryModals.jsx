import React, { useState } from 'react';
import * as styles from '../../constants/inventoryStyles';
import { PaginationControls } from '../PaginationControls';
import CancelConfirmationModal from '../CancelConfirmationModal';

export const InventoryModals = ({
  modals,
  closeModal,
  formData,
  selectedItem,
  handleInputChange,
  handleAddSubmit,
  handleUpdateSubmit,
  handleArchiveSubmit,
  executeUpdate,
  executeAddItem,
  setModals,
  executeArchive,
  archiveReason,
  setArchiveReason,
  archiveLogs,
  archivePage,
  setArchivePage
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);

  const handleCancelClick = (action) => {
    setPendingCloseAction(() => action);
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    if (pendingCloseAction) {
      pendingCloseAction();
    }
    setPendingCloseAction(null);
  };

  const handleCancelCancel = () => {
    setShowCancelConfirm(false);
    setPendingCloseAction(null);
  };

  const summaryBoxStyle = {
    textAlign: 'left',
    background: '#f9f9f9',
    padding: '15px',
    borderRadius: '10px',
    fontSize: '14px',
    marginBottom: '20px'
  };

  const paginatedArchiveLogs = archiveLogs.slice(
    (archivePage - 1) * 6,
    archivePage * 6
  );

  return (
    <>
      {(modals.add || modals.update) && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              &times;
            </button>

            <h2 style={{ color: styles.colors.darkGreen, marginTop: 0 }}>
              {modals.add ? 'Add New Item' : 'Update Item'}
            </h2>

            <form onSubmit={modals.add ? handleAddSubmit : handleUpdateSubmit}>
              <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Item Name<span style={{ color: '#D9534F' }}>*</span>
              </label>
              <input
                name="ItemName"
                style={styles.inputStyle}
                value={formData.ItemName}
                onChange={handleInputChange}
                required
              />

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Category<span style={{ color: '#D9534F' }}>*</span>
                  </label>
                  <select
                    name="Category"
                    style={styles.inputStyle}
                    value={formData.Category}
                    onChange={handleInputChange}
                  >
                    <option>Ingredients</option>
                    <option>Packaging</option>
                    <option>Equipment</option>
                    <option>Merchandise</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Unit Measurement<span style={{ color: '#D9534F' }}>*</span>
                  </label>
                  <select
                    name="UnitMeasurement"
                    style={{
                      ...styles.inputStyle,
                      opacity: modals.update ? 0.6 : 1,
                      cursor: modals.update ? 'not-allowed' : 'auto',
                      background: modals.update ? '#f5f5f5' : 'white'
                    }}
                    value={formData.UnitMeasurement}
                    onChange={handleInputChange}
                    disabled={modals.update}
                  >
                    <option value="grams">grams (g)</option>
                    <option value="kg">kilograms (kg)</option>
                    <option value="ml">milliliters (ml)</option>
                    <option value="L">liters (L)</option>
                    <option value="pcs">pieces (pcs)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Quantity<span style={{ color: '#D9534F' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="Quantity"
                    style={{
                      ...styles.inputStyle,
                      opacity: modals.update ? 0.6 : 1,
                      cursor: modals.update ? 'not-allowed' : 'auto',
                      background: modals.update ? '#f5f5f5' : 'white'
                    }}
                    value={formData.Quantity}
                    onChange={handleInputChange}
                    disabled={modals.update}
                    required
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Unit Price (₱)<span style={{ color: '#D9534F' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="UnitPrice"
                    style={{
                      ...styles.inputStyle,
                      opacity: modals.update ? 0.6 : 1,
                      cursor: modals.update ? 'not-allowed' : 'auto',
                      background: modals.update ? '#f5f5f5' : 'white'
                    }}
                    value={formData.UnitPrice}
                    onChange={handleInputChange}
                    disabled={modals.update}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Low Alert Threshold<span style={{ color: '#D9534F' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="ReorderThreshold"
                    style={styles.inputStyle}
                    value={formData.ReorderThreshold}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.labelStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Expiry Date<span style={{ color: '#D9534F' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="Expiry"
                    style={{
                      ...styles.inputStyle,
                      opacity: modals.update ? 0.6 : 1,
                      cursor: modals.update ? 'not-allowed' : 'auto',
                      background: modals.update ? '#f5f5f5' : 'white'
                    }}
                    value={formData.Expiry}
                    onChange={handleInputChange}
                    disabled={modals.update}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleCancelClick(closeModal)}
                  style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}
                >
                  {modals.add ? 'Next' : 'Save Changes'}
                </button>
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
              <p><b>Quantity:</b> {formData.Quantity} {formData.UnitMeasurement}</p>
              <p><b>Price:</b> ₱{parseFloat(formData.UnitPrice || 0).toFixed(2)}</p>
              <p style={{ color: styles.colors.green }}><b>Stock In:</b> Automatic (Now)</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={() => setModals(prev => ({ ...prev, confirmAdd: false, add: true }))}
                style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}
              >
                Edit
              </button>
              <button
                onClick={executeAddItem}
                style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}
              >
                Confirm & Add
              </button>
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
              <p><b>Quantity:</b> {formData.Quantity} {formData.UnitMeasurement}</p>
              <p><b>Low Alert Threshold:</b> {formData.ReorderThreshold}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={() => setModals(prev => ({ ...prev, confirmUpdate: false, update: true }))}
                style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}
              >
                Edit
              </button>
              <button
                onClick={executeUpdate}
                style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}
              >
                Confirm & Update
              </button>
            </div>
          </div>
        </div>
      )}

      {modals.archive && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ color: styles.colors.red }}>Archive Record</h2>
            <label style={styles.labelStyle}>Reason</label>
            <textarea
              style={{ ...styles.inputStyle, height: '80px' }}
              value={archiveReason}
              onChange={e => setArchiveReason(e.target.value)}
              placeholder="e.g. Discontinued product"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => handleCancelClick(closeModal)}
                style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveSubmit}
                style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {modals.confirmArchive && (
        <div style={{ ...styles.modalOverlay, zIndex: 1100 }}>
          <div style={{ ...styles.modalContent, width: '420px', textAlign: 'center' }}>
            <h2 style={{ color: styles.colors.darkGreen }}>Confirm Archive</h2>
            <div style={summaryBoxStyle}>
              <p><b>Name:</b> {selectedItem?.ItemName || formData.ItemName}</p>
              <p><b>Category:</b> {selectedItem?.Category || formData.Category}</p>
              <p><b>Quantity:</b> {selectedItem?.Quantity || formData.Quantity} {selectedItem?.UnitMeasurement || formData.UnitMeasurement}</p>
              <p><b>Reason:</b> {archiveReason}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={() => setModals(prev => ({ ...prev, confirmArchive: false, archive: true }))}
                style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}
              >
                Edit
              </button>
              <button
                onClick={executeArchive}
                style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}
              >
                Confirm & Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {modals.viewLog && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, width: '900px', maxWidth: '95vw' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}
            >
              <h2 style={{ color: styles.colors.blue, margin: 0 }}>Archive Log</h2>
              <button
                onClick={closeModal}
                style={{ ...styles.btnStyle, background: '#ccc', color: '#333' }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                border: '1px solid #eee',
                borderRadius: '10px',
                marginBottom: '15px',
                minHeight: '420px'
              }}
            >
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead style={{ background: styles.colors.blue, color: 'white' }}>
                  <tr>
                    <th style={{ padding: '10px' }}>User</th>
                    <th>Details & Reason</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {archiveLogs.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                        No logs found.
                      </td>
                    </tr>
                  ) : (
                    paginatedArchiveLogs.map(log => (
                      <tr key={log.InvArchiveID} style={{ borderBottom: '1px solid #eee', height: '40px' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>
                          {log.Employee?.User?.FirstName || 'System'}
                        </td>
                        <td>{log.Reason}</td>
                        <td>{new Date(log.ArchivedDate).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationControls
              total={archiveLogs.length}
              page={archivePage}
              setPage={setArchivePage}
              perPage={6}
            />
          </div>
        </div>
      )}

      <CancelConfirmationModal
        isOpen={showCancelConfirm}
        onConfirm={handleCancelConfirm}
        onCancel={handleCancelCancel}
        colors={styles.colors}
        btnStyle={styles.btnStyle}
      />
    </>
  );
};