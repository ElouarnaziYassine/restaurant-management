package com.project.restau_management.entity;

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
}