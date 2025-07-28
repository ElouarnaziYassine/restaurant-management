import React, { useEffect, useState } from "react";
import { fetchProductFamilies } from "../../api/productFamilyApi";
import "./ProductFamilyNavbar.css";

const ProductFamilyNavbar = ({ selectedFamilyId, onSelectFamily }) => {
  const [families, setFamilies] = useState([]);

  useEffect(() => {
    fetchProductFamilies()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setFamilies(res.data);
        } else {
          console.warn("Unexpected response:", res.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching product families:", err);
      });
  }, []);

  return (
    <div className="family-navbar">
      {families.map((family) => (
        <button
          key={family.productFamilyId}
          className={`family-btn ${selectedFamilyId === family.productFamilyId ? "active" : ""}`}
          onClick={() => onSelectFamily(family.productFamilyId)}
        >
          {family.name}
        </button>
      ))}
    </div>
  );
};

export default ProductFamilyNavbar;
