package com.project.restau_management.service;

import com.project.restau_management.entity.PaymentMethod;
import com.project.restau_management.repository.PaymentMethodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentMethodService {

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    public List<PaymentMethod> getAllPaymentMethods() {
        return paymentMethodRepository.findAll();
    }

    public Optional<PaymentMethod> getPaymentMethodById(int id) {
        return paymentMethodRepository.findById(id);
    }

    public PaymentMethod savePaymentMethod(PaymentMethod paymentMethod) {
        return paymentMethodRepository.save(paymentMethod);
    }

    public void deletePaymentMethod(int id) {
        paymentMethodRepository.deleteById(id);
    }

    public List<PaymentMethod> getActivePaymentMethods() {
        return paymentMethodRepository.findByIsActive(true);
    }

    public Optional<PaymentMethod> findByType(String type) {
        return paymentMethodRepository.findByType(type);
    }

    public List<PaymentMethod> searchByType(String type) {
        return paymentMethodRepository.findByTypeContainingIgnoreCase(type);
    }

    public List<PaymentMethod> searchByName(String name) {
        return paymentMethodRepository.findByNameContainingIgnoreCase(name);
    }
}
