import React, { useEffect, useMemo, useState } from "react";
import { fetchAllClients } from "../api/clientApi";
import { fetchOrdersByClient, fetchOrderById } from "../api/ordersApi"; // NEW: fetchOrderById
import Toast from "../components/Toast/Toast";
import "./ClientsOrders.css";

const firstDayOfMonthISO = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return d.toISOString().slice(0, 10);
};
const lastDayOfMonthISO = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
};
const formatCurrency = (n) => `${(Number(n) || 0).toFixed(2)} DH`;

const ClientsOrders = () => {
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // NEW: Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerOrder, setDrawerOrder] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // auto-dismiss toast
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 2500);
    return () => clearTimeout(t);
  }, [message]);

  // load clients once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAllClients();
        setClients(res.data);
      } catch (e) {
        console.error(e);
        setMessage("Failed to load clients");
      }
    })();
  }, []);

  // fetch orders whenever selected client or month changes
  useEffect(() => {
    if (!selectedClient) return;
    const [yy, mm] = month.split("-");
    const baseDate = new Date(parseInt(yy), parseInt(mm) - 1, 1);
    const fromISO = firstDayOfMonthISO(baseDate);
    const toISO = lastDayOfMonthISO(baseDate);

    (async () => {
      setLoading(true);
      try {
        const data = await fetchOrdersByClient(selectedClient.clientId, fromISO, toISO);
        setOrders(data || []);
      } catch (e) {
        console.error(e);
        setOrders([]);
        setMessage("Failed to load orders for client.");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClient, month]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        String(c.clientId).includes(q)
    );
  }, [query, clients]);

  const totalForPeriod = useMemo(() => {
    return (orders || []).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [orders]);

  const exportCSV = () => {
    if (!selectedClient) return;
    const headers = ["OrderID,Date,Status,Total"];
    const rows = (orders || []).map((o) => {
      const id = o.id || o.orderId;
      const date = o.createdAt || "";
      const status = o.status || "";
      const total = o.totalAmount ?? 0;
      return `${id},${date},${status},${total}`;
    });
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const [yy, mm] = month.split("-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement_${selectedClient.firstName}_${selectedClient.lastName}_${yy}-${mm}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // NEW: normalize item fields (supports different shapes)
  const itemProps = (item) => ({
    name: item?.product?.name ?? item?.name ?? "Item",
    qty: Number(item?.quantity ?? 1),
    unit: Number(item?.unitPrice ?? item?.price ?? 0),
    subtotal: Number(item?.subtotal ?? ((item?.unitPrice ?? item?.price ?? 0) * (item?.quantity ?? 1))),
    id: item?.orderItemId ?? item?.id,
  });

  // NEW: open drawer (lazy-load items if missing)
  const openDrawer = async (order) => {
    const oid = order.id || order.orderId;
    setDrawerOrder(order);
    setDrawerOpen(true);

    if (order.items && order.items.length) return; // already have items

    try {
      setDrawerLoading(true);
      const full = await fetchOrderById(oid);
      const items = full?.items ?? [];
      // merge items into local orders state (so table can reuse later)
      setOrders((prev) =>
        prev.map((o) => ((o.id || o.orderId) === oid ? { ...o, items } : o))
      );
      setDrawerOrder((prev) => ({ ...prev, items }));
    } catch (e) {
      console.error(e);
      setMessage("Failed to load order items.");
    } finally {
      setDrawerLoading(false);
    }
  };

  // NEW: close drawer
  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setDrawerOrder(null), 200);
  };

  // NEW: close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && drawerOpen && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="cs-page">
      <div className="cs-sidebar">
        <div className="cs-sidebar-top">
          <h3>Clients</h3>
          <input
            placeholder="Search by name or #ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="cs-client-list">
          {filteredClients.map((c) => (
            <button
              key={c.clientId}
              className={`cs-client-row ${selectedClient?.clientId === c.clientId ? "active" : ""}`}
              onClick={() => setSelectedClient(c)}
              title={`#${c.clientId}`}
            >
              <span className="cs-client-name">
                {c.firstName} {c.lastName}
              </span>
              <span className="cs-client-id">#{c.clientId}</span>
            </button>
          ))}
          {filteredClients.length === 0 && <div className="cs-empty">No clients found</div>}
        </div>
      </div>

      <div className="cs-main">
        <div className="cs-header">
          <div className="cs-title">
            <h2>Client Orders</h2>
            {selectedClient && (
              <div className="cs-subtitle">
                #{selectedClient.clientId} — {selectedClient.firstName} {selectedClient.lastName}
              </div>
            )}
          </div>

          <div className="cs-controls">
            <label className="cs-month-picker">
              Month
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
            <button onClick={exportCSV} disabled={!selectedClient || orders.length === 0}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="cs-summary-cards">
          <div className="cs-card">
            <div className="cs-card-label">Total for Period</div>
            <div className="cs-card-value">{formatCurrency(totalForPeriod)}</div>
          </div>
          <div className="cs-card">
            <div className="cs-card-label">Orders</div>
            <div className="cs-card-value">{orders.length}</div>
          </div>
        </div>

        <div className="cs-table-wrap">
          {loading ? (
            <div className="cs-info">Loading orders…</div>
          ) : !selectedClient ? (
            <div className="cs-info">Select a client to view the statement.</div>
          ) : orders.length === 0 ? (
            <div className="cs-info">No orders for this month.</div>
          ) : (
            <table className="cs-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Items</th> {/* NEW */}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const oid = o.id || o.orderId;
                  return (
                    <tr key={oid}>
                      <td>{oid}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                      <td>
                        <span
                          className={`cs-status ${String(o.status || "")
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>{formatCurrency(o.totalAmount || 0)}</td>
                      <td>
                        <button className="cs-btn-outline" onClick={() => openDrawer(o)}>
                          View items
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <Toast message={message} visible={!!message} />
      </div>

      {/* =========================
          RIGHT-SIDE DRAWER (inline styles; no CSS changes needed)
         ========================= */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div className="cs-drawer-backdrop" onClick={closeDrawer} />


          {/* Drawer */}
          <aside role="dialog" aria-modal="true" className="cs-drawer">

            {/* Drawer Header */}
            <div className="cs-drawer-header">
              <div>
                <div className="cs-drawer-title">Order #{drawerOrder?.id || drawerOrder?.orderId}</div>
                <div className="cs-drawer-subtitle">
                  {drawerOrder?.createdAt ? new Date(drawerOrder.createdAt).toLocaleString() : ""}
                </div>
              </div>
              <button className="cs-drawer-close" onClick={closeDrawer} aria-label="Close"></button>
            </div>

            {/* Drawer Body */}
            <div className="cs-drawer-body">
              {drawerLoading ? (
                <div className="cs-info" style={{ margin: 0 }}>
                  Loading items…
                </div>
              ) : !drawerOrder?.items || drawerOrder.items.length === 0 ? (
                <div className="cs-info" style={{ margin: 0 }}>
                  No items found for this order.
                </div>
              ) : (
                <table className="cs-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: "55%" }}>Item</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drawerOrder.items.map((it, i) => {
                      const ip = itemProps(it);
                      return (
                        <tr key={ip.id || i}>
                          <td>{ip.name}</td>
                          <td>{ip.qty}</td>
                          <td>{formatCurrency(ip.unit)}</td>
                          <td>{formatCurrency(ip.subtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="cs-drawer-footer">

              <div style={{ color: "var(--cs-muted)", fontSize: 13 }}>
                Status:{" "}
                <span
                  className={`cs-status ${String(drawerOrder?.status || "")
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {drawerOrder?.status}
                </span>
              </div>
              <div style={{ fontWeight: 800 }}>
                Total: {formatCurrency(drawerOrder?.totalAmount || 0)}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default ClientsOrders;
