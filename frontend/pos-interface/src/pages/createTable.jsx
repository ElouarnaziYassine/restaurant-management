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
    <div className="create-table-page">
      <Toast message={message} visible={!!message} />

      <h2>{editId ? "Edit Table" : "Create New Table"}</h2>

      <form className="table-form" onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Table Number"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />
        <label className="availability">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            disabled
          />
          Available
        </label>
        <button type="submit">{editId ? "Update" : "Create"}</button>
      </form>

      <h3>Existing Tables</h3>
      <table className="table-list">
        <thead>
          <tr>
            <th>Table Number</th>
            <th>Capacity</th>
            <th>Available</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((t, index) => (
            <tr key={t.tableId || `${t.tableNumber}-${index}`}>
              <td>{t.tableNumber}</td>
              <td>{t.capacity}</td>
              <td>{t.available ? "Yes" : "No"}</td>
              <td>
                <button
                  onClick={() => handleEdit(t)}
                  disabled={!t.available}
                  className={!t.available ? "disabled-btn" : ""}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this table?')) {
                      handleDelete(t.tableId);
                    }
                  }}
                  disabled={!t.available}
                  className={!t.available ? "disabled-btn" : ""}
                >
                  Delete
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CreateTable;
