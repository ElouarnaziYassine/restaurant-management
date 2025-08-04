import React, { useState, useEffect } from "react";
import {
  createCategory,
  fetchCategories,
  deleteCategory,
  updateCategory,
} from "../api/categoryApi";
import Toast from "../components/Toast/Toast"; 
import "./CreateCategory.css";

const CreateCategory = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
      setMessage("Both name and description are required");
      return;
    }

    try {
      if (editId) {
        await updateCategory(editId, { name, description });
        setMessage("Category updated successfully");
      } else {
        await createCategory({ name, description });
        setMessage("Category created successfully");
      }

      setName("");
      setDescription("");
      setEditId(null);
      loadCategories();
    } catch (err) {
      console.error(err);
      setMessage("Failed to save category");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id);
        loadCategories();
        setMessage("Category deleted");
      } catch (err) {
        console.error("Delete failed", err);
        setMessage("Failed to delete category");
      }
    }
  };

  const handleEdit = (category) => {
    setEditId(category.categoryId);
    setName(category.name);
    setDescription(category.description);
    setMessage("");
  };

  return (
    <div className="create-category-page">
      <h2>{editId ? "Edit Category" : "Create New Category"}</h2>

      <Toast message={message} visible={!!message} />

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
