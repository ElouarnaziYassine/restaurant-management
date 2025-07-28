package com.project.restau_management.dto;

import com.project.restau_management.entity.Order;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderResponseDTO {
    private int orderId;
    private String description;
    private String status;
    private BigDecimal totalAmount;
    private String createdAt;
    private int userId;

    // Static conversion method
    public static OrderResponseDTO fromEntity(Order order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderId(order.getOrderId());
        dto.setDescription(order.getDescription());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setCreatedAt(order.getCreatedAt().toString());
        return dto;
    }

}