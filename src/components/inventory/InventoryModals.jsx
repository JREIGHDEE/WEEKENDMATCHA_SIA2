import React from 'react';
import * as styles from '../../constants/inventoryStyles';
import { PaginationControls } from '../PaginationControls';

export const InventoryModals = ({ 
  modals, closeModal, formData, handleInputChange, handleAddSubmit, 
  executeUpdate, executeAddItem, setModals, executeArchive, 
  archiveReason, setArchiveReason, archiveLogs, archivePage, setArchivePage 
}) => {
  return (
    <>
      {/* ADD / UPDATE MODAL */}
      {(modals.add || modals.update) && (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <button onClick={closeModal} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" }}>&times;</button>
                <h2 style={{ color: styles.colors.darkGreen, marginTop: 0 }}>{modals.add ? "Add New Item" : "Update Item"}</h2>
                <form onSubmit={modals.add ? handleAddSubmit : executeUpdate}>
                    
                    {/* Item Name - Editable in Update */}
                    <label style={styles.labelStyle}>Item Name</label>
                    <input 
                      name="ItemName" 
                      style={styles.inputStyle} 
                      value={formData.ItemName} 
                      onChange={handleInputChange} 
                      required 
                    />

                    <div style={{display:"flex", gap:"15px"}}>
                        {/* Category - Editable in Update */}
                        <div style={{flex:1}}>
                            <label style={styles.labelStyle}>Category</label>
                            <select name="Category" style={styles.inputStyle} value={formData.Category} onChange={handleInputChange}>
                                <option>Ingredients</option>
                                <option>Packaging</option>
                                <option>Equipment</option>
                                <option>Merchandise</option>
                            </select>
                        </div>

                        {/* Unit Measurement - DISABLED in Update */}
                        <div style={{flex:1}}>
                            <label style={styles.labelStyle}>Unit Measurement</label>
                            <select 
                                name="UnitMeasurement" 
                                style={{...styles.inputStyle, opacity: modals.update ? 0.6 : 1, cursor: modals.update ? 'not-allowed' : 'auto'}} 
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

                    <div style={{display:"flex", gap:"15px"}}>
                        {/* Quantity - Editable in Update */}
                        <div style={{flex:1}}>
                             <label style={styles.labelStyle}>Quantity</label>
                             <input type="number" step="0.01" name="Quantity" style={styles.inputStyle} value={formData.Quantity} onChange={handleInputChange} required />
                        </div>

                        {/* Unit Price - DISABLED in Update */}
                        <div style={{flex:1}}>
                             <label style={styles.labelStyle}>Unit Price (₱)</label>
                             <input 
                                type="number" 
                                step="0.01" 
                                name="UnitPrice" 
                                style={{...styles.inputStyle, opacity: modals.update ? 0.6 : 1, cursor: modals.update ? 'not-allowed' : 'auto'}} 
                                value={formData.UnitPrice} 
                                onChange={handleInputChange} 
                                disabled={modals.update}
                                required 
                             />
                        </div>
                    </div>

                    <div style={{display:"flex", gap:"15px"}}>
                        {/* Low Alert Threshold - Editable in Update */}
                        <div style={{flex:1}}>
                             <label style={styles.labelStyle}>Low Alert Threshold</label>
                             <input type="number" name="ReorderThreshold" style={styles.inputStyle} value={formData.ReorderThreshold} onChange={handleInputChange} required />
                        </div>

                        {/* Expiry Date - DISABLED in Update */}
                        <div style={{flex:1}}>
                             <label style={styles.labelStyle}>Expiry Date</label>
                             <input 
                                type="date" 
                                name="Expiry" 
                                style={{...styles.inputStyle, opacity: modals.update ? 0.6 : 1, cursor: modals.update ? 'not-allowed' : 'auto'}} 
                                value={formData.Expiry} 
                                onChange={handleInputChange} 
                                disabled={modals.update}
                                required 
                             />
                        </div>
                    </div>

                    <div style={{display:"flex", justifyContent:"flex-end", gap:"10px"}}>
                        <button type="button" onClick={closeModal} style={{...styles.btnStyle, background: "#ccc", color: "#333"}}>Cancel</button>
                        <button type="submit" style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}>{modals.add ? "Next" : "Save Changes"}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* CONFIRM ADD MODAL */}
      {modals.confirmAdd && (
        <div style={{ ...styles.modalOverlay, zIndex: 1100 }}>
            <div style={{ ...styles.modalContent, width: "400px", textAlign: "center" }}>
                <h2 style={{ color: styles.colors.darkGreen }}>Confirm Addition</h2>
                <div style={{textAlign:"left", background:"#f9f9f9", padding:"15px", borderRadius:"10px", fontSize:"14px", marginBottom:"20px"}}>
                    <p><b>Name:</b> {formData.ItemName}</p>
                    <p><b>Category:</b> {formData.Category}</p>
                    <p><b>Quantity:</b> {formData.Quantity} {formData.UnitMeasurement}</p>
                    <p><b>Price:</b> ₱{parseFloat(formData.UnitPrice || 0).toFixed(2)}</p>
                    <p style={{color: styles.colors.green}}><b>Stock In:</b> Automatic (Now)</p>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
                    <button onClick={() => setModals({ ...modals, confirmAdd: false, add: true })} style={{ ...styles.btnStyle, background: "#ccc", color: "#333" }}>Edit</button>
                    <button onClick={executeAddItem} style={{ ...styles.btnStyle, background: styles.colors.darkGreen }}>Confirm & Add</button>
                </div>
            </div>
        </div>
      )}

      {/* ARCHIVE MODAL */}
      {modals.archive && (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h2 style={{ color: styles.colors.red }}>Archive Item</h2>
                <p>Are you sure you want to remove this item?</p>
                <label style={styles.labelStyle}>Reason</label>
                <textarea style={{...styles.inputStyle, height:"80px"}} value={archiveReason} onChange={e => setArchiveReason(e.target.value)} placeholder="e.g. Discontinued product" />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button onClick={closeModal} style={{...styles.btnStyle, background: "#ccc", color: "#333"}}>Cancel</button>
                    <button onClick={executeArchive} style={{...styles.btnStyle, background: styles.colors.red}}>Confirm Archive</button>
                </div>
            </div>
        </div>
      )}

      {/* LOGS MODAL */}
      {modals.viewLog && (
        <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: "700px"}}>
                <h2 style={{ color: styles.colors.blue }}>Archive Log</h2>
                <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid #eee", borderRadius: "10px", marginBottom: "15px" }}>
                    <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                        <thead style={{ background: styles.colors.blue, color: "white", position: "sticky", top: 0 }}>
                            <tr><th style={{padding:"10px"}}>User</th><th>Details & Reason</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            {archiveLogs.length === 0 ? <tr><td colSpan="3" style={{textAlign:"center", padding:"20px"}}>No logs found.</td></tr> : 
                             archiveLogs.map(log => (
                                <tr key={log.InvArchiveID} style={{borderBottom:"1px solid #eee", height:"40px"}}>
                                    <td style={{padding:"10px", fontWeight:"bold"}}>{log.Employee?.User?.FirstName || 'System'}</td>
                                    <td>{log.Reason}</td>
                                    <td>{new Date(log.ArchivedDate).toLocaleDateString()}</td>
                                </tr>
                             ))
                            }
                        </tbody>
                    </table>
                </div>
                <PaginationControls total={archiveLogs.length} page={archivePage} setPage={setArchivePage} perPage={6} />
                <button onClick={closeModal} style={{...styles.btnStyle, background: "#ccc", color: "#333", float:"right", marginTop:"10px"}}>Close</button>
            </div>
        </div>
      )}
    </>
  );
};