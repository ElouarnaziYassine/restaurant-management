// src/api/tableApi.js
import axios from "axios";

const TABLE_URL = "http://localhost:8080/api/tables";

// ✅ Existing: Fetch only available tables
export const fetchAvailableTables = () => axios.get(`${TABLE_URL}/available`);

// ✅ New: Fetch all tables
export const fetchTables = () => axios.get(TABLE_URL);

// ✅ Create table
export const createTable = (table) => axios.post(TABLE_URL, table);

// ✅ Update table
export const updateTable = (id, table) => axios.put(`${TABLE_URL}/${id}`, table);

// ✅ Delete table
export const deleteTable = (id) => axios.delete(`${TABLE_URL}/${id}`);
