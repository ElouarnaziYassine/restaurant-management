import axios from "axios";

const BASE_URL = "http://localhost:8080/api/product-families";

// Get all product families
export const fetchProductFamilies = () => axios.get(BASE_URL);

// Search product families by name
export const searchProductFamilies = (name) =>
  axios.get(`${BASE_URL}/search?name=${name}`);

// ✅ NEW: Get product families by category ID
export const fetchProductFamiliesByCategory = (categoryId) =>
  axios.get(`${BASE_URL}/by-category/${categoryId}`);


export const createProductFamily = (data) => axios.post(BASE_URL, data);
