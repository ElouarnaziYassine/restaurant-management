import React, { useState, useEffect } from "react";
import {
  fetchCategories,
} from "../api/categoryApi";
import {
  fetchProductFamiliesByCategory,
} from "../api/productFamilyApi";
import {
  fetchAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/productApi";
import "./CreateProduct.css";
import Toast from "../components/Toast/Toast"; 


const CreateProduct = () => {
  const [categories, setCategories] = useState([]);
  const [families, setFamilies] = useState([]);
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    productFamilyId: "",
    notes: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories", err));

    loadProducts();
  }, []);

  useEffect(() => {
    if (product.categoryId) {
      fetchProductFamiliesByCategory(product.categoryId)
        .then((res) => setFamilies(res.data))
        .catch((err) => console.error("Error fetching product families", err));
    } else {
      setFamilies([]);
    }
  }, [product.categoryId]);

  /*toast */
    useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  const loadProducts = async () => {
    try {
      const res = await fetchAllProducts();
      setProducts(res.data);
    } catch (err) {
      console.error("Error loading products", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
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
        setMessage("File must be under 5MB");
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
      formData.append("name", product.name);
      formData.append("description", product.description);
      formData.append("price", product.price);
      formData.append("notes", product.notes);
      formData.append("categoryId", product.categoryId);
      formData.append("productFamilyId", product.productFamilyId);
      if (imageFile) formData.append("image", imageFile);

      if (editId) {
        await updateProduct(editId, formData);
        setMessage("Product updated successfully!");
      } else {
        await createProduct(formData);
        setMessage("Product created successfully!");
      }

      resetForm();
      loadProducts();
    } catch (err) {
      console.error("Save failed", err);
      setMessage("Failed to save product.");
    }
  };

  const handleEdit = (p) => {
    setProduct({
      name: p.name,
      description: p.description,
      price: p.price,
      notes: p.notes || "",
      categoryId: p.category?.categoryId || "",
      productFamilyId: p.productFamily?.productFamilyId || "",
    });

    setImagePreview(p.imageUrl ? `http://localhost:8080${p.imageUrl}` : "");
    setImageFile(null);
    setEditId(p.productId);
  };


  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      try {
        await deleteProduct(id);
        loadProducts();
        setMessage("Product deleted.");
      } catch (err) {
        console.error("Delete failed", err);
        setMessage("Failed to delete product.");
      }
    }
  };

  const resetForm = () => {
    setProduct({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      productFamilyId: "",
      notes: "",
    });
    setImageFile(null);
    setImagePreview("");
    setEditId(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

 return (
  <div className="product-management-container">
    <Toast message={message} visible={!!message} />

    {/* Header */}
    <div className="page-header">
      <div className="header-content">
        <h1 className="page-title">Product Management</h1>
        <p className="page-subtitle">Manage your menu items, pricing, and product families</p>
      </div>
      <div className="product-stats">
        {products.length} products
      </div>
    </div>

    <div className="product-layout">
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
            <h2 className="form-title">{editId ? "Edit Product" : "Add New Product"}</h2>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            <div className="input-group">
              <label className="input-label">Name</label>
              <input
                type="text"
                placeholder="Enter product name"
                name="name"
                value={product.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                placeholder="Short description"
                name="description"
                value={product.description}
                onChange={handleChange}
                className="form-textarea"
                rows="2"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Price (MAD)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                name="price"
                value={product.price}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Category</label>
              <select
                name="categoryId"
                value={product.categoryId}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Product Family</label>
              <select
                name="productFamilyId"
                value={product.productFamilyId}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select product family</option>
                {families.map((fam) => (
                  <option key={fam.productFamilyId} value={fam.productFamilyId}>
                    {fam.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" className="preview-image" />
                  <button type="button" className="remove-image-btn" onClick={removeImage}>
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Extra Notes</label>
              <textarea
                name="notes"
                value={product.notes}
                onChange={handleChange}
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editId ? "Update Product" : "Create Product"}
              </button>
              {editId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setProduct({ name: "", description: "", price: "", categoryId: "", productFamilyId: "", notes: "" });
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

      {/* Products Section */}
      <div className="products-section">
        <div className="section-header">
          <h3 className="section-title">Products ({products.length})</h3>
        </div>

        <div className="products-list">
          {products.map((p) => (
            <div key={p.productId} className="product-item">
              <div className="product-content">
                <div className="product-main">
                  <div className="product-thumb">
                    {p.imageUrl ? (
                      <img src={`http://localhost:8080${p.imageUrl}`} alt={p.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h4 className="product-title">{p.name}</h4>
                    <p className="product-desc">{p.description}</p>
                    <p className="product-meta">
                      {p.category?.name || "Uncategorized"} • {p.productFamily?.name || "No Family"} • {p.price} MAD
                    </p>
                  </div>
                </div>
                <div className="product-actions">
                  <button className="action-btn edit-btn" onClick={() => handleEdit(p)}>✎</button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(p.productId)}>🗑</button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No products yet</h3>
              <p>Create your first product to start building your menu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

};

export default CreateProduct;
