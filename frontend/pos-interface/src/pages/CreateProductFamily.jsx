import React, { useState, useEffect } from "react";
import {
  fetchCategories,
} from "../api/categoryApi";
import {
  fetchProductFamilies,
  createProductFamily,
} from "../api/productFamilyApi";
import Toast from "../components/Toast/Toast"; 
import axios from "axios";
import "./CreateProductFamily.css";

const CreateProductFamily = () => {
  const [categories, setCategories] = useState([]);
  const [productFamilies, setProductFamilies] = useState([]);
  const [family, setFamily] = useState({
    name: "",
    description: "",
    categoryId: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories", err));

    loadProductFamilies();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadProductFamilies = async () => {
    try {
      const res = await fetchProductFamilies();
      setProductFamilies(res.data);
    } catch (err) {
      console.error("Error fetching product families", err);
    }
  };

  const handleChange = (e) => {
    setFamily({ ...family, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setMessage("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage("File size must be less than 5MB");
        return;
      }
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", family.name);
      formData.append("description", family.description);
      formData.append("categoryId", family.categoryId);
      if (imageFile) formData.append("image", imageFile);

      if (editId) {
        await axios.put(`http://localhost:8080/api/product-families/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage("Product family updated successfully!");
      } else {
        await createProductFamily(formData);
        setMessage("Product family created successfully!");
      }

      resetForm();
      loadProductFamilies();
    } catch (err) {
      console.error("Error saving product family", err);
      setMessage("Failed to save product family.");
    }
  };

  const resetForm = () => {
    setFamily({ name: "", description: "", categoryId: "" });
    setImageFile(null);
    setImagePreview("");
    setEditId(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const handleEdit = (fam) => {
    setFamily({
      name: fam.name,
      description: fam.description,
      categoryId: fam.category?.categoryId || "",
    });
    setImagePreview(fam.imageUrl || "");
    setEditId(fam.productFamilyId);
    setMessage("");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product family?")) {
      try {
        await axios.delete(`http://localhost:8080/api/product-families/${id}`);
        loadProductFamilies();
        setMessage("Product family deleted.");
      } catch (err) {
        console.error("Delete failed", err);
        setMessage("Failed to delete product family.");
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="product-family-container">
      <Toast message={message} visible={!!message} />

      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Product Families</h1>
          <p className="page-subtitle">Group products under categories</p>
        </div>
        <div className="family-stats">{productFamilies.length} families</div>
      </div>

      <div className="family-layout">
        {/* Form Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="form-header">
              <div className="form-icon">📦</div>
              <h2 className="form-title">{editId ? "Edit Product Family" : "Add Product Family"}</h2>
            </div>

            <form onSubmit={handleSubmit} className="family-form">
              <div className="input-group">
                <label className="input-label">Family Name</label>
                <input
                  type="text"
                  name="name"
                  value={family.name}
                  onChange={handleChange}
                  placeholder="Enter product family name"
                  className="form-input"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  name="description"
                  value={family.description}
                  onChange={handleChange}
                  placeholder="Brief description"
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Category</label>
                <select
                  name="categoryId"
                  value={family.categoryId}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {editId ? "Update Family" : "Create Family"}
                </button>
                {editId && (
                  <button type="button" onClick={resetForm} className="secondary-btn">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Families List */}
        <div className="families-section">
          <div className="section-header">
            <h3 className="section-title">Existing Families ({productFamilies.length})</h3>
          </div>

          <div className="families-list">
            {productFamilies.map((fam) => (
              <div key={fam.productFamilyId} className="family-item">
                <div className="family-content">
                  <div className="family-main">
                    {fam.imageUrl ? (
                      <img src={fam.imageUrl} alt={fam.name} className="family-thumbnail" />
                    ) : (
                      <div className="family-placeholder">📦</div>
                    )}
                    <div className="family-info">
                      <h4 className="family-title">{fam.name}</h4>
                      <p className="family-desc">{fam.description}</p>
                      <span className="family-category">{fam.category?.name || "Uncategorized"}</span>
                    </div>
                  </div>
                  <div className="family-actions">
                    <button onClick={() => handleEdit(fam)} className="action-btn edit-btn">✏️</button>
                    <button onClick={() => handleDelete(fam.productFamilyId)} className="action-btn delete-btn">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {productFamilies.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No product families yet</h3>
              <p>Create your first family to group related products</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProductFamily;
