package com.project.restau_management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tables")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tablee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int tableId;

    @Column(nullable = false, unique = true)
    private int tableNumber;

    @Column(nullable = false)
    private int capacity;

    @Column(nullable = false)
    private boolean isAvailable;
}
