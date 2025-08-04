import React, { useState, useEffect } from "react";
import { fetchCategories } from "../api/categoryApi";
import { fetchProductFamiliesByCategory } from "../api/productFamilyApi";
import { createProduct } from "../api/productApi";
import "./CreateProduct.css";

const CreateProduct = () => {
  const [categories, setCategories] = useState([]);
  const [families, setFamilies] = useState([]);
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    productFamilyId: "",
    notes: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories", err));
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
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
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('price', product.price);
      formData.append('notes', product.notes);
      formData.append('categoryId', product.categoryId);
      formData.append('productFamilyId', product.productFamilyId);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await createProduct(formData);
      
      setMessage("Product created successfully!");
      
      // Reset form
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
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Optional: Redirect to products list or refresh parent component
      // window.location.href = '/products'; // Uncomment if you want to redirect
      
    } catch (err) {
      console.error("Error creating product", err.response?.data || err.message);
      setMessage(`Failed to create product: ${err.response?.data || err.message}`);
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
    <div className="create-product-page">
      <h2>Create New Product</h2>
      <form className="product-form" onSubmit={handleSubmit}>
        
        <div>
          <label>Name</label>
          <input 
            type="text" 
            name="name" 
            value={product.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div>
          <label>Description</label>
          <input 
            type="text" 
            name="description" 
            value={product.description} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div>
          <label>Price (MAD)</label>
          <input 
            type="number" 
            step="0.01"
            name="price" 
            value={product.price} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div>
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
        
        <div>
          <label>Category</label>
          <select 
            name="categoryId" 
            value={product.categoryId} 
            onChange={handleChange} 
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
        
        <div>
          <label>Product Family</label>
          <select 
            name="productFamilyId" 
            value={product.productFamilyId} 
            onChange={handleChange} 
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

        <div className="full-width">
          <label>Extra Notes</label>
          <textarea 
            name="notes" 
            value={product.notes} 
            onChange={handleChange} 
          />
        </div>

        <button type="submit">Create</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default CreateProduct;