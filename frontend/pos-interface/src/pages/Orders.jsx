import React, { useState, useEffect } from "react";
import "./Orders.css";
import {
  fetchOrdersByStatus,
  updateOrderStatus,
  editOrder,
  completeOrder, 
  updateOrderQuantities
} from "../api/ordersApi";
import Toast from "../components/Toast/Toast";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ON GOING");
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);

  const [showClientModal, setShowClientModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [orderToLinkClient, setOrderToLinkClient] = useState(null);

  const [isSubscriptionFlow, setIsSubscriptionFlow] = useState(false);
  const [message, setMessage] = useState("");

  // Toast auto-dismiss
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 2500);
    return () => clearTimeout(t);
  }, [message]);

  // Load clients only when the client modal opens
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/clients");
        const data = await res.json();
        setClients(data);
      } catch (err) {
        console.error("❌ Failed to load clients:", err);
        setMessage("Failed to load clients.");
      }
    };
    if (showClientModal) loadClients();
  }, [showClientModal]);

  // Fetch orders when filter changes
  useEffect(() => {
    const fetchOrders = async () => {
      if (filter === "ALL") {
        setLoading(true);
        try {
          const [onGoing, pending, completed, cancelled] = await Promise.all([
            fetchOrdersByStatus("ON GOING"),
            fetchOrdersByStatus("PENDING_PAYMENT"),
            fetchOrdersByStatus("COMPLETED"),
            fetchOrdersByStatus("CANCELLED"),
          ]);
          setOrders([...onGoing, ...pending, ...completed, ...cancelled]);
        } catch (err) {
          console.error("❌ Failed to fetch orders:", err);
          setOrders([]);
        } finally {
          setLoading(false);
        }
      } else {
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
  }, [filter]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders(prev =>
        prev.map(o => (o.id === updated.id || o.orderId === updated.id ? { ...o, status: updated.status } : o))
      );
    } catch (err) {
      console.error("❌ Failed to update status:", err);
      setMessage("Failed to update status.");
    }
  };

  const getItemProperties = (item) => ({
    name: item.product?.name || item.name || "Unknown Item",
    price: item.unitPrice || item.price || 0,
    quantity: item.quantity || 0,
    originalId: item.orderItemId || item.id,
    orderItemId: item.orderItemId || item.originalId || item.id,
    productId: item.product?.id || item.productId || item.id,
  });

  const calculateOrderTotal = (items) =>
    (items || []).reduce((acc, item) => {
      const p = getItemProperties(item);
      return acc + (p.price * p.quantity);
    }, 0);

  const handleEdit = (order) => {
    const orderIdToEdit = order.id || order.orderId;
    setEditingOrderId(orderIdToEdit);
    const itemsCopy = (order.items || []).map((item) => ({ ...getItemProperties(item) }));
    setEditItems(itemsCopy);
  };

  const handleItemChange = (index, field, value) => {
    setEditItems(prev => {
      const updated = [...prev];
      updated[index][field] = field === "quantity" ? parseInt(value) || 0 : value;
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditOrder = async (updatedOrder) => {
    try {
      const orderId = updatedOrder.orderId || updatedOrder.id;
      if (!orderId) throw new Error("❌ Missing orderId for update");

      const transformedItems = editItems.map((item, index) => {
        const orderItemId = item.orderItemId || item.originalId;
        if (!orderItemId) throw new Error(`❌ Missing orderItemId in item ${index}`);
        return { orderItemId, quantity: item.quantity ?? 1 };
      });

      const updated = await updateOrderQuantities(orderId, transformedItems);

      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.id === orderId || order.orderId === orderId) {
            return {
              ...order,
              ...updated,
              items: [...editItems],
              totalAmount: calculateOrderTotal(editItems),
              total: calculateOrderTotal(editItems),
            };
          }
          return order;
        })
      );

      setMessage("Order updated.");
    } catch (err) {
      console.error("❌ Failed to update order quantities:", err);
      setMessage("Failed to update order.");
    }
  };

  const handleSave = (order) => {
    const total = calculateOrderTotal(editItems);
    const updatedOrder = {
      ...order,
      id: order.orderId || order.id,
      items: [...editItems],
      totalAmount: total,
      total: total,
    };
    handleEditOrder(updatedOrder);
    setEditingOrderId(null);
    setEditItems([]);
  };

  const handleCancel = () => {
    setEditingOrderId(null);
    setEditItems([]);
  };

  const formatTime = (iso) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredOrders = orders;

  return (
    <div className="orders-page">
      <h2 className="orders-heading">📋 Orders</h2>

      <div className="order-filters">
        {["ALL", "ON GOING", "PENDING_PAYMENT", "COMPLETED", "CANCELLED"].map((status) => (
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
                key={orderId}
                className={`order-card ${order.status !== "ON GOING" ? "order-disabled" : ""}`}
              >
                <div className="order-top">
                  <div>
                    <h3>Order #{index + 1}</h3>
                    <p className="order-id">Placed at {formatTime(order.createdAt)}</p>
                  </div>
                  <span className={`status ${String(order.status || "").toLowerCase().replace(/[\s_]+/g, "-")}`}>
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
                      })}
                </div>

                <div className="order-bottom">
                  <div className="total">
                    Total:{" "}
                    {isEditing
                      ? calculateOrderTotal(editItems).toFixed(2)
                      : calculateOrderTotal(orderItems).toFixed(2)}{" "}
                    DH
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
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              const total = calculateOrderTotal(order.items || []);
                              setCashAmount(total);
                              setCardAmount(0);
                              setShowPaymentModal(true);
                              setIsSubscriptionFlow(false); // reset on open
                            }}
                            className="complete-btn"
                          >
                            ✅ Complete
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id || order.orderId, "CANCELLED")}
                            className="cancel-btn"
                          >
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
        <div className="payment-modal-overlay" onClick={() => { setShowPaymentModal(false); setIsSubscriptionFlow(false); }}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>💳 Process Payment</h3>
              <div className="payment-order-number">Order #{selectedOrder.id || selectedOrder.orderId}</div>
              <button
                className="payment-close-btn"
                onClick={() => { setShowPaymentModal(false); setIsSubscriptionFlow(false); }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="payment-modal-body">
              {/* Order Summary */}
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

              {/* Payment Methods */}
              <div className="payment-methods-container">
                <h4>💳 Select Payment Method</h4>

                <div className="payment-type-buttons">
                  <button
                    className={`payment-type-btn ${cashAmount > 0 && cardAmount === 0 ? 'active' : ''}`}
                    onClick={() => {
                      const total = calculateOrderTotal(selectedOrder.items || []);
                      setCashAmount(total);
                      setCardAmount(0);
                      setIsSubscriptionFlow(false);
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
                      setIsSubscriptionFlow(false);
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
                      setIsSubscriptionFlow(false);
                    }}
                  >
                    <span className="payment-btn-icon">🔄</span>
                    <span>Split Payment</span>
                  </button>

                  <button
                    className={`payment-type-btn ${isSubscriptionFlow ? 'active' : ''}`}
                    onClick={() => {
                      setOrderToLinkClient(selectedOrder);
                      setShowClientModal(true);
                      setIsSubscriptionFlow(true);
                    }}
                  >
                    <span className="payment-btn-icon">📋</span>
                    <span>Subscription</span>
                  </button>
                </div>

                {/* Amount Inputs */}
                <div className="payment-amounts-section">
                  <div className="payment-amounts-grid">
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
                            setIsSubscriptionFlow(false);
                          }}
                          placeholder="0.00"
                          className="payment-amount-field"
                        />
                      </div>
                    </div>

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
                            setIsSubscriptionFlow(false);
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
                onClick={() => { setShowPaymentModal(false); setIsSubscriptionFlow(false); }}
              >
                Cancel
              </button>

              <button
                className="payment-clear-btn"
                onClick={() => {
                  setCashAmount(0);
                  setCardAmount(0);
                  setIsSubscriptionFlow(false);
                }}
              >
                Clear Amounts
              </button>

              <button
                className={`payment-complete-btn ${
                  ((cashAmount + cardAmount) !== calculateOrderTotal(selectedOrder.items || [])) || isSubscriptionFlow
                    ? 'payment-disabled'
                    : ''
                }`}
                disabled={((cashAmount + cardAmount) !== calculateOrderTotal(selectedOrder.items || [])) || isSubscriptionFlow}
                onClick={async () => {
                  const total = calculateOrderTotal(selectedOrder.items || []);
                  const paid = cashAmount + cardAmount;
                  if (paid !== total || isSubscriptionFlow) return;

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

                    const oid = selectedOrder.id || selectedOrder.orderId;
                    // completes order server-side AND frees the table
                    await completeOrder(oid);

                    // refresh orders under current filter so UI updates immediately
                    const refreshed = await fetchOrdersByStatus(filter);
                    setOrders(refreshed);

                    // notify any table screens to reload
                    window.dispatchEvent(new CustomEvent("tables:refresh"));

                    setShowPaymentModal(false);
                    setSelectedOrder(null);
                    setCashAmount(0);
                    setCardAmount(0);
                    setIsSubscriptionFlow(false);
                    setMessage("Payment completed.");
                  } catch (err) {
                    console.error("❌ Payment failed:", err);
                    setMessage("Payment failed. Please try again.");
                  }
                }}
              >
                {isSubscriptionFlow
                  ? "Subscription in progress"
                  : (cashAmount + cardAmount) === calculateOrderTotal(selectedOrder.items || [])
                    ? `Complete Payment - ${(cashAmount + cardAmount).toFixed(2)} DH`
                    : `Enter Correct Amount`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {showClientModal && orderToLinkClient && (
        <div className="modal-overlay" onClick={() => { setShowClientModal(false); setIsSubscriptionFlow(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Client for Subscription</h3>
            <ul className="client-list">
              {clients.map((client) => (
                <li
                  key={client.clientId}
                  className="client-item"
                  onClick={async () => {
                    try {
                      const orderId = orderToLinkClient.id || orderToLinkClient.orderId;

                      await fetch(`http://localhost:8080/api/orders/${orderId}/assign-client`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ clientId: client.clientId, subscription: true }),
                      });

                      setMessage(`Linked to ${client.firstName} ${client.lastName} (pending payment).`);

                      // Refresh list under current filter
                      const refreshed = await fetchOrdersByStatus(filter);
                      setOrders(refreshed);

                      setShowClientModal(false);
                      setOrderToLinkClient(null);
                      setShowPaymentModal(false);
                      setIsSubscriptionFlow(false);
                    } catch (err) {
                      console.error("❌ Failed to assign client", err);
                      setMessage("Subscription failed.");
                    }
                  }}
                >
                  {client.firstName} {client.lastName} (#{client.clientId})
                </li>
              ))}
            </ul>
            <button onClick={() => { setShowClientModal(false); setIsSubscriptionFlow(false); }}>Cancel</button>
          </div>
        </div>
      )}

      <Toast message={message} visible={!!message} />
    </div>
  );
};

export default Orders;
