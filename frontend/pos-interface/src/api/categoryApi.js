import axios from "axios";

const BASE_URL = "http://localhost:8080/api/categories"; // adjust port if needed

export const fetchCategories = () => axios.get(BASE_URL);

export const fetchCategoryById = (id) => axios.get(`${BASE_URL}/${id}`);

export const createCategory = (data) => axios.post(BASE_URL, data);

export const updateCategory = (id, data) => axios.put(`${BASE_URL}/${id}`, data);

export const deleteCategory = (id) => axios.delete(`${BASE_URL}/${id}`);

export const searchCategories = (name) => axios.get(`${BASE_URL}/search?name=${name}`);
