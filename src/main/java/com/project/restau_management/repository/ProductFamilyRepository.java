package com.project.restau_management.repository;


import com.project.restau_management.entity.ProductFamily;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ProductFamilyRepository extends JpaRepository<ProductFamily, String> {
    Optional<ProductFamily> findByName(String name);
    List<ProductFamily> findByNameContainingIgnoreCase(String name);
}