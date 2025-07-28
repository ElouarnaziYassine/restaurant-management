package com.project.restau_management.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderRequestDTO {
    private Long userId;
    private Long clientId;
    private Long tableId;
    private String status;
    private String description;
    private BigDecimal totalAmount;
    private List<OrderItemDTO> items;

}