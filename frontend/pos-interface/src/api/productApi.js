import axios from "axios";

const BASE_URL = "http://localhost:8080/api/products";

export const fetchProductsByFamilyId = (familyId) =>
  axios.get(`${BASE_URL}?familyId=${familyId}`);
