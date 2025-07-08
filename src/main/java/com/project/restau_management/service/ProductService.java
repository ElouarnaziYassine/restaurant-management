package com.project.restau_management.service;

import com.project.restau_management.entity.Category;
import com.project.restau_management.entity.Product;
import com.project.restau_management.entity.ProductFamily;
import com.project.restau_management.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(int id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public void deleteProduct(int id) {
        productRepository.deleteById(id);
    }

    public List<Product> searchByName(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Product> getProductsByCategory(Category category) {
        return productRepository.findByCategory(category);
    }

    public List<Product> getProductsByCategoryId(int categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    public List<Product> getProductsByFamily(ProductFamily productFamily) {
        return productRepository.findByProductFamily(productFamily);
    }

    public List<Product> getProductsByFamilyId(String familyId) {
        return productRepository.findByProductFamilyId(familyId);
    }

    public List<Product> getProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return productRepository.findByPriceBetween(minPrice, maxPrice);
    }

    public List<Product> getProductsUnderPrice(BigDecimal price) {
        return productRepository.findByPriceLessThanEqual(price);
    }
}
