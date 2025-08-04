import axios from "axios";

const BASE_URL = "http://localhost:8080/api/products";

// Get all products
export const fetchAllProducts = () => 
  axios.get(BASE_URL);

// Get products by family ID
export const fetchProductsByFamilyId = (familyId) =>
  axios.get(`${BASE_URL}/family/${familyId}`);

// Get products by category ID  
export const fetchProductsByCategory = (categoryId) =>
  axios.get(`${BASE_URL}/category/${categoryId}`);

// Get products by price range
export const fetchProductsByPriceRange = (min, max) =>
  axios.get(`${BASE_URL}/price-range?min=${min}&max=${max}`);

// Search products by name
export const searchProducts = (name) =>
  axios.get(`${BASE_URL}/search?name=${name}`);

// Get single product by ID
export const fetchProductById = (id) =>
  axios.get(`${BASE_URL}/${id}`);

// Create product (JSON - for backward compatibility)
export const createProductJSON = (product) =>
  axios.post(`${BASE_URL}/json`, product);

// Create product (multipart - for file uploads)
export const createProduct = (formData) =>
  axios.post(BASE_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Update product (JSON - for backward compatibility)
export const updateProductJSON = (id, product) =>
  axios.put(`${BASE_URL}/${id}/json`, product);

// Update product (multipart - for file uploads)
export const updateProduct = (id, formData) =>
  axios.put(`${BASE_URL}/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Delete product
export const deleteProduct = (id) =>
  axios.delete(`${BASE_URL}/${id}`);