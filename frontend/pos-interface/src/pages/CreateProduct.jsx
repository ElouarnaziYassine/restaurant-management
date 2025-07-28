import React, { useState, useEffect } from "react";
import axios from "axios";
import { fetchCategories } from "../api/categoryApi";
import { fetchProductFamiliesByCategory } from "../api/productFamilyApi";
import "./CreateProduct.css";

const CreateProduct = () => {
  const [categories, setCategories] = useState([]);
  const [families, setFamilies] = useState([]);
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    categoryId: "",
    productFamilyId: "",
    notes: ""
  });
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

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const payload = {
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl,
      notes: product.notes,
      category: {
        categoryId: parseInt(product.categoryId),
      },
      productFamily: {
        productFamilyId: product.productFamilyId,
      },
    };

    await axios.post("http://localhost:8080/api/products", payload);
    setMessage("Product created successfully!");
    setProduct({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      categoryId: "",
      productFamilyId: "",
      notes: "",
    });
  } catch (err) {
    console.error("Error creating product", err);
    setMessage("Failed to create product.");
  }
};


  return (
    <div className="create-product-page">
      <h2>Create New Product</h2>
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
          <input type="number" name="price" value={product.price} onChange={handleChange} required />
        </div>

        <div>
          <label>Image URL</label>
          <input type="text" name="imageUrl" value={product.imageUrl} onChange={handleChange} />
        </div>
        <div>
          <label>Category</label>
          <select name="categoryId" value={product.categoryId} onChange={handleChange} required>
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Product Family</label>
          <select name="productFamilyId" value={product.productFamilyId} onChange={handleChange} required>
            <option value="">Select product family</option>
            {families.map((fam) => (
              <option key={fam.productFamilyId} value={fam.productFamilyId}>{fam.name}</option>
            ))}
          </select>
        </div>

        <div className="full-width">
          <label>Extra Notes</label>
          <textarea name="notes" value={product.notes} onChange={handleChange} />
        </div>

        <button type="submit">Create</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default CreateProduct;
