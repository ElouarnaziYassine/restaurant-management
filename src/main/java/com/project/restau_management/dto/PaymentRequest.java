package com.project.restau_management.dto;
import lombok.Data;

@Data
public class PaymentRequest {
    private String method; // "CASH" | "CARD" (must match a row in payment_methods.name)
    private Double amount;
    // getters/setters
}