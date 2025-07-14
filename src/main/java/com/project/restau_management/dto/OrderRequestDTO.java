package com.project.restau_management.dto;

import lombok.Data;

@Data
public class OrderRequestDTO {
    private String description;
    private String status;
    private float totalAmount;
    private Integer clientId;
    private Integer tableId;
    private Integer userId;
}