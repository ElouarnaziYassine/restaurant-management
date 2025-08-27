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

 // Updated JSX return statement for CreateCategory component

return (
  <div className="category-management-container">
    <Toast message={message} visible={!!message} />

    {/* Header Section */}
    <div className="page-header">
      <div className="header-content">
        <h1 className="page-title">Category Management</h1>
        <p className="page-subtitle">Organize your menu items with categories</p>
      </div>
      <div className="category-stats">
        {categories.length} categories
      </div>
    </div>

    <div className="category-layout">
      {/* Form Section */}
      <div className="form-section">
        <div className="form-card">
          <div className="form-header">
            <div className="form-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <h2 className="form-title">{editId ? "Edit Category" : "Add New Category"}</h2>
          </div>

          <form onSubmit={handleSubmit} className="category-form">
            <div className="input-group">
              <label className="input-label">Category Name</label>
              <input
                type="text"
                placeholder="Enter category name (e.g., Appetizers, Main Course)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                placeholder="Brief description of this category"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editId ? "Update Category" : "Create Category"}
              </button>
              {editId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditId(null);
                    setName("");
                    setDescription("");
                    setMessage("");
                  }} 
                  className="secondary-btn"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Categories List Section */}
      <div className="categories-section">
        <div className="section-header">
          <h3 className="section-title">Categories ({categories.length})</h3>
        </div>
        
        <div className="categories-list">
          {categories.map((cat, index) => (
            <div key={cat.categoryId} className="category-item">
              <div className="category-content">
                <div className="category-main">
                  <div className="category-badge">{index + 1}</div>
                  <div className="category-info">
                    <h4 className="category-title">{cat.name}</h4>
                    <p className="category-desc">{cat.description}</p>
                  </div>
                </div>
                <div className="category-actions">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="action-btn edit-btn"
                    title="Edit Category"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(cat.categoryId)}
                    className="action-btn delete-btn"
                    title="Delete Category"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3>No categories yet</h3>
            <p>Create your first category to start organizing your menu items</p>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default CreateCategory;
