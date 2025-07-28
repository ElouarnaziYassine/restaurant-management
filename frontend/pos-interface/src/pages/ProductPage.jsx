import React, { useEffect, useState } from "react";
import ProductFamilyNavbar from "../components/ProductFamilyNavbar/ProductFamilyNavbar";
import ProductList from "../components/ProductList/ProductList";
import { fetchProductFamilies } from "../api/productFamilyApi";

const ProductPage = ({ onAddToCart }) => {
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);

  useEffect(() => {
    // Automatically select "Coffee"
    fetchProductFamilies()
      .then((res) => {
        const coffee = res.data.find((f) =>
          f.name.toLowerCase().includes("coffee")
        );
        if (coffee) {
          setSelectedFamilyId(coffee.productFamilyId);
        }
      })
      .catch((err) => console.error("Failed to auto-select Coffee", err));
  }, []);

  return (
    <div className="product-page">
      <ProductFamilyNavbar
        selectedFamilyId={selectedFamilyId}
        onSelectFamily={setSelectedFamilyId}
      />

      {selectedFamilyId && (
        <ProductList
          selectedFamilyId={selectedFamilyId}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
};

export default ProductPage;
