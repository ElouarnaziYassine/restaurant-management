package com.project.restau_management.controller;

import com.project.restau_management.entity.Category;
import com.project.restau_management.entity.Product;
import com.project.restau_management.entity.ProductFamily;
import com.project.restau_management.service.CategoryService;
import com.project.restau_management.service.ProductFamilyService;
import com.project.restau_management.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final ProductFamilyService productFamilyService;

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    public ProductController(ProductService productService,
                             CategoryService categoryService,
                             ProductFamilyService productFamilyService) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.productFamilyService = productFamilyService;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Integer id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Original JSON-based endpoint (backwards compatibility)
    @PostMapping("/json")
    public Product createProduct(@RequestBody Product product) {
        return productService.saveProduct(product);
    }

    // New multipart endpoint for file uploads
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createProduct(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("price") String priceStr,
            @RequestParam("categoryId") String categoryId,
            @RequestParam("productFamilyId") String productFamilyId,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {

        try {
            // Parse category ID as integer
            int categoryIdInt;
            try {
                categoryIdInt = Integer.parseInt(categoryId);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("Invalid category ID format");
            }

            // Validate category
            Optional<Category> categoryOpt = categoryService.getCategoryById(categoryIdInt);
            if (!categoryOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Invalid category ID");
            }

            // Validate product family
            Optional<ProductFamily> productFamilyOpt = productFamilyService.getProductFamilyById(productFamilyId);
            if (!productFamilyOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Invalid product family ID");
            }

            // Parse price
            BigDecimal price;
            try {
                price = new BigDecimal(priceStr);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("Invalid price format");
            }

            // Create new Product
            Product product = new Product();
            // productId will be auto-generated, so we don't set it
            product.setName(name);
            product.setDescription(description);
            product.setPrice(price);
            product.setNotes(notes);
            product.setCategory(categoryOpt.get());
            product.setProductFamily(productFamilyOpt.get());

            // Handle image upload if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                // Validate file type
                String contentType = imageFile.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    return ResponseEntity.badRequest().body("Please upload a valid image file");
                }

                // Validate file size (5MB limit)
                long maxSize = 5 * 1024 * 1024; // 5MB
                if (imageFile.getSize() > maxSize) {
                    return ResponseEntity.badRequest().body("File size must be less than 5MB");
                }

                try {
                    // Store the file and get the URL
                    String imageUrl = storeFile(imageFile, "products");

                    // Set image-related fields
                    product.setImageUrl(imageUrl);
                    product.setOriginalFilename(imageFile.getOriginalFilename());
                    product.setFileSize(imageFile.getSize());
                    product.setContentType(imageFile.getContentType());

                } catch (Exception e) {
                    return ResponseEntity.status(500).body("Failed to upload image: " + e.getMessage());
                }
            }

            Product saved = productService.saveProduct(product);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating product: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable int id,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("price") String priceStr,
            @RequestParam("categoryId") String categoryId,
            @RequestParam("productFamilyId") String productFamilyId,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {

        try {
            Optional<Product> existingProductOpt = productService.getProductById(id);
            if (!existingProductOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            // Parse category ID as integer
            int categoryIdInt;
            try {
                categoryIdInt = Integer.parseInt(categoryId);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("Invalid category ID format");
            }

            Optional<Category> categoryOpt = categoryService.getCategoryById(categoryIdInt);
            if (!categoryOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Invalid category ID");
            }

            Optional<ProductFamily> productFamilyOpt = productFamilyService.getProductFamilyById(productFamilyId);
            if (!productFamilyOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Invalid product family ID");
            }

            BigDecimal price;
            try {
                price = new BigDecimal(priceStr);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("Invalid price format");
            }

            Product product = existingProductOpt.get();
            product.setName(name);
            product.setDescription(description);
            product.setPrice(price);
            product.setNotes(notes);
            product.setCategory(categoryOpt.get());
            product.setProductFamily(productFamilyOpt.get());

            // Handle image update
            if (imageFile != null && !imageFile.isEmpty()) {
                // Delete old image if exists
                if (product.getImageUrl() != null) {
                    try {
                        deleteFile(product.getImageUrl());
                    } catch (Exception e) {
                        System.err.println("Failed to delete old image: " + e.getMessage());
                    }
                }

                // Validate and store new image
                String contentType = imageFile.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    return ResponseEntity.badRequest().body("Please upload a valid image file");
                }

                long maxSize = 5 * 1024 * 1024; // 5MB
                if (imageFile.getSize() > maxSize) {
                    return ResponseEntity.badRequest().body("File size must be less than 5MB");
                }

                String imageUrl = storeFile(imageFile, "products");
                product.setImageUrl(imageUrl);
                product.setOriginalFilename(imageFile.getOriginalFilename());
                product.setFileSize(imageFile.getSize());
                product.setContentType(imageFile.getContentType());
            }

            Product updated = productService.saveProduct(product);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating product: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id) {
        try {
            Optional<Product> productOpt = productService.getProductById(id);
            if (productOpt.isPresent() && productOpt.get().getImageUrl() != null) {
                // Delete associated image file
                try {
                    deleteFile(productOpt.get().getImageUrl());
                } catch (Exception e) {
                    System.err.println("Failed to delete image file: " + e.getMessage());
                }
            }

            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/search")
    public List<Product> searchProducts(@RequestParam String name) {
        return productService.searchByName(name);
    }

    @GetMapping("/category/{categoryId}")
    public List<Product> getProductsByCategory(@PathVariable int categoryId) {
        return productService.getProductsByCategoryId(categoryId);
    }

    @GetMapping("/family/{familyId}")
    public List<Product> getProductsByFamily(@PathVariable String familyId) {
        return productService.getProductsByFamilyId(familyId);
    }

    @GetMapping("/price-range")
    public List<Product> getProductsByPriceRange(
            @RequestParam BigDecimal min,
            @RequestParam BigDecimal max) {
        return productService.getProductsByPriceRange(min, max);
    }

    // Private helper methods for file handling
    private String storeFile(MultipartFile file, String subDirectory) throws IOException {
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, subDirectory);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

        // Store the file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Return the relative path that can be used to access the file
        return "/" + subDirectory + "/" + uniqueFilename;
    }

    private void deleteFile(String filePath) throws IOException {
        if (filePath != null && !filePath.isEmpty()) {
            // Remove leading slash if present
            String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
            Path fileToDelete = Paths.get(uploadDir, cleanPath);

            if (Files.exists(fileToDelete)) {
                Files.delete(fileToDelete);
            }
        }
    }
}