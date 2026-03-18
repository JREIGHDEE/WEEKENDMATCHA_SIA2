import React from 'react'

export default function POSModals({ state, actions, ui, PaginationControls }) {
  const { colors, uiStyles, paginate } = ui;

  return (
    <>
      {/* SWEETNESS OPTIONS MODAL */}
      {state.showOptionsModal && state.selectedItemForOptions && (
        <div style={uiStyles.modalOverlay}>
            <div style={{background: "white", padding: "40px", borderRadius: "20px", width: "350px", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px"}}>
                <h2 style={{color: "#5a6955", margin: 0}}>Select Sweetness</h2>
                <div style={{fontSize: "18px", fontWeight: "bold"}}>{state.selectedItemForOptions.name}</div>
                
                <select style={{padding: "15px", fontSize: "16px", borderRadius: "10px", border: "1px solid #ccc", outline: "none"}} value={state.selectedSweetness} onChange={(e) => actions.setSelectedSweetness(e.target.value)}>
                    <option value="Balanced">Balanced</option>
                    <option value="Sweet">Sweet</option>
                    <option value="Umami">Umami</option>
                </select>

                <div style={{ maxHeight: "100px", overflowY: "auto", textAlign: "left", background: "#f9f9f9", padding: "10px", borderRadius: "10px" }}>
                    <label style={{fontSize: "12px", fontWeight: "bold", color: "#666", display: "block", marginBottom: "5px"}}>Recipe & Stock Check</label>
                {state.selectedItemForOptions.recipe && state.selectedItemForOptions.recipe.length > 0 ? (
                    state.selectedItemForOptions.recipe.map((recipeItem, i) => {
                        const invDetail = state.inventory.find(inv => inv.InventoryID === recipeItem.id);
                        const isExpired = invDetail?.Expiry ? new Date(invDetail.Expiry) <= new Date() : false;
                        const stockLeft = invDetail ? invDetail.Quantity : 0;
                        const isLow = stockLeft < 10 && !isExpired; 
                        return (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px", color: isExpired ? "red" : (isLow ? "#E5C546" : "#333"), fontWeight: isExpired ? "bold" : "normal" }}>
                                <span style={{fontWeight: "bold"}}>{recipeItem.name}</span>
                                <span>{stockLeft} {invDetail?.UnitMeasurement || 'units'} left <span style={{fontWeight: "bold", marginLeft: "5px"}}>({isExpired ? "EXPIRED" : (isLow ? "LOW" : "OK")})</span></span>
                            </div>
                        );
                    })
                ) : (<span style={{ fontSize: "11px", fontStyle: "italic", color: "#999" }}>No recipe defined.</span>)}
                </div>

                <div style={{display: "flex", gap: "10px"}}>
                    <button onClick={() => actions.setShowOptionsModal(false)} style={{flex: 1, padding: "12px", background: "#ccc", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer"}}>Cancel</button>
                    <button onClick={actions.confirmAddToCart} style={{flex: 1, padding: "12px", background: "#5a6955", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer"}}>Add to Cart</button>
                </div>
            </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {state.showPaymentModal && (
        <div style={uiStyles.modalOverlay}>
            <div style={uiStyles.modalContent}>
                <h2 style={{ textAlign: "center", color: "#6B7C65", marginTop: 0, fontSize: "24px" }}>Process Payment</h2>
                <div><label style={{fontWeight: "bold", fontSize: "14px"}}>Name of Customer</label><input style={uiStyles.inputStyle} value={state.customerName} onChange={(e) => actions.setCustomerName(e.target.value)} /></div>
                <div>
                    <label style={{fontWeight: "bold", fontSize: "14px"}}>Total Amount</label>
                    <div style={{ ...uiStyles.inputStyle, background: "#f0f0f0", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
                        {state.isDiscounted && <span style={{ textDecoration: "line-through", color: "#ccc", fontSize: "14px" }}>₱{actions.getSubtotal().toFixed(2)}</span>}
                        <span style={{ color: state.isDiscounted ? "red" : "black", fontSize: "18px" }}>₱{actions.getFinalTotal().toFixed(2)}</span>
                    </div>
                    <div style={{ marginTop: "5px", fontSize: "12px", fontStyle: "italic", display: "flex", alignItems: "center" }}>
                        Apply Discount for Senior Citizen and PWD (20%) <input type="checkbox" checked={state.isDiscounted} onChange={(e) => actions.setIsDiscounted(e.target.checked)} style={{ marginLeft: "5px", transform: "scale(1.2)" }} />
                    </div>
                </div>
                <div><label style={{fontWeight: "bold", fontSize: "14px"}}>Cash Received</label><input type="number" style={uiStyles.inputStyle} value={state.cashReceived} onChange={(e) => actions.setCashReceived(e.target.value)} placeholder="₱0.00" /></div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>Change :</div>
                    {actions.getChange() < 0 ? <div style={{ color: colors.blueText, fontWeight: "bold", fontSize: "18px" }}>Insufficient Amount</div> : <div style={{ color: "black", fontWeight: "bold", fontSize: "18px" }}>₱{actions.getChange().toFixed(2)}</div>}
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button onClick={() => actions.setShowPaymentModal(false)} style={{ flex: 1, padding: "12px", background: colors.redBtn, color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>Cancel Order</button>
                    <button onClick={actions.handleConfirmPayment} disabled={actions.getChange() < 0} style={{ flex: 1, padding: "12px", background: actions.getChange() < 0 ? "#ccc" : colors.darkBtn, color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: actions.getChange() < 0 ? "default" : "pointer" }}>Confirm</button>
                </div>
            </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {state.showReceiptModal && (
        <div style={uiStyles.modalOverlay}>
            <div style={{background: "white", padding: "40px", borderRadius: "20px", width: "350px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.4)"}}>
                <h3 style={{margin: "0 0 5px 0", fontSize: "18px", fontWeight: "bold"}}>WeekendMatcha</h3>
                <p style={{fontSize: "12px", color: "#666", margin: "0 0 15px 0"}}>Emerald St., Marfori Heights Subd., Davao City<br/>{new Date().toLocaleString()}</p>
                <hr style={{borderTop: "1px solid #333", borderBottom: "none", margin: "10px 0"}} />
                <div style={{textAlign: "right", fontSize: "12px", color: "#555", marginBottom: "5px"}}>Cashier: {state.currentUser?.User?.FirstName}</div>
                <div style={{textAlign: "right", fontSize: "12px", color: "#555", marginBottom: "5px"}}>Customer: {state.customerName}</div>
                <div style={{textAlign: "right", fontSize: "12px", color: "#555", marginBottom: "15px"}}>Order ID: {state.currentOrderId}</div>
                <hr style={{borderTop: "1px solid #333", borderBottom: "none", margin: "10px 0"}} />
                <div style={{textAlign: "left", marginBottom: "15px"}}>
                    <div style={{display:"flex", justifyContent:"space-between", fontWeight:"bold", fontSize:"12px", marginBottom:"5px"}}><span>Item</span><span>Price</span></div>
                    {state.cart.map((item, i) => (
                        <div key={i} style={{marginBottom:"5px"}}>
                            <div style={{display:"flex", justifyContent:"space-between", fontSize:"12px"}}>
                                <span>{item.qty}x {item.name}</span>
                                <span>₱{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                            <div style={{fontSize:"10px", color:"#666", fontStyle:"italic", paddingLeft: "10px"}}>- {item.sweetness}</div>
                        </div>
                    ))}
                </div>
                <hr style={{borderTop: "1px solid #333", borderBottom: "none", margin: "10px 0"}} />
                {state.isDiscounted && <div style={{display:"flex", justifyContent:"space-between", fontSize:"12px", color: colors.discountRed, fontStyle:"italic", marginBottom:"5px"}}><span>Discount Applied</span><span>-₱{actions.getDiscountAmount().toFixed(2)}</span></div>}
                <div style={{display:"flex", justifyContent:"space-between", fontWeight:"bold", fontSize:"16px", marginBottom:"5px"}}><span>Total:</span><span>₱{actions.getFinalTotal().toFixed(2)}</span></div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"2px"}}><span>Cash Paid:</span><span>₱{parseFloat(state.cashReceived).toFixed(2)}</span></div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"20px"}}><span>Change:</span><span>₱{actions.getChange().toFixed(2)}</span></div>
                <p style={{fontSize: "12px", color: "#666", marginTop: "10px", fontStyle:"italic"}}>Thank you for your purchase!</p>
                <div style={{ marginTop: "20px" }}>
                    {!state.receiptPrinted ? (
                        <button onClick={actions.handlePrintReceipt} style={{ width: "100%", padding: "12px", background: "#FF6B6B", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", marginBottom: "10px" }}>Print Receipt</button>
                    ) : (
                        <button onClick={actions.handleCloseReceipt} style={{ width: "100%", padding: "12px", background: "#538D4E", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>Close & Start New Order</button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* STATUS & COMPLETION MODALS */}
      {state.showStatusModal && (
        <div style={uiStyles.modalOverlay}>
            <div style={{background: "white", padding: "40px", borderRadius: "25px", width: "320px", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"}}>
                <h3 style={{color:"#5a6955", margin: "0 0 10px 0", fontSize: "22px"}}>Choose Order Status</h3>
                <button onClick={() => actions.updateStatus('COMPLETED')} style={{ width: "220px", padding: "15px", background: colors.statusGreen, color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>COMPLETED</button>
                <button onClick={() => actions.updateStatus('IN PROGRESS')} style={{ width: "220px", padding: "15px", background: colors.statusYellow, color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>IN PROGRESS</button>
                <button onClick={() => actions.updateStatus('NOT IN PROGRESS')} style={{ width: "220px", padding: "15px", background: colors.statusRed, color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>NOT IN PROGRESS</button>
                <button onClick={() => actions.setShowStatusModal(false)} style={{ marginTop: "10px", background: "none", border: "none", color: "#999", cursor: "pointer", textDecoration: "underline" }}>Cancel</button>
            </div>
        </div>
      )}

      {state.showCompleteConfirm && (
        <div style={uiStyles.modalOverlay}>
            <div style={{background: "white", padding: "40px", borderRadius: "25px", width: "350px", textAlign: "center", display: "flex", flexDirection: "column", gap: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"}}>
                <h2 style={{color:"#5a6955", margin:0, fontSize: "24px", textAlign: "left"}}>Complete Order?</h2>
                <p style={{fontSize:"14px", color:"#666", lineHeight: "1.5", textAlign: "left"}}>Are you sure you want to complete this order? This action cannot be undone.<br/>Please review the details before continuing.</p>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px", gap: "20px" }}>
                    <button onClick={() => actions.setShowCompleteConfirm(false)} style={{ background: "none", border: "none", color: colors.redBtn, fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
                    <button onClick={actions.confirmCompletion} style={{ background: "none", border: "none", color: colors.darkBtn, fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Confirm</button>
                </div>
            </div>
        </div>
      )}

      {/* ADMIN LOGIN */}
      {state.showAdminLogin && (
        <div style={uiStyles.modalOverlay}>
            <div style={{background: "#4A5D4B", padding: "40px", borderRadius: "15px", width: "400px", display: "flex", flexDirection: "column", gap: "20px", color: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"}}>
                <h2 style={{textAlign: "center", marginTop: 0}}>Admin Login</h2>
                <div><label style={{fontSize: "14px", fontWeight: "bold"}}>Email (Admin):</label><input style={{...uiStyles.inputStyle, marginTop: "5px"}} value={state.adminUser} onChange={e => actions.setAdminUser(e.target.value)} /></div>
                <div><label style={{fontSize: "14px", fontWeight: "bold"}}>Password:</label><input type="password" style={{...uiStyles.inputStyle, marginTop: "5px"}} value={state.adminPass} onChange={e => actions.setAdminPass(e.target.value)} /></div>
                <button onClick={actions.handleAdminLoginSubmit} style={{background: "#6B7C65", color: "white", padding: "12px", border: "1px solid white", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", marginTop: "10px"}}>LOG IN</button>
                <button onClick={() => actions.setShowAdminLogin(false)} style={{background: "transparent", color: "white", border: "none", textDecoration: "underline", cursor: "pointer"}}>Cancel</button>
            </div>
        </div>
      )}

      {/* MANAGE MENU */}
      {state.showManageMenu && (
        <div style={uiStyles.modalOverlay}>
            <div style={{background: "white", padding: "30px", borderRadius: "20px", width: "900px", height: "700px", display: "flex", flexDirection: "column", boxShadow: "0 10px 40px rgba(0,0,0,0.2)"}}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
                    <h1 style={{color: "#5a6955", margin: 0, fontSize: "28px"}}>{state.isEditing ? "Edit Item" : "Manage Menu"}</h1>
                    <button onClick={() => { actions.setShowManageMenu(false); actions.resetForm(); }} style={{background: "transparent", border: "none", fontSize: "20px", fontWeight: "bold", cursor: "pointer", color: "#999"}}>✕</button>
                </div>
                <div style={{display: "flex", gap: "40px", flex: 1, overflow: "hidden"}}>
                    <div style={{flex: 1, display: "flex", flexDirection: "column", gap: "10px", height: "100%", overflowY: "auto"}}>
                        <h3 style={{margin: "0 0 5px", color: "#333", fontSize: "16px"}}>{state.isEditing ? "Update Item Details" : "Add New Item"}</h3>
                        <div>
                            <label style={{fontWeight: "bold", fontSize: "13px", color: "#555"}}>Category</label>
                            <select style={{...uiStyles.inputStyle, padding: "8px", fontWeight: "normal", opacity: state.isEditing ? 0.6 : 1, cursor: state.isEditing ? 'not-allowed' : 'auto'}} disabled={state.isEditing} value={state.newItemCategory} onChange={e => actions.setNewItemCategory(e.target.value)}>
                                <option value="Flavor">Flavor</option><option value="Powder">Powder</option><option value="Add-on">Others</option>
                            </select>
                        </div>
                        <div><label style={{fontWeight: "bold", fontSize: "13px", color: "#555"}}>Product Name</label><input style={{...uiStyles.inputStyle, padding: "8px", fontWeight: "normal"}} value={state.newItemName} onChange={e => actions.setNewItemName(e.target.value)} /></div>
                        <div><label style={{fontWeight: "bold", fontSize: "13px", color: "#555"}}>Product Price</label><input type="number" style={{...uiStyles.inputStyle, padding: "8px", fontWeight: "normal"}} value={state.newItemPrice} onChange={e => actions.setNewItemPrice(e.target.value)} /></div>
                        
                        <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", margin: "5px 0"}}>
                            <div style={{width: "100px", height: "100px", border: "1px solid #333", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", fontSize: "12px", background: "#f9f9f9", overflow:"hidden"}}>
                                {state.previewUrl ? <img src={state.previewUrl} style={{width:"100%", height:"100%", objectFit:"cover"}} alt="preview"/> : "No Image\nSelected"}
                            </div>
                            <input type="file" accept="image/*" ref={state.fileInputRef} style={{display:"none"}} onChange={actions.handleImageUpload} />
                            <button onClick={() => state.fileInputRef.current.click()} style={{width: "100%", padding: "8px", border: "1px solid #333", background: "#f0f0f0", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: "bold"}}>Upload Image</button>
                        </div>

                        <div style={{border: "1px solid #eee", padding: "10px", borderRadius: "8px", background: "#fafafa"}}>
                            <label style={{fontWeight: "bold", fontSize: "13px", color: "#555", display: "block", marginBottom: "5px"}}>Recipe Ingredients</label>
                            <div style={{ display: "flex", gap: "5px" }}>
                                <select style={{ flex: 1, padding: "8px", border: state.selectedIngId && state.inventory.find(i => i.InventoryID === parseInt(state.selectedIngId))?.isExpired ? "2px solid red" : "1px solid #ccc", borderRadius: "5px" }} value={state.selectedIngId} onChange={e => actions.setSelectedIngId(e.target.value)}>
                                    <option value="">Select Ingredient</option>
                                    {state.inventory.map(ing => (<option key={ing.InventoryID} value={ing.InventoryID} disabled={ing.isExpired}>{ing.ItemName} {ing.isExpired ? "⚠️ EXPIRED" : ""}</option>))}
                                </select>
                                <input type="number" placeholder="Qty" style={{ width: "70px", padding: "8px", borderRadius: "5px", border: "1px solid #ccc", outline: "none" }} value={state.selectedIngAmount} onChange={(e) => actions.setSelectedIngAmount(e.target.value)} />
                                <button onClick={actions.handleAddIngredientToRecipe} style={{ padding: "8px 15px", background: "#5a6955", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>+</button>
                            </div>
                            <div style={{marginTop: "10px", maxHeight: "100px", overflowY: "auto"}}>
                                {state.newItemRecipe.map((r, idx) => (
                                    <div key={idx} style={{display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", borderBottom: "1px solid #eee", padding: "8px 0"}}>
                                        <span style={{color: "#333"}}>{r.name} <strong>({r.amount} {r.unit})</strong></span> 
                                        <button onClick={() => actions.removeIngredientFromRecipe(idx)} style={{color: "#FF6B6B", border: "none", background: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px"}}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{display: "flex", gap: "10px", marginTop: "10px"}}>
                            {state.isEditing && <button onClick={actions.resetForm} style={{flex:1, padding: "12px", background: "#999", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer"}}>CANCEL EDIT</button>}
                            <button onClick={actions.handleSaveItem} style={{flex:1, padding: "12px", background: "#607D8B", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", height: "50px"}}>{state.isEditing ? "UPDATE ITEM" : "ADD ITEM"}</button>
                        </div>
                    </div>

                    <div style={{flex: 1, borderLeft: "1px solid #ccc", paddingLeft: "40px", display: "flex", flexDirection: "column", height: "100%"}}>
                        <h3 style={{margin: "0 0 20px", color: "#333"}}>Current Menu Items</h3>
                        <div style={{flex: 1, overflowY: "auto", paddingRight: "10px"}}>
                            {state.menu.map(item => (
                                <div key={item.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eee"}}>
                                    <div style={{display: "flex", flexDirection: "column"}}><span style={{fontSize: "14px", color: "#333", fontWeight: "bold"}}>{item.name}</span><span style={{fontSize: "12px", color: "#666"}}>{item.category} - ₱{item.price.toFixed(2)}</span></div>
                                    <div style={{display: "flex", gap: "5px"}}>
                                        <button onClick={() => actions.handleEditPrep(item)} style={{ background: "#E5C546", color: "white", border: "none", borderRadius: "5px", width: "60px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Edit Item">Update</button>
                                        <button onClick={() => actions.handleDeleteItem(item.id)} style={{ background: "#FF6B6B", color: "white", border: "none", borderRadius: "5px", width: "60px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete Item">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* RECENT TRANSACTIONS */}
      {state.showRecentModal && (
        <div style={uiStyles.modalOverlay}>
            <div style={{ background: "white", padding: "20px", borderRadius: "20px", width: "800px", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", height: "70vh" }}>
                <h2 style={{ color: "#5a6955", textAlign: "center", margin: "10px 0 20px 0", fontSize: "28px" }}>Recent Transactions</h2>
                <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "#7E8E77", color: "white", position: "sticky", top: 0 }}>
                            <tr><th style={{ padding: "12px" }}>Name</th><th style={{ padding: "12px" }}>Transaction ID</th><th style={{ padding: "12px" }}>EmployeeID</th><th style={{ padding: "12px" }}>Total Amount</th><th style={{ padding: "12px" }}>Date/Time</th></tr>
                        </thead>
                        <tbody>
                            {state.completedOrders.length === 0 ? (<tr><td colSpan="5" style={{textAlign:"center", padding:"30px"}}>No completed transactions yet.</td></tr>) : (paginate(state.completedOrders, state.recentPage, state.recentPerPage).map(t => (
                                <tr key={t.id} style={{ borderBottom: "1px solid #ddd", textAlign: "center", height: "50px", fontSize: "14px" }}><td style={{ fontWeight: "bold" }}>{t.customer.toUpperCase()}</td><td>{t.id}</td><td>{t.employeeId}</td><td style={{ fontWeight: "bold" }}>₱{t.total.toFixed(2)}</td><td>{t.date}</td></tr>
                            )))}
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: "15px", textAlign: "right", color: "#32323278", fontSize: "16px" }}>Today's Total: <span style={{ fontWeight: "bold" }}>₱{state.completedOrders.reduce((sum, order) => sum + order.total, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                <div style={{marginTop: "10px"}}><PaginationControls total={state.completedOrders.length} page={state.recentPage} setPage={actions.setRecentPage} perPage={state.recentPerPage} /></div>
                <button onClick={() => actions.setShowRecentModal(false)} style={{ background: "#FF6B6B", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", width: "200px", alignSelf: "center", marginTop: "10px" }}>Close</button>
            </div>
        </div>
      )}
    </>
  )
}