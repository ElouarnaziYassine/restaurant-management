import React, { useState, useEffect } from "react";
import {
  createCategory,
  fetchCategories,
  deleteCategory,
  updateCategory,
} from "../api/categoryApi";
import "./CreateCategory.css";

const CreateCategory = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetchCategories();
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      setError("Both name and description are required");
      return;
    }

    try {
      if (editId) {
        await updateCategory(editId, { name, description });
        setSuccess("Category updated successfully");
      } else {
        await createCategory({ name, description });
        setSuccess("Category created successfully");
      }

      setError("");
      setName("");
      setDescription("");
      setEditId(null);
      loadCategories();
    } catch (err) {
      console.error(err);
      setError("Failed to save category");
      setSuccess("");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id);
        loadCategories();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const handleEdit = (category) => {
    setEditId(category.categoryId);
    setName(category.name);
    setDescription(category.description);
    setSuccess("");
    setError("");
  };

  return (
    <div className="create-category-page">
      <h2>{editId ? "Edit Category" : "Create New Category"}</h2>

      <form onSubmit={handleSubmit} className="category-form">
        <input
          type="text"
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Category Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">{editId ? "Update" : "Create"}</button>
      </form>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <h3>Existing Categories</h3>
      <table className="category-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.categoryId}>
              <td>{cat.name}</td>
              <td>{cat.description}</td>
              <td>
                <button onClick={() => handleEdit(cat)}>Edit</button>
                <button onClick={() => handleDelete(cat.categoryId)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CreateCategory;
