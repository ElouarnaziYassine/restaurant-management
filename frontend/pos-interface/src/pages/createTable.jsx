import React, { useEffect, useState } from "react";
import {
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
} from "../api/tableApi";
import Toast from "../components/Toast/Toast";
import "./CreateTable.css";

const CreateTable = () => {
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadTables = async () => {
    try {
      const res = await fetchTables();
      const tableData = Array.isArray(res.data) ? res.data : [];
      setTables(tableData);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
      setTables([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tableNumber || !capacity) {
      setMessage("⚠️ Table number and capacity are required");
      return;
    }

    const tableData = {
      tableNumber: parseInt(tableNumber),
      capacity: parseInt(capacity),
      available: isAvailable,
    };

    try {
      if (editId) {
        await updateTable(editId, tableData);
        setMessage("✅ Table updated successfully");
      } else {
        await createTable(tableData);
        setMessage("✅ Table created successfully");
      }
      resetForm();
      loadTables();
    } catch (err) {
      console.error("❌ Save failed:", err);
      const errorMsg =
        err.response?.data?.error ||
        (editId
          ? "⚠️ Cannot edit table: it is currently linked to an active order."
          : "❌ Error saving table");
      setMessage(errorMsg);
    }
  };

  const handleEdit = (table) => {
    setEditId(table.tableId);
    setTableNumber(table.tableNumber);
    setCapacity(table.capacity);
    setIsAvailable(table.available);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTable(id);
      setTables((prev) => prev.filter((t) => t.tableId !== id));
      setMessage("🗑️ Table deleted successfully.");
    } catch (err) {
      console.error("❌ Delete failed", err);
      const errorMsg =
        err.response?.data?.error ||
        "⚠️ This table cannot be deleted because it is linked to an existing order.";
      setMessage(errorMsg);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setTableNumber("");
    setCapacity("");
    setIsAvailable(true);
  };

  return (
    <div className="table-management-container">
      <Toast message={message} visible={!!message} />

      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Table Management</h1>
          <p className="page-subtitle">Manage restaurant tables and seating capacity</p>
        </div>
        <div className="table-stats">
          {tables.length} total • {tables.filter(t => t.available).length} available
        </div>
      </div>

      <div className="management-layout">
        {/* Form Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="form-header">
              <div className="form-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
              <h2 className="form-title">{editId ? "Edit Table" : "Add New Table"}</h2>
            </div>

            <form className="modern-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="9" x2="20" y2="9"></line>
                    <line x1="4" y1="15" x2="20" y2="15"></line>
                    <line x1="10" y1="3" x2="8" y2="21"></line>
                    <line x1="16" y1="3" x2="14" y2="21"></line>
                  </svg>
                  Table Number
                </label>
                <input
                  type="number"
                  placeholder="Enter table number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="modern-input"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Capacity
                </label>
                <input
                  type="number"
                  placeholder="Number of seats"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="modern-input"
                  required
                />
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  disabled
                  className="modern-checkbox"
                />
                <span className="checkbox-text">Available for booking</span>
              </label>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {editId ? "Update Table" : "Create Table"}
                </button>
                {editId && (
                  <button type="button" onClick={resetForm} className="secondary-btn">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Tables Section */}
        <div className="tables-section">
          <div className="section-header">
            <h3 className="section-title">Existing Tables</h3>
          </div>
          
          <div className="tables-grid">
            {tables.map((t, index) => (
              <div key={t.tableId || `${t.tableNumber}-${index}`} className={`table-card ${!t.available ? 'unavailable' : ''}`}>
                <div className="table-card-header">
                  <div className="table-number">Table {t.tableNumber}</div>
                  <div className={`status-badge ${t.available ? 'available' : 'occupied'}`}>
                    {t.available ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    )}
                    {t.available ? "Available" : "Occupied"}
                  </div>
                </div>
                
                <div className="table-info">
                  <div className="capacity-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    {t.capacity} seats
                  </div>
                </div>

                <div className="table-actions">
                  <button
                    onClick={() => handleEdit(t)}
                    disabled={!t.available}
                    className={`action-btn edit-btn ${!t.available ? 'disabled' : ''}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this table?')) {
                        handleDelete(t.tableId);
                      }
                    }}
                    disabled={!t.available}
                    className={`action-btn delete-btn ${!t.available ? 'disabled' : ''}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {tables.length === 0 && (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
              <h3>No tables found</h3>
              <p>Create your first table to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTable;