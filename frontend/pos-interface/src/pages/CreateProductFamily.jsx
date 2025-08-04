import React, { useState, useEffect } from "react";
import { fetchCategories } from "../api/categoryApi";
import axios from "axios";
import "./CreateProductFamily.css";

const CreateProductFamily = () => {
  const [categories, setCategories] = useState([]);
  const [family, setFamily] = useState({
    name: "",
    description: "",
    categoryId: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setMessage("File size must be less than 5MB");
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setMessage(""); // Clear any previous error messages
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData object to handle file upload
      const formData = new FormData();
      formData.append('name', family.name);
      formData.append('description', family.description);
      formData.append('categoryId', family.categoryId);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await axios.post("http://localhost:8080/api/product-families", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMessage("Product family created successfully!");
      setFamily({
        name: "",
        description: "",
        categoryId: ""
      });
      setImageFile(null);
      setImagePreview("");
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (err) {
      console.error("Error creating product family", err);
      setMessage("Failed to create product family.");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
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
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
          />
          
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" className="preview-image" />
              <button type="button" onClick={removeImage} className="remove-image-btn">
                Remove Image
              </button>
            </div>
          )}
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