import React, { useState, useEffect } from "react";
import { fetchCategories } from "../api/categoryApi";
import axios from "axios";
import "./CreateProductFamily.css";

const CreateProductFamily = () => {
  const [categories, setCategories] = useState([]);
  const [family, setFamily] = useState({
    name: "",
    description: "",
    imageUrl: "",
    categoryId: ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCategories()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          console.error("Expected array for categories but got:", res.data);
          setCategories([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching categories", err);
        setCategories([]);
      });
  }, []);

  const handleChange = (e) => {
    setFamily({ ...family, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/product-families", family);
      setMessage("Product family created successfully!");
      setFamily({
        name: "",
        description: "",
        imageUrl: "",
        categoryId: ""
      });
    } catch (err) {
      console.error("Error creating product family", err);
      setMessage("Failed to create product family.");
    }
  };

  return (
    <div className="create-product-family-page">
      <h2>Create New Product Family</h2>
        <form onSubmit={handleSubmit} className="create-family-form">

  <div className="form-group">
    <label>Name</label>
    <input
      type="text"
      name="name"
      value={family.name}
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-group">
    <label>Description</label>
    <textarea
      name="description"
      value={family.description}
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-group">
    <label>Image URL</label>
    <input
      type="text"
      name="imageUrl"
      value={family.imageUrl}
      onChange={handleChange}
    />
  </div>

  <div className="form-group">
    <label>Category</label>
    <select
      name="categoryId"
      value={family.categoryId}
      onChange={handleChange}
      required
    >
      <option value="">Select a category</option>
      {Array.isArray(categories) &&
        categories.map((cat) => (
          <option key={cat.categoryId} value={cat.categoryId}>
            {cat.name}
          </option>
        ))}
    </select>
  </div>

  <div className="form-group full-width">
    <button type="submit">Create</button>
    {message && <p className="message">{message}</p>}
  </div>

</form>

    </div>
  );
};

export default CreateProductFamily;
