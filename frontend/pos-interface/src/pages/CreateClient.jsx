import React, { useEffect, useState } from "react";
import {
  fetchAllClients,
  createClient,
  updateClient,
  deleteClient,
} from "../api/clientApi";
import Toast from "../components/Toast/Toast";
import "./CreateClient.css";

const CreateClient = () => {
  const [clients, setClients] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadClients = async () => {
    try {
      const res = await fetchAllClients();
      setClients(res.data);
    } catch (err) {
      console.error("Error loading clients", err);
      setMessage("Failed to load clients.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setMessage("Both first name and last name are required");
      return;
    }

    try {
      if (editId) {
        await updateClient(editId, { firstName, lastName });
        setMessage("Client updated successfully");
      } else {
        await createClient({ firstName, lastName });
        setMessage("Client created successfully");
      }

      setFirstName("");
      setLastName("");
      setEditId(null);
      loadClients();
    } catch (err) {
      console.error("Save failed", err);
      setMessage("Failed to save client");
    }
  };

  const handleEdit = (client) => {
    setEditId(client.clientId);
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setMessage("");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await deleteClient(id);
        loadClients();
        setMessage("Client deleted");
      } catch (err) {
        console.error("Delete failed", err);
        setMessage("Failed to delete client");
      }
    }
  };

  return (
    <div className="client-management-container">
      <Toast message={message} visible={!!message} />

      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Client Management</h1>
          <p className="page-subtitle">Manage customer information and keep records up to date</p>
        </div>
        <div className="client-stats">
          {clients.length} clients
        </div>
      </div>

      <div className="client-layout">
        {/* Form Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="form-header">
              <div className="form-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h2 className="form-title">{editId ? "Edit Client" : "Add New Client"}</h2>
            </div>

            <form onSubmit={handleSubmit} className="client-form">
              <div className="input-group">
                <label className="input-label">First Name</label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Last Name</label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {editId ? "Update Client" : "Create Client"}
                </button>
                {editId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditId(null);
                      setFirstName("");
                      setLastName("");
                      setMessage("");
                    }} 
                    className="secondary-btn"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Clients List Section */}
        <div className="clients-section">
          <div className="section-header">
            <h3 className="section-title">Clients ({clients.length})</h3>
          </div>
          
          <div className="clients-list">
            {clients.map((client, index) => (
              <div key={client.clientId} className="client-item">
                <div className="client-content">
                  <div className="client-main">
                    <div className="client-badge">{index + 1}</div>
                    <div className="client-info">
                      <h4 className="client-title">{client.firstName} {client.lastName}</h4>
                      <p className="client-desc">Client ID: #{client.clientId}</p>
                    </div>
                  </div>
                  <div className="client-actions">
                    <button
                      onClick={() => handleEdit(client)}
                      className="action-btn edit-btn"
                      title="Edit Client"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(client.clientId)}
                      className="action-btn delete-btn"
                      title="Delete Client"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2,2h4a2,2 0 0,1,2,2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {clients.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>No clients yet</h3>
              <p>Create your first client to start managing customer information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateClient;