package com.project.restau_management.controller;

import com.project.restau_management.entity.ProductFamily;
import com.project.restau_management.service.ProductFamilyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/product-families")
public class ProductFamilyController {

    private final ProductFamilyService productFamilyService;

    public ProductFamilyController(ProductFamilyService productFamilyService) {
        this.productFamilyService = productFamilyService;
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
    public ProductFamily createProductFamily(@RequestBody ProductFamily productFamily) {
        return productFamilyService.saveProductFamily(productFamily);
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