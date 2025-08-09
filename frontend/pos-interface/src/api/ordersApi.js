import axios from "axios";
const ORDERS_BASE = "http://localhost:8080/api/orders";

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
export async function createOrder(orderData) {
  const response = await fetch("http://localhost:8080/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create order: ${errorText}`);
  }

  return await response.json();
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

// clients orders
export const fetchOrdersByClient = (clientId, fromISO, toISO) => {
  const params = {};
  if (fromISO) params.from = fromISO;
  if (toISO) params.to = toISO;
  return axios.get(`${ORDERS_BASE}/client/${clientId}`, { params }).then(r => r.data);
};

export const fetchOrderById = async (orderId) => {
  const { data } = await axios.get(`${ORDERS_BASE}/${orderId}`);
  return data; // should include items[]
};