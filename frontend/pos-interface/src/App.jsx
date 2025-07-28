import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar/Sidebar";
import Cart from "./components/Cart/Cart";
import Toast from "./components/Toast/Toast";
import Navbar from "./components/Navbar/Navbar";
import Orders from "./pages/Orders";
import CreateCategory from "./pages/CreateCategory";
import ProductPage from "./pages/ProductPage";
import CreateProductFamily from "./pages/CreateProductFamily";
import CreateProduct from "./pages/CreateProduct";
import "./App.css";

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const navigate = useNavigate();

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2000);
  };

const handleAddToCart = (product) => {
  const productId = product.productId || product.id; // Fallback support
  setCartItems((prev) => {
    const existing = prev.find((item) => (item.productId || item.id) === productId);
    if (existing) {
      return prev.map((item) =>
        (item.productId || item.id) === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      return [
        ...prev,
        {
          productId,       // ✅ Ensure this is preserved
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    }
  });

  showToast("Product added to cart");
};


  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    const removed = cartItems.find((item) => item.id === id);
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    if (removed) showToast(`"${removed.name}" removed from cart`);
  };

  const handleOrderCreated = (newOrder) => {
    setOrders((prev) => [...prev, newOrder]);
    setCartItems([]);
    showToast("Order placed!");
    navigate("/orders");
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleEditOrder = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  };

  return (
    <>
      <Navbar waiterName="Ahmed Ben" />
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <div className="page-content">
                  <div className="page-content-row">
                    <div className="product-side">
                      <ProductPage onAddToCart={handleAddToCart} />
                    </div>
                  </div>

                  <Toast message={toast.message} visible={toast.visible} />
                  <Cart
                    cartItems={cartItems}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                    onOrderCreated={handleOrderCreated} // ✅ use this instead of onProceed
                  />
                </div>
              }
            />
            <Route
              path="/orders"
              element={
                <div className="page-content">
                  <Orders
                    orders={orders}
                    onUpdateStatus={updateOrderStatus}
                    onEditOrder={handleEditOrder}
                  />
                </div>
              }
            />
            <Route path="/categories/new" element={<CreateCategory />} />
            <Route path="/families/new" element={<CreateProductFamily />} />
            <Route path="/products/new" element={<CreateProduct />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
