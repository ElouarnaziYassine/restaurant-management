package com.project.restau_management.controller;

import com.project.restau_management.dto.ProductFamilyDTO;
import com.project.restau_management.entity.Category;
import com.project.restau_management.entity.ProductFamily;
import com.project.restau_management.service.CategoryService;
import com.project.restau_management.service.ProductFamilyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-families")
public class ProductFamilyController {

    private final ProductFamilyService productFamilyService;
    private final CategoryService categoryService;

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    public ProductFamilyController(ProductFamilyService productFamilyService,
                                   CategoryService categoryService) {
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

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createProductFamily(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("categoryId") String categoryId,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "imageAltText", required = false) String imageAltText) {

        try {
            // Validate category
            Optional<Category> categoryOpt = categoryService.getCategoryById(Integer.parseInt(categoryId));
            if (!categoryOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Invalid category ID");
            }

            // Create new ProductFamily
            ProductFamily family = new ProductFamily();
            family.setProductFamilyId(UUID.randomUUID().toString());
            family.setName(name);
            family.setDescription(description);
            family.setImageAltText(imageAltText);
            family.setCategory(categoryOpt.get());

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
                    String imageUrl = storeFile(imageFile, "product-families");

                    // Set image-related fields
                    family.setImageUrl(imageUrl);
                    family.setOriginalFilename(imageFile.getOriginalFilename());
                    family.setFileSize(imageFile.getSize());
                    family.setContentType(imageFile.getContentType());

                } catch (Exception e) {
                    return ResponseEntity.status(500).body("Failed to upload image: " + e.getMessage());
                }
            }

            ProductFamily saved = productFamilyService.saveProductFamily(family);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating product family: " + e.getMessage());
        }
    }

    // Alternative endpoint for JSON-based creation (backwards compatibility)
    @PostMapping("/json")
    public ResponseEntity<?> createProductFamilyFromJson(@RequestBody ProductFamilyDTO dto) {
        try {
            Optional<Category> categoryOpt = categoryService.getCategoryById(Integer.parseInt(dto.categoryId));
            if (!categoryOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Invalid category ID");
            }

            ProductFamily family = new ProductFamily();
            family.setProductFamilyId(UUID.randomUUID().toString());
            family.setName(dto.name);
            family.setDescription(dto.description);
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
    public ResponseEntity<?> updateProductFamily(
            @PathVariable String id,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("categoryId") String categoryId,
            @RequestParam(value = "image", required = false) MultipartFile imageFile,
            @RequestParam(value = "imageAltText", required = false) String imageAltText,
            @RequestParam(value = "keepExistingImage", required = false, defaultValue = "false") boolean keepExistingImage) {

        try {
            Optional<ProductFamily> existingFamilyOpt = productFamilyService.getProductFamilyById(id);
            if (!existingFamilyOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Optional<Category> categoryOpt = categoryService.getCategoryById(Integer.parseInt(categoryId));
            if (!categoryOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Invalid category ID");
            }

            ProductFamily family = existingFamilyOpt.get();
            family.setName(name);
            family.setDescription(description);
            family.setImageAltText(imageAltText);
            family.setCategory(categoryOpt.get());

            // Handle image update
            if (imageFile != null && !imageFile.isEmpty()) {
                // Delete old image if exists
                if (family.getImageUrl() != null) {
                    try {
                        deleteFile(family.getImageUrl());
                    } catch (Exception e) {
                        // Log but don't fail the update
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

                String imageUrl = storeFile(imageFile, "product-families");
                family.setImageUrl(imageUrl);
                family.setOriginalFilename(imageFile.getOriginalFilename());
                family.setFileSize(imageFile.getSize());
                family.setContentType(imageFile.getContentType());
            }

            ProductFamily updated = productFamilyService.saveProductFamily(family);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating product family: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProductFamily(@PathVariable String id) {
        try {
            Optional<ProductFamily> familyOpt = productFamilyService.getProductFamilyById(id);
            if (familyOpt.isPresent() && familyOpt.get().getImageUrl() != null) {
                // Delete associated image file
                try {
                    deleteFile(familyOpt.get().getImageUrl());
                } catch (Exception e) {
                    // Log but don't fail the deletion
                    System.err.println("Failed to delete image file: " + e.getMessage());
                }
            }

            productFamilyService.deleteProductFamily(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/search")
    public List<ProductFamily> searchProductFamilies(@RequestParam String name) {
        return productFamilyService.searchByName(name);
    }

    @GetMapping("/by-category/{categoryId}")
    public List<ProductFamily> getByCategory(@PathVariable int categoryId) {
        return productFamilyService.getFamiliesByCategoryId(categoryId);
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