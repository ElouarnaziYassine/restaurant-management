import React, { useState, useEffect } from "react";
import {
  fetchCategories,
  createCategory,
} from "../api/categoryApi";
import {
  fetchProductFamilies,
  createProductFamily,
} from "../api/productFamilyApi";
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
        // PUT for update
        await axios.put(`http://localhost:8080/api/product-families/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage("Product family updated successfully!");
      } else {
        // POST for create
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
    <div className="create-product-family-page">
      <h2>{editId ? "Edit Product Family" : "Create New Product Family"}</h2>

      <form onSubmit={handleSubmit} className="create-family-form">
        <div className="form-group">
          <label>Name</label>
          <input type="text" name="name" value={family.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={family.description} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select name="categoryId" value={family.categoryId} onChange={handleChange} required>
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit">{editId ? "Update" : "Create"}</button>
        {message && <p className="message">{message}</p>}
      </form>

      <h3>Existing Product Families</h3>
      <table className="category-table">
        <thead>
          <tr>
            <th>Product Family</th>
            <th>Description</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {productFamilies.map((fam) => (
            <tr key={fam.productFamilyId}>
              <td>{fam.name}</td>
              <td>{fam.description}</td>
              <td>{fam.category?.name || "N/A"}</td>
              <td>
                <button onClick={() => handleEdit(fam)}>Edit</button>
                <button onClick={() => handleDelete(fam.productFamilyId)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CreateProductFamily;
