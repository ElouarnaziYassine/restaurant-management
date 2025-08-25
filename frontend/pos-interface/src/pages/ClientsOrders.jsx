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

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerOrder, setDrawerOrder] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // NEW: Settle modal state
  const [showSettle, setShowSettle] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);

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

  // NEW: pending total for month (PENDING_PAYMENT)
  const pendingTotal = useMemo(() => {
    return (orders || [])
      .filter((o) => String(o.status || "").toUpperCase() === "PENDING_PAYMENT")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
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

  // normalize item fields (supports different shapes)
  const itemProps = (item) => ({
    name: item?.product?.name ?? item?.name ?? "Item",
    qty: Number(item?.quantity ?? 1),
    unit: Number(item?.unitPrice ?? item?.price ?? 0),
    subtotal: Number(
      item?.subtotal ?? (item?.unitPrice ?? item?.price ?? 0) * (item?.quantity ?? 1)
    ),
    id: item?.orderItemId ?? item?.id,
  });

  // open drawer (lazy-load items if missing)
  const openDrawer = async (order) => {
    const oid = order.id || order.orderId;
    setDrawerOrder(order);
    setDrawerOpen(true);

    if (order.items && order.items.length) return; // already have items

    try {
      setDrawerLoading(true);
      const full = await fetchOrderById(oid);
      const items = full?.items ?? [];
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

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setDrawerOrder(null), 200);
  };

  // close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && drawerOpen && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // ====== Settle Month handlers ======
  const openSettle = () => {
    // default split: all cash
    setCashAmount(pendingTotal);
    setCardAmount(0);
    setShowSettle(true);
  };

  const closeSettle = () => {
    setShowSettle(false);
    setCashAmount(0);
    setCardAmount(0);
  };

// Replace your confirmSettle function with this improved version:

const confirmSettle = async () => {
  if (!selectedClient) return;
  
  const [yy, mm] = month.split("-");
  const baseDate = new Date(parseInt(yy), parseInt(mm) - 1, 1);
  const from = firstDayOfMonthISO(baseDate);
  const to = lastDayOfMonthISO(baseDate);

  // Validate amounts match pending total
  const sum = Number(cashAmount || 0) + Number(cardAmount || 0);
  if (Math.abs(sum - pendingTotal) > 0.01) {
    setMessage("Amounts must equal the pending total.");
    return;
  }

  try {
    setLoading(true); // Show loading during settlement
    
    console.log('Starting settlement for client:', selectedClient.clientId);
    console.log('Date range:', from, 'to', to);
    console.log('Orders before settlement:', orders.filter(o => o.status === 'PENDING_PAYMENT'));
    console.log('Settlement amounts - Cash:', cashAmount, 'Card:', cardAmount);
    
    const response = await fetch(
      `http://localhost:8080/api/orders/client/${selectedClient.clientId}/settle?from=${from}&to=${to}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: [
            ...(cashAmount > 0 ? [{ method: "CASH", amount: cashAmount }] : []),
            ...(cardAmount > 0 ? [{ method: "CARD", amount: cardAmount }] : []),
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Settlement failed: ${response.status} ${errorText}`);
    }

    // Get the updated orders from the settlement response
    const result = await response.json();
    console.log('Settlement result:', result);

    // Use the updated orders returned by the backend
    if (result.orders && Array.isArray(result.orders)) {
      setOrders(result.orders);
      console.log('Updated orders from settlement:', result.orders);
    }

    setMessage(`Settlement completed. ${result.ordersSettled || 0} orders settled for ${formatCurrency(result.totalPaid || 0)}.`);
    closeSettle();

    // Fallback: refresh if no orders in response
    if (!result.orders) {
      try {
        const refreshedOrders = await fetchOrdersByClient(selectedClient.clientId, from, to);
        setOrders(refreshedOrders || []);
      } catch (e) {
        console.error('Failed to refresh orders after settlement:', e);
      }
    }

  } catch (error) {
    console.error('Settlement error:', error);
    setMessage(`Failed to settle month: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

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

            {/* NEW: Settle Month button */}
            <button
              onClick={openSettle}
              disabled={!selectedClient || pendingTotal <= 0}
              title={pendingTotal > 0 ? `Settle ${formatCurrency(pendingTotal)}` : "Nothing to settle"}
            >
              Settle Month
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
          {/* Optional: pending chip */}
          <div className="cs-card">
            <div className="cs-card-label">Pending Payment</div>
            <div className="cs-card-value">{formatCurrency(pendingTotal)}</div>
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
                  {["#", "Date", "Status", "Total", "Items"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
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
                            .replace(/[\s_]+/g, "-")}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>{((o.totalAmount ?? 0)).toFixed(2)} DH</td>
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

      {/* RIGHT-SIDE DRAWER */}
      {drawerOpen && (
        <>
          <div className="cs-drawer-backdrop" onClick={closeDrawer} />
          <aside role="dialog" aria-modal="true" className="cs-drawer">
            <div className="cs-drawer-header">
              <div>
                <div className="cs-drawer-title">Order #{drawerOrder?.id || drawerOrder?.orderId}</div>
                <div className="cs-drawer-subtitle">
                  {drawerOrder?.createdAt ? new Date(drawerOrder.createdAt).toLocaleString() : ""}
                </div>
              </div>
              <button className="cs-drawer-close" onClick={closeDrawer} aria-label="Close"></button>
            </div>

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
                      {["Item", "Qty", "Unit", "Subtotal"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(drawerOrder?.items || []).map((it, i) => {
                      const ip = itemProps(it);
                      return (
                        <tr key={ip.id || i}>
                          <td>{ip.name}</td>
                          <td>{ip.qty}</td>
                          <td>{ip.unit.toFixed(2)} DH</td>
                          <td>{ip.subtotal.toFixed(2)} DH</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="cs-drawer-footer">
              <div style={{ color: "var(--cs-muted)", fontSize: 13 }}>
                Status:{" "}
                <span
                  className={`cs-status ${String(drawerOrder?.status || "")
                    .toLowerCase()
                    .replace(/[\s_]+/g, "-")}`}
                >
                  {drawerOrder?.status}
                </span>
              </div>
              <div style={{ fontWeight: 800 }}>
                Total: {((drawerOrder?.totalAmount ?? 0)).toFixed(2)} DH
              </div>
            </div>
          </aside>
        </>
      )}

    {/* ====== Settle Month (POS clean) ====== */}
{showSettle && (
  <div className="settle-ovl" onClick={closeSettle} role="presentation">
    <div
      className="settle-box pos"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settle-title"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="settle-head">
        <h3 id="settle-title">Settle {month}</h3>
        <button className="settle-x" onClick={closeSettle} aria-label="Close">×</button>
      </div>

      <p className="settle-note">
        Pending: <strong>{formatCurrency(pendingTotal)}</strong>
      </p>

      <label className="settle-field big">
        <span>Cash (DH)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={cashAmount}
          onChange={(e) => {
            const v = Math.max(0, Number(e.target.value) || 0);
            setCashAmount(v);
            setCardAmount(Math.max(0, pendingTotal - v));
          }}
          inputMode="decimal"
        />
      </label>

      <label className="settle-field big">
        <span>Card (DH)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={cardAmount}
          onChange={(e) => {
            const v = Math.max(0, Number(e.target.value) || 0);
            setCardAmount(v);
            setCashAmount(Math.max(0, pendingTotal - v));
          }}
          inputMode="decimal"
        />
      </label>

      {/* Simple presets */}
      <div className="quick-row three">
        <button className="chip" onClick={() => { setCashAmount(pendingTotal); setCardAmount(0); }}>
          All Cash
        </button>
        <button className="chip" onClick={() => { setCashAmount(0); setCardAmount(pendingTotal); }}>
          All Card
        </button>
        <button className="chip" onClick={() => {
          const half = Math.round((pendingTotal / 2) * 100) / 100;
          setCashAmount(half);
          setCardAmount(pendingTotal - half);
        }}>
          50 / 50
        </button>
      </div>

      {/* Only show an error when it doesn't match */}
      {Math.abs((Number(cashAmount) + Number(cardAmount)) - pendingTotal) > 0.01 && (
        <div className="settle-help warn" role="alert">
          Amounts must equal the pending total.
        </div>
      )}

      <div className="settle-actions">
        <button className="btn-light" onClick={closeSettle}>Cancel</button>
        <button
          className="btn-primary big"
          onClick={confirmSettle}
          disabled={Math.abs((Number(cashAmount) + Number(cardAmount)) - pendingTotal) > 0.01}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
  </div>

  );
};

export default ClientsOrders;
