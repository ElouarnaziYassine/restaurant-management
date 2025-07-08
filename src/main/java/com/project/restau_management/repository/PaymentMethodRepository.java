package com.project.restau_management.repository;

import com.project.restau_management.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Integer> {
    List<PaymentMethod> findByIsActive(boolean isActive);
    Optional<PaymentMethod> findByType(String type);
    List<PaymentMethod> findByTypeContainingIgnoreCase(String type);
    List<PaymentMethod> findByNameContainingIgnoreCase(String name);
}