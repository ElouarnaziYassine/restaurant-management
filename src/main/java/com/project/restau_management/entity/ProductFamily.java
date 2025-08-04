package com.project.restau_management.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "product_families")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductFamily {

    @Id
    private String productFamilyId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "image_alt_text")
    private String imageAltText;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type")
    private String contentType;

    @ManyToOne
    @JoinColumn(name = "category_id") // Foreign key in DB
    @JsonIgnoreProperties("productFamilies") // Avoid recursion if needed
    private Category category;
}