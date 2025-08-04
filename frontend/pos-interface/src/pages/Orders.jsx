import React, { useState, useEffect } from "react";
import "./Orders.css";
import {
  fetchOrdersByStatus,
  updateOrderStatus,
  editOrder,
  updateOrderQuantities
} from "../api/ordersApi";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ON GOING"); // Changed default to "ON GOING"
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);


  // Fetch orders when filter changes
  useEffect(() => {
    const fetchOrders = async () => {
      if (filter === "ALL") {
        // Fetch all statuses when "ALL" is selected
        setLoading(true);
        try {
          const [onGoing, completed, cancelled] = await Promise.all([
            fetchOrdersByStatus("ON GOING"),
            fetchOrdersByStatus("COMPLETED"),
            fetchOrdersByStatus("CANCELLED")
          ]);
          
          setOrders([...onGoing, ...completed, ...cancelled]);
        } catch (err) {
          console.error("❌ Failed to fetch orders:", err);
          setOrders([]);
        } finally {
          setLoading(false);
        }
      } else {
        // Fetch specific status
        setLoading(true);
        try {
          const fetchedOrders = await fetchOrdersByStatus(filter);
          setOrders(fetchedOrders);
        } catch (err) {
          console.error("❌ Failed to fetch orders:", err);
          setOrders([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOrders();
  }, [filter]); // Re-fetch whenever filter changes

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
      );
    } catch (err) {
      console.error("❌ Failed to update status:", err);
    }
  };

  const handleEditOrder = async (updatedOrder) => {
    try {
      const orderId = updatedOrder.orderId || updatedOrder.id;
      if (!orderId) {
        throw new Error("❌ Missing orderId for update");
      }

      const transformedItems = editItems.map((item, index) => {
        const orderItemId = item.orderItemId || item.originalId;
        if (!orderItemId) {
          throw new Error(`❌ Missing orderItemId in item ${index}`);
        }

        return {
          orderItemId,
          quantity: item.quantity ?? 1,
        };
      });

      console.log("📡 Sending updated quantities to API:", transformedItems);

      const updated = await updateOrderQuantities(orderId, transformedItems);

      // ✅ FIXED: Only update the specific order by its exact ID
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          // Use strict equality and only match the exact order being edited
          if (order.id === orderId || order.orderId === orderId) {
            return {
              ...order,
              ...updated,
              items: [...editItems], // ✅ Create a new array to avoid reference issues
              totalAmount: calculateOrderTotal(editItems),
              total: calculateOrderTotal(editItems)
            };
          }
          return order; // ✅ Return unchanged order (no mutation)
        })
      );

      console.log("✅ Order quantities updated successfully");
    } catch (err) {
      console.error("❌ Failed to update order quantities:", err);
    }
  };

  // Remove this line since we're fetching based on filter now
  // const filteredOrders = filter === "ALL" ? orders : orders.filter((order) => order.status === filter);
  const filteredOrders = orders; // Orders are already filtered by the API call

  const formatTime = (iso) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getItemProperties = (item) => ({
    name: item.product?.name || item.name || 'Unknown Item',
    price: item.unitPrice || item.price || 0,
    quantity: item.quantity || 0,
    originalId: item.orderItemId || item.id,
    orderItemId: item.orderItemId || item.originalId || item.id,
    productId: item.product?.id || item.productId || item.id
  });

  const calculateOrderTotal = (items) => {
    return items.reduce((acc, item) => {
      const itemProps = getItemProperties(item);
      return acc + (itemProps.price * itemProps.quantity);
    }, 0);
  };

  const handleEdit = (order) => {
    console.log('🔧 Editing order:', order);
    console.log('🔧 Original items:', order.items);
    
    // ✅ FIXED: Use the exact order ID for comparison
    const orderIdToEdit = order.id || order.orderId;
    setEditingOrderId(orderIdToEdit);
    
    // ✅ FIXED: Create a deep copy to avoid reference issues
    const itemsCopy = (order.items || []).map((item) => ({
      ...getItemProperties(item) // Spread to create new object
    }));
    
    console.log('🔧 Transformed edit items:', itemsCopy);
    setEditItems(itemsCopy);
  };

  const handleItemChange = (index, field, value) => {
    setEditItems((prev) => {
      const updated = [...prev];
      updated[index][field] = field === "quantity" ? parseInt(value) || 0 : value;
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (order) => {
    console.log('💾 Saving order:', order);
    console.log('💾 Edit items:', editItems);
    
    const total = calculateOrderTotal(editItems);
    
    const updatedOrder = {
      ...order,
      id: order.orderId || order.id,
      items: [...editItems], // ✅ Create new array to avoid reference issues
      totalAmount: total,
      total: total,
    };
    
    console.log('💾 Final updated order:', updatedOrder);
    handleEditOrder(updatedOrder);
    
    // ✅ FIXED: Clear editing state immediately after save
    setEditingOrderId(null);
    setEditItems([]);
  };

  const handleCancel = () => {
    setEditingOrderId(null);
    setEditItems([]);
  };

  return (
    <div className="orders-page">
      <h2 className="orders-heading">📋 Orders</h2>

      <div className="order-filters">
        {["ALL", "ON GOING", "COMPLETED", "CANCELLED"].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? "active-filter" : ""}`}
            onClick={() => setFilter(status)}
            disabled={loading}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="loading">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="no-orders">No orders in this category.</p>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order, index) => {
            const orderId = order.id || order.orderId;
            const isEditing = editingOrderId === orderId;
            const orderItems = order.items || [];

            return (
              <div
                key={order.id}
                className={`order-card ${order.status !== "ON GOING" ? "order-disabled" : ""}`}
              >
                <div className="order-top">
                  <div>
                    <h3>Order #{index + 1}</h3>
                    <p className="order-id">Placed at {formatTime(order.createdAt)}</p>
                  </div>
                  <span className={`status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>

                <div className="order-items">
                  {isEditing
                    ? editItems.map((item, i) => (
                        <div key={`edit-${item.originalId}-${i}`} className="item-row">
                          <input type="text" value={item.name} disabled />
                          <input
                            type="number"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                          />
                          <span>{(item.price * item.quantity).toFixed(2)} DH</span>
                          <button onClick={() => handleRemoveItem(i)} className="remove-btn">
                            ❌
                          </button>
                        </div>
                      ))
                    : orderItems.map((item, i) => {
                        const itemProps = getItemProperties(item);
                        return (
                          <div key={`view-${item.orderItemId || item.id}-${i}`} className="item-row">
                            <span>{itemProps.name}</span>
                            <span>x{itemProps.quantity}</span>
                            <span>{(itemProps.price * itemProps.quantity).toFixed(2)} DH</span>
                          </div>
                        );
                      })
                  }
                </div>

                <div className="order-bottom">
                  <div className="total">
                    Total:  
                     {isEditing
                      ? calculateOrderTotal(editItems).toFixed(2)
                      : calculateOrderTotal(orderItems).toFixed(2)
                    } DH
                  </div>

                  <div className="order-actions">
                    {order.status === "ON GOING" && (
                      isEditing ? (
                        <>
                          <button className="complete-btn" onClick={() => handleSave(order)}>💾 Save</button>
                          <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => {
                            setSelectedOrder(order);
                            const total = calculateOrderTotal(order.items || []);
                            setCashAmount(total); // Default to full cash
                            setCardAmount(0);
                            setShowPaymentModal(true);
                          }}
                          className="complete-btn">
                            ✅ Complete
                          </button>
                          <button onClick={() => handleStatusUpdate(order.id || order.orderId, "CANCELLED")} className="cancel-btn">
                            ❌ Cancel
                          </button>
                          <button onClick={() => handleEdit(order)} className="edit-btn">✏️ Edit</button>
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showPaymentModal && selectedOrder && (
  <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
    <div className="payment-modal" onClick={e => e.stopPropagation()}>
      <div className="payment-modal-header">
        <h3>💳 Process Payment</h3>
        <div className="payment-order-number">Order #{selectedOrder.id}</div>
        <button 
          className="payment-close-btn" 
          onClick={() => setShowPaymentModal(false)}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="payment-modal-body">
        {/* Order Summary - Top Section */}
        <div className="payment-order-summary">
          <div className="summary-header">
            <h4>🧾 Order Summary</h4>
            <div className="order-total-display">
              {calculateOrderTotal(selectedOrder.items || []).toFixed(2)} DH
            </div>
          </div>
          <div className="payment-items-grid">
            {(selectedOrder.items || []).map((item, i) => {
              const itemProps = getItemProperties(item);
              return (
                <div key={i} className="payment-summary-item">
                  <span className="payment-item-name">{itemProps.name}</span>
                  <span className="payment-item-details">
                    <span className="payment-item-qty">×{itemProps.quantity}</span>
                    <span className="payment-item-total">{(itemProps.price * itemProps.quantity).toFixed(2)} DH</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods - Main Section */}
        <div className="payment-methods-container">
          <h4>💳 Select Payment Method</h4>
          
          {/* Payment Buttons Row */}
          <div className="payment-type-buttons">
            <button 
              className={`payment-type-btn ${cashAmount > 0 && cardAmount === 0 ? 'active' : ''}`}
              onClick={() => {
                const total = calculateOrderTotal(selectedOrder.items || []);
                setCashAmount(total);
                setCardAmount(0);
              }}
            >
              <span className="payment-btn-icon">💵</span>
              <span>Cash Only</span>
            </button>
            
            <button 
              className={`payment-type-btn ${cardAmount > 0 && cashAmount === 0 ? 'active' : ''}`}
              onClick={() => {
                const total = calculateOrderTotal(selectedOrder.items || []);
                setCardAmount(total);
                setCashAmount(0);
              }}
            >
              <span className="payment-btn-icon">💳</span>
              <span>Card Only</span>
            </button>
            
            <button 
              className={`payment-type-btn ${cashAmount > 0 && cardAmount > 0 ? 'active' : ''}`}
              onClick={() => {
                const total = calculateOrderTotal(selectedOrder.items || []);
                setCashAmount(total / 2);
                setCardAmount(total / 2);
              }}
            >
              <span className="payment-btn-icon">🔄</span>
              <span>Split Payment</span>
            </button>
          </div>

          {/* Amount Input Section */}
          <div className="payment-amounts-section">
            <div className="payment-amounts-grid">
              {/* Cash Input */}
              <div className={`payment-input-card ${cashAmount > 0 ? 'active' : 'inactive'}`}>
                <div className="payment-card-header">
                  <span className="payment-card-icon">💵</span>
                  <span className="payment-card-title">Cash Amount</span>
                </div>
                <div className="payment-input-wrapper">
                  <span className="payment-input-currency">DH</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashAmount || ''}
                    onChange={(e) => {
                      const value = Math.max(0, Number(e.target.value) || 0);
                      setCashAmount(value);
                      const total = calculateOrderTotal(selectedOrder.items || []);
                      const remaining = Math.max(0, total - value);
                      setCardAmount(remaining);
                    }}
                    placeholder="0.00"
                    className="payment-amount-field"
                  />
                </div>
              </div>

              {/* Card Input */}
              <div className={`payment-input-card ${cardAmount > 0 ? 'active' : 'inactive'}`}>
                <div className="payment-card-header">
                  <span className="payment-card-icon">💳</span>
                  <span className="payment-card-title">Card Amount</span>
                </div>
                <div className="payment-input-wrapper">
                  <span className="payment-input-currency">DH</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardAmount || ''}
                    onChange={(e) => {
                      const value = Math.max(0, Number(e.target.value) || 0);
                      setCardAmount(value);
                      const total = calculateOrderTotal(selectedOrder.items || []);
                      const remaining = Math.max(0, total - value);
                      setCashAmount(remaining);
                    }}
                    placeholder="0.00"
                    className="payment-amount-field"
                  />
                </div>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Footer Actions */}
      <div className="payment-modal-footer">
        <button 
          className="payment-cancel-btn" 
          onClick={() => setShowPaymentModal(false)}
        >
          Cancel
        </button>
        
        <button 
          className="payment-clear-btn"
          onClick={() => {
            setCashAmount(0);
            setCardAmount(0);
          }}
        >
          Clear Amounts
        </button>
        
        <button
          className={`payment-complete-btn ${
            (cashAmount + cardAmount) !== calculateOrderTotal(selectedOrder.items || [])
              ? 'payment-disabled'
              : ''
          }`}
          disabled={(cashAmount + cardAmount) !== calculateOrderTotal(selectedOrder.items || [])}
          onClick={async () => {
            const total = calculateOrderTotal(selectedOrder.items || []);
            const paid = cashAmount + cardAmount;

            if (paid !== total) return;

            try {
              const paymentMethods = [];
              if (cashAmount > 0) paymentMethods.push({ method: "CASH", amount: cashAmount });
              if (cardAmount > 0) paymentMethods.push({ method: "CARD", amount: cardAmount });

              await fetch("http://localhost:8080/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: selectedOrder.id || selectedOrder.orderId,
                  payments: paymentMethods,
                }),
              });

              await handleStatusUpdate(selectedOrder.id || selectedOrder.orderId, "COMPLETED");

              setShowPaymentModal(false);
              setSelectedOrder(null);
              setCashAmount(0);
              setCardAmount(0);
            } catch (err) {
              console.error("❌ Payment failed:", err);
              alert("Payment failed. Please try again.");
            }
          }}
        >
          {(cashAmount + cardAmount) === calculateOrderTotal(selectedOrder.items || [])
            ? `Complete Payment - ${(cashAmount + cardAmount).toFixed(2)} DH`
            : `Enter Correct Amount`
          }
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Orders;