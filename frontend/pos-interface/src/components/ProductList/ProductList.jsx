import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ProductList.css";

const ProductList = ({ selectedFamilyId, onAddToCart }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!selectedFamilyId) {
      setProducts([]);
      return;
    }

    axios
      .get(`http://localhost:8080/api/products/family/${selectedFamilyId}`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          console.log("Products loaded:", res.data); // Debug: check imageUrl values
          setProducts(res.data);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error("❌ Failed to load products:", err);
        setProducts([]);
      });
  }, [selectedFamilyId]);

  return (
    <div className="product-list-container">
      <div className="product-list">
        {products.map((product) => (
          <div
            key={product.productId}
            className="product-card"
            onClick={() => onAddToCart(product)}
          >
            <div className="product-image-wrapper">
              <img
                src={product.imageUrl ? `http://localhost:8080${product.imageUrl}` : "/default.jpg"}
                alt={product.name}
                className="product-image"
                onError={(e) => {
                  console.log("Image failed to load:", product.imageUrl);
                  console.log("Full URL attempted:", `http://localhost:8080${product.imageUrl}`);
                  e.target.src = "/default.jpg";
                }}
              />
            </div>
            <div className="product-name">{product.name}</div>
            <div className="product-price">
              {product.price ? product.price.toFixed(2) : "0.00"} DH
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;