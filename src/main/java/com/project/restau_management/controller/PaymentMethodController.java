package com.project.restau_management.controller;

import com.project.restau_management.entity.PaymentMethod;
import com.project.restau_management.service.PaymentMethodService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    public PaymentMethodController(PaymentMethodService paymentMethodService) {
        this.paymentMethodService = paymentMethodService;
    }

    @GetMapping
    public List<PaymentMethod> getAllPaymentMethods() {
        return paymentMethodService.getAllPaymentMethods();
    }

    @GetMapping("/active")
    public List<PaymentMethod> getActivePaymentMethods() {
        return paymentMethodService.getActivePaymentMethods();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentMethod> getPaymentMethodById(@PathVariable int id) {
        return paymentMethodService.getPaymentMethodById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public PaymentMethod createPaymentMethod(@RequestBody PaymentMethod paymentMethod) {
        return paymentMethodService.savePaymentMethod(paymentMethod);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentMethod> updatePaymentMethod(
            @PathVariable int id,
            @RequestBody PaymentMethod paymentMethod) {
        if (!paymentMethodService.getPaymentMethodById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        paymentMethod.setMethodId(id);
        return ResponseEntity.ok(paymentMethodService.savePaymentMethod(paymentMethod));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaymentMethod(@PathVariable int id) {
        paymentMethodService.deletePaymentMethod(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public List<PaymentMethod> searchPaymentMethods(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String name) {
        if (type != null) {
            return paymentMethodService.searchByType(type);
        } else if (name != null) {
            return paymentMethodService.searchByName(name);
        }
        return paymentMethodService.getAllPaymentMethods();
    }
}
