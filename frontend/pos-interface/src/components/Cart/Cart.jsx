import React, { useState } from "react";
import { createOrder } from "../../api/ordersApi"; // Import the createOrder function
import "./Cart.css";

const Cart = ({ cartItems, onUpdateQuantity, onRemoveItem, onOrderCreated }) => {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleProceed = async () => {
    if (cartItems.length === 0) {
      alert("Cart is empty!");
      return;
    }

    setIsCreatingOrder(true);
    
    try {
      console.log("🛒 Creating order with cart items:", cartItems);
      
      // Create the order using the API
      const newOrder = await createOrder(cartItems);
      
      console.log("✅ Order created successfully:", newOrder);
      
      // Call the parent callback to handle successful order creation
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }
      
    } catch (error) {
      console.error("❌ Failed to create order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="cart">
      <h2>Cart</h2>
      <div className="cart-items">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
          </div>
        ) : (
          cartItems.map((item) => (
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
                <span className="unit-price">${item.price.toFixed(2)}</span>
                <span className="line-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                <button className="remove-btn" onClick={() => onRemoveItem(item.id)}>
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <>
          <div className="cart-summary">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-line total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="cart-actions">
            <button className="hold-btn">Hold Order</button>
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