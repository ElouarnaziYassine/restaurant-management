package com.project.restau_management.dto;

import java.util.List;
import lombok.Data;

@Data
public class BulkPaymentRequest {
    private Integer orderId;
    private java.util.List<PaymentRequest> payments;
    // getters/setters
}