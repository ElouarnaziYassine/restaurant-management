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
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
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
                            <span>${(itemProps.price * itemProps.quantity).toFixed(2)}</span>
                          </div>
                        );
                      })
                  }
                </div>

                <div className="order-bottom">
                  <div className="total">
                    Total: $
                    {isEditing
                      ? calculateOrderTotal(editItems).toFixed(2)
                      : calculateOrderTotal(orderItems).toFixed(2)
                    }
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
                          <button onClick={() => handleStatusUpdate(order.id || order.orderId, "COMPLETED")} className="complete-btn">
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
    </div>
  );
};

export default Orders;