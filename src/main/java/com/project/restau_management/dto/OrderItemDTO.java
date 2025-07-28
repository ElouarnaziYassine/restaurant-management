package com.project.restau_management.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemDTO {
    private Long orderItemId;
    private Long productId;
    private Integer quantity;
    private BigDecimal unitPrice;  // or price
    private BigDecimal price;      // alternative field name
    private String details;
}

