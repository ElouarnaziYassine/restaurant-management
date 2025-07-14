package com.project.restau_management.controller;

import com.project.restau_management.dto.OrderRequestDTO;
import com.project.restau_management.dto.OrderResponseDTO;
import com.project.restau_management.entity.*;
import com.project.restau_management.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final ClientService clientService;
    private final TableService tableService;

    public OrderController(OrderService orderService,
                           UserService userService,
                           ClientService clientService,
                           TableService tableService) {
        this.orderService = orderService;
        this.userService = userService;
        this.clientService = clientService;
        this.tableService = tableService;
    }

    // [Keep all your existing methods unchanged until the createOrder method]

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequestDTO orderDTO) {
        try {
            // 1. Validate and get required user
            User user = userService.getUserById(orderDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + orderDTO.getUserId()));

            // 2. Create new order with required fields
            Order order = new Order();
            order.setUser(user);
            order.setStatus(orderDTO.getStatus() != null ? orderDTO.getStatus() : "CREATED");
            order.setCreatedAt(LocalDateTime.now());

            // 3. Set optional fields
            if (orderDTO.getDescription() != null) {
                order.setDescription(orderDTO.getDescription());
            }

            if (orderDTO.getTotalAmount() > 0) {
                order.setTotalAmount(orderDTO.getTotalAmount());
            }

            // 4. Handle optional client
            if (orderDTO.getClientId() != null) {
                Client client = clientService.getClientById(orderDTO.getClientId())
                        .orElseThrow(() -> new RuntimeException("Client not found with id: " + orderDTO.getClientId()));
                order.setClient(client);
            }

            // 5. Handle optional table
            if (orderDTO.getTableId() != null) {
                RestaurantTable table = tableService.getTableById(orderDTO.getTableId())
                        .orElseThrow(() -> new RuntimeException("Table not found with id: " + orderDTO.getTableId()));

                if (!table.isAvailable()) {
                    throw new RuntimeException("Table " + table.getTableNumber() + " is already occupied");
                }

                order.setTable(table);
                table.setAvailable(false);
                tableService.saveTable(table);
            }

            // 6. Save and return the order
            Order savedOrder = orderService.saveOrder(order);
            return ResponseEntity.status(201).body(OrderResponseDTO.fromEntity(savedOrder));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", e.getMessage(),
                            "timestamp", LocalDateTime.now()
                    ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> updateOrder(
            @PathVariable int id,
            @RequestBody OrderRequestDTO orderDTO) {

        // Get existing order
        Optional<Order> existingOrder = orderService.getOrderById(id);
        if (existingOrder.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Update only allowed fields
        Order orderToUpdate = existingOrder.get();
        if (orderDTO.getDescription() != null) {
            orderToUpdate.setDescription(orderDTO.getDescription());
        }
        if (orderDTO.getStatus() != null) {
            orderToUpdate.setStatus(orderDTO.getStatus());
        }
        if (orderDTO.getTotalAmount() > 0) {
            orderToUpdate.setTotalAmount(orderDTO.getTotalAmount());
        }

        // Save updated order
        Order updatedOrder = orderService.saveOrder(orderToUpdate);
        return ResponseEntity.ok(OrderResponseDTO.fromEntity(updatedOrder));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable int id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public List<Order> getOrdersByStatus(@PathVariable String status) {
        return orderService.getOrdersByStatus(status);
    }

    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUserId(@PathVariable int userId) {
        return orderService.getOrdersByUserId(userId);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Order> completeOrder(@PathVariable int id) {
        Order completedOrder = orderService.completeOrder(id);
        return completedOrder != null ?
                ResponseEntity.ok(completedOrder) :
                ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable int id) {
        Order cancelledOrder = orderService.cancelOrder(id);
        return cancelledOrder != null ?
                ResponseEntity.ok(cancelledOrder) :
                ResponseEntity.notFound().build();
    }

    @GetMapping("/today")
    public List<Order> getTodaysOrders() {
        return orderService.getTodaysOrders();
    }

}