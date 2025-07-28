import React, { useState } from "react";
import { createCategory } from "../api/categoryApi";
import { useNavigate } from "react-router-dom";
import "./CreateCategory.css";

const CreateCategory = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      setError("Both name and description are required");
      return;
    }

    try {
      await createCategory({ name, description });
      setSuccess("Category created successfully");
      setError("");
      setName("");
      setDescription("");
      // navigate("/");
    } catch (err) {
      console.error(err);
      setError("Failed to create category");
      setSuccess("");
    }
  };

  return (
    <div className="create-category-page">
      <h2>Create New Category</h2>
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
        <button type="submit">Create</button>
      </form>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}
    </div>
  );
};

export default CreateCategory;
