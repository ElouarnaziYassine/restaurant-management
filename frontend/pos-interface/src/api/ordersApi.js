const API_URL = "http://localhost:8080/api/orders"; // or use proxy

// Fetch orders by status
export async function fetchOrdersByStatus(status) {
  const response = await fetch(`${API_URL}/status/${status}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch orders: ${errorText}`);
  }
  return response.json();
}

// CREATE ORDER - This was missing!
export async function createOrder(cartItems) {
  console.log("🛒 Creating order with cart items:", cartItems);
  
  const orderData = {
    userId: 2,
    status: "ON GOING",
    placedAt: new Date().toISOString(),
    total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    items: cartItems.map(item => ({
      productId: item.productId || item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      // Add any other fields your OrderItem entity needs
      // productId: item.productId, // if you have this field
      // modifier: item.modifier, // if you have this field
    }))
  };
  
  console.log("📦 Sending order data to backend:", orderData);
  console.log("🔍 Order payload:", JSON.stringify(orderData, null, 2));

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Order creation failed:", errorText);
    throw new Error(`Failed to create order: ${errorText}`);
  }
  
  const createdOrder = await response.json();
  console.log("✅ Order created successfully:", createdOrder);
  console.log("📋 Order items:", createdOrder.items);
  
  return createdOrder;
}

// Update order status


// Edit existing order
export const editOrder = async (order) => {
  const orderId = order.orderId || order.id;
  if (!orderId || !order.userId) {
    throw new Error("❌ Missing orderId or userId");
  }

  const payload = {
    orderId,
    userId: order.userId,
    description: order.description,
    status: order.status,
    totalAmount: order.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    items: order.items.map(item => ({
      orderItemId: item.orderItemId,
      quantity: item.quantity
    }))
  };

  const response = await fetch(`${API_URL}/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`❌ Failed to edit order: ${err}`);
  }

  return await response.json();
};

export async function updateOrderQuantities(orderId, updatedItems) {
  const response = await fetch(`http://localhost:8080/api/orders/${orderId}/quantities`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedItems),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Order Edit Error:", errorText);
    throw new Error("❌ Failed to update quantities");
  }

  return await response.json();
}

export async function updateOrderStatus(id, status) {
  const endpoint = status === "COMPLETED" ? "complete" : "cancel";
  const res = await fetch(`${API_URL}/${id}/${endpoint}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}