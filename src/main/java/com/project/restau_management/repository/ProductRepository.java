package com.project.restau_management.repository;

import com.project.restau_management.entity.Category;
import com.project.restau_management.entity.Product;
import com.project.restau_management.entity.ProductFamily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByCategory(Category category);
    List<Product> findByProductFamily(ProductFamily productFamily);
    List<Product> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);
    List<Product> findByPriceLessThanEqual(BigDecimal price);

    @Query("SELECT p FROM Product p WHERE p.category.categoryId = :categoryId")
    List<Product> findByCategoryId(@Param("categoryId") int categoryId);

    @Query("SELECT p FROM Product p WHERE p.productFamily.productFamilyId = :familyId")
    List<Product> findByProductFamilyId(@Param("familyId") String familyId);
}