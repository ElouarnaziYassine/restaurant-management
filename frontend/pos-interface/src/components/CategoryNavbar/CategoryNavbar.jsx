import React, { useEffect, useState } from "react";
import "./CategoryNavbar.css";
import { fetchCategories } from "../../api/categoryApi"; // adjust path if needed

const CategoryNavbar = ({ selectedCategory, onSelectCategory }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  return (
    <div className="category-navbar">
      {categories.map((category) => (
        <button
          key={category.categoryId}
          className={`category-btn ${selectedCategory === category.categoryId ? "active" : ""}`}
          onClick={() => onSelectCategory(category.categoryId)}
        >
          {category.name}
        </button>

      ))}
    </div>
  );
};

export default CategoryNavbar;
