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
    <div className="create-product-page">
      <h2>{editId ? "Edit Product" : "Create New Product"}</h2>
      <form className="product-form" onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input type="text" name="name" value={product.name} onChange={handleChange} required />
        </div>

        <div>
          <label>Description</label>
          <input type="text" name="description" value={product.description} onChange={handleChange} required />
        </div>

        <div>
          <label>Price (MAD)</label>
          <input type="number" step="0.01" name="price" value={product.price} onChange={handleChange} required />
        </div>

        <div>
          <label>Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" className="preview-image" />
              <button type="button" onClick={removeImage}>Remove Image</button>
            </div>
          )}
        </div>

        <div>
          <label>Category</label>
          <select name="categoryId" value={product.categoryId} onChange={handleChange} required>
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Product Family</label>
          <select name="productFamilyId" value={product.productFamilyId} onChange={handleChange} required>
            <option value="">Select product family</option>
            {families.map((fam) => (
              <option key={fam.productFamilyId} value={fam.productFamilyId}>
                {fam.name}
              </option>
            ))}
          </select>
        </div>

        <div className="full-width">
          <label>Extra Notes</label>
          <textarea name="notes" value={product.notes} onChange={handleChange} />
        </div>

        <button type="submit">{editId ? "Update" : "Create"}</button>
        {message && <p className="message">{message}</p>}
      </form>

      <h3>Existing Products</h3>
      <table className="product-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Family</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.productId}>
              <td>{p.name}</td>
              <td>{p.price} MAD</td>
              <td>{p.category?.name || "N/A"}</td>
              <td>{p.productFamily?.name || "N/A"}</td>
              <td>
                {p.imageUrl ? (
                  <img
                    src={`http://localhost:8080${p.imageUrl}`}
                    alt="Product"
                    style={{ width: "60px", height: "40px", objectFit: "cover" }}
                  />
                ) : (
                  "No Image"
                )}
              </td>
              <td>
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button onClick={() => handleDelete(p.productId)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CreateProduct;
