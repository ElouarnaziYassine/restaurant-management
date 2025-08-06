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
  const [client, setClient] = useState({
    firstName: "",
    lastName: "",
  });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        await updateClient(editId, client);
        setMessage("Client updated successfully!");
      } else {
        await createClient(client);
        setMessage("Client created successfully!");
      }

      resetForm();
      loadClients();
    } catch (err) {
      console.error("Save failed", err);
      setMessage("Failed to save client.");
    }
  };

  const handleEdit = (c) => {
    setClient({
      firstName: c.firstName,
      lastName: c.lastName,
    });
    setEditId(c.clientId);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this client?")) {
      try {
        await deleteClient(id);
        loadClients();
        setMessage("Client deleted.");
      } catch (err) {
        console.error("Delete failed", err);
        setMessage("Failed to delete client.");
      }
    }
  };

  const resetForm = () => {
    setClient({
      firstName: "",
      lastName: "",
    });
    setEditId(null);
  };

  return (
    <div className="create-client-page">
      <h2>{editId ? "Edit Client" : "Create New Client"}</h2>
      <form className="client-form" onSubmit={handleSubmit}>
        <div>
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={client.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={client.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">{editId ? "Update" : "Create"}</button>
        <Toast message={message} visible={!!message} />
      </form>

      <h3>Existing Clients</h3>
      <table className="client-table">
        <thead>
          <tr>
            <th>ID</th> {/* New Column */}
            <th>First Name</th>
            <th>Last Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.clientId}>
              <td>#{c.clientId}</td> {/* Display ID */}
              <td>{c.firstName}</td>
              <td>{c.lastName}</td>
              <td>
                <button onClick={() => handleEdit(c)}>Edit</button>
                <button onClick={() => handleDelete(c.clientId)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default CreateClient;
