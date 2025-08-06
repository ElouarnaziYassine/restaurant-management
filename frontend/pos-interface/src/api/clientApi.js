import axios from "axios";

const BASE_URL = "http://localhost:8080/api/clients";

// Fetch all clients
export const fetchAllClients = () => axios.get(BASE_URL);

// Fetch client by ID
export const fetchClientById = (id) => axios.get(`${BASE_URL}/${id}`);

// Create new client
export const createClient = (client) => axios.post(BASE_URL, client);

// Update existing client
export const updateClient = (id, client) => axios.put(`${BASE_URL}/${id}`, client);

// Delete client
export const deleteClient = (id) => axios.delete(`${BASE_URL}/${id}`);

// Search by first name
export const searchClientsByFirstName = (firstName) =>
  axios.get(`${BASE_URL}/search/first-name`, { params: { firstName } });

// Search by last name
export const searchClientsByLastName = (lastName) =>
  axios.get(`${BASE_URL}/search/last-name`, { params: { lastName } });

// Search by full name
export const searchClientsByFullName = (firstName, lastName) =>
  axios.get(`${BASE_URL}/search/full-name`, {
    params: { firstName, lastName },
  });
