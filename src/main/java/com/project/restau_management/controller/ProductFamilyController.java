package com.project.restau_management.controller;

import com.project.restau_management.dto.ProductFamilyDTO;
import com.project.restau_management.entity.Category;
import com.project.restau_management.entity.ProductFamily;
import com.project.restau_management.service.CategoryService;
import com.project.restau_management.service.ProductFamilyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


@RestController
@RequestMapping("/api/product-families")
public class ProductFamilyController {

    private final ProductFamilyService productFamilyService;
    private final CategoryService categoryService;

    public ProductFamilyController(ProductFamilyService productFamilyService, CategoryService categoryService) {
        this.productFamilyService = productFamilyService;
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<ProductFamily> getAllProductFamilies() {
        return productFamilyService.getAllProductFamilies();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductFamily> getProductFamilyById(@PathVariable String id) {
        return productFamilyService.getProductFamilyById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createProductFamily(@RequestBody ProductFamilyDTO dto) {
        try {
            Optional<Category> categoryOpt = categoryService.getCategoryById(dto.categoryId);
            if (!categoryOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Invalid category ID");
            }

            ProductFamily family = new ProductFamily();
            family.setProductFamilyId(UUID.randomUUID().toString());
            family.setName(dto.name);
            family.setImageUrl(dto.imageUrl);
            family.setImageAltText(dto.imageAltText);
            family.setCategory(categoryOpt.get());

            ProductFamily saved = productFamilyService.saveProductFamily(family);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating product family: " + e.getMessage());
        }
    }


    @PutMapping("/{id}")
    public ResponseEntity<ProductFamily> updateProductFamily(
            @PathVariable String id,
            @RequestBody ProductFamily productFamily) {
        if (!productFamilyService.getProductFamilyById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        productFamily.setProductFamilyId(id);
        return ResponseEntity.ok(productFamilyService.saveProductFamily(productFamily));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProductFamily(@PathVariable String id) {
        productFamilyService.deleteProductFamily(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public List<ProductFamily> searchProductFamilies(@RequestParam String name) {
        return productFamilyService.searchByName(name);
    }

    @GetMapping("/by-category/{categoryId}")
    public List<ProductFamily> getByCategory(@PathVariable int categoryId) {
        return productFamilyService.getFamiliesByCategoryId(categoryId);
    }

}