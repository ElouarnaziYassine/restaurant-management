package com.project.restau_management.controller;

import com.project.restau_management.entity.OrderItem;
import com.project.restau_management.service.OrderItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/order-items")
public class OrderItemController {

    private final OrderItemService orderItemService;

    public OrderItemController(OrderItemService orderItemService) {
        this.orderItemService = orderItemService;
    }

    @GetMapping
    public List<OrderItem> getAllOrderItems() {
        return orderItemService.getAllOrderItems();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderItem> getOrderItemById(@PathVariable int id) {
        return orderItemService.getOrderItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public OrderItem createOrderItem(@RequestBody OrderItem orderItem) {
        return orderItemService.saveOrderItem(orderItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderItem> updateOrderItem(
            @PathVariable int id,
            @RequestBody OrderItem orderItem) {
        if (!orderItemService.getOrderItemById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        orderItem.setOrderItemId(id);
        return ResponseEntity.ok(orderItemService.saveOrderItem(orderItem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrderItem(@PathVariable int id) {
        orderItemService.deleteOrderItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/order/{orderId}")
    public List<OrderItem> getOrderItemsByOrder(@PathVariable int orderId) {
        return orderItemService.getOrderItemsByOrderId(orderId);
    }

    @GetMapping("/product/{productId}")
    public List<OrderItem> getOrderItemsByProduct(@PathVariable int productId) {
        return orderItemService.getOrderItemsByProductId(productId);
    }
}