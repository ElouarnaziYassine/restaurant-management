package com.project.restau_management.service;

import com.project.restau_management.entity.ProductFamily;
import com.project.restau_management.repository.ProductFamilyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProductFamilyService {

    @Autowired
    private ProductFamilyRepository productFamilyRepository;

    public List<ProductFamily> getAllProductFamilies() {
        return productFamilyRepository.findAll();
    }

    public Optional<ProductFamily> getProductFamilyById(String id) {
        return productFamilyRepository.findById(id);
    }

    public ProductFamily saveProductFamily(ProductFamily productFamily) {
        return productFamilyRepository.save(productFamily);
    }

    public void deleteProductFamily(String id) {
        productFamilyRepository.deleteById(id);
    }

    public Optional<ProductFamily> findByName(String name) {
        return productFamilyRepository.findByName(name);
    }

    public List<ProductFamily> searchByName(String name) {
        return productFamilyRepository.findByNameContainingIgnoreCase(name);
    }

    public List<ProductFamily> getFamiliesByCategoryId(int categoryId) {
        return productFamilyRepository.findByCategory_CategoryId(categoryId);
    }

}
