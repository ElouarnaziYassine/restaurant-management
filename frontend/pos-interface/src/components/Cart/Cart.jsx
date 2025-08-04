import React, { useState, useEffect } from "react";
import { createOrder } from "../../api/ordersApi";
import { fetchAvailableTables } from "../../api/tableApi";
import Toast from "../Toast/Toast";
import "./Cart.css";

const Cart = ({ cartItems, onUpdateQuantity, onRemoveItem, onOrderCreated }) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Defensive check
  const validCartItems = Array.isArray(cartItems) ? cartItems : [];

  useEffect(() => {
    const loadTables = async () => {
      try {
        const res = await fetchAvailableTables();
        setTables(res.data || []);
      } catch (err) {
        console.error("❌ Failed to load tables:", err);
        setMessage("Failed to fetch available tables.");
      }
    };
    loadTables();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const subtotal = validCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleProceed = async () => {
    if (validCartItems.length === 0) {
      setMessage("🛒 Cart is empty!");
      return;
    }
    if (!selectedTable) {
      setMessage("🪑 Please select a table.");
      return;
    }

    setIsCreatingOrder(true);

    try {
      const orderData = {
        userId: 2,
        status: "ON GOING",
        placedAt: new Date().toISOString(),
        total: subtotal,
        tableId: selectedTable,
        items: validCartItems.map((item) => ({
          productId: item.productId || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const createdOrder = await createOrder(orderData);
      setMessage("✅ Order placed successfully!");
      if (onOrderCreated) onOrderCreated(createdOrder);
    } catch (error) {
      console.error("❌ Order creation failed:", error);
      setMessage("❌ Failed to create order.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="cart">
      <Toast message={message} visible={!!message} />
      <h2>Cart</h2>

      <div className="cart-items">
        {validCartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
          </div>
        ) : (
          validCartItems.map((item) => (
            <div className="cart-item" key={item.id}>
              <div className="item-details">
                <div className="item-name">{item.name}</div>
                <div className="qty-controls">
                  <button onClick={() => onUpdateQuantity(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.id, 1)}>+</button>
                </div>
              </div>
              <div className="item-pricing">
                <span className="unit-price">{item.price.toFixed(2)} DH</span>
                <span className="line-total">
                  {(item.price * item.quantity).toFixed(2)} DH
                </span>
                <button className="remove-btn" onClick={() => onRemoveItem(item.id)}>
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="table-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="table-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Choose a Table</h3>
            <div className="table-grid">
              {tables.map((table) => (
                <button
                  key={table.tableId}
                  className={`table-card ${selectedTable == table.tableId ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedTable(table.tableId);
                    setShowModal(false);
                  }}
                >
                  <div>Table #{table.tableNumber}</div>
                  <div>Seats: {table.capacity}</div>
                </button>
              ))}
            </div>
            <button className="close-modal" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}

      {validCartItems.length > 0 && (
        <>
          <div className="cart-summary">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)} DH</span>
            </div>
            <div className="summary-line">
              <span>Tax (10%)</span>
              <span>{tax.toFixed(2)} DH</span>
            </div>
            <div className="summary-line total">
              <span>Total</span>
              <span>{total.toFixed(2)} DH</span>
            </div>
          </div>

          <div className="cart-actions">
            <button className="table-select-btn" onClick={() => setShowModal(true)}>
              {selectedTable
                ? `Table #${tables.find(t => t.tableId == selectedTable)?.tableNumber}`
                : "🪑 Select Table"}
            </button>
            <button
              className="proceed-btn"
              onClick={handleProceed}
              disabled={isCreatingOrder}
            >
              {isCreatingOrder ? "Creating Order..." : "Proceed"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
