package com.project.restau_management.controller;

import com.project.restau_management.dto.OrderItemDTO;
import com.project.restau_management.dto.OrderRequestDTO;
import com.project.restau_management.dto.OrderResponseDTO;
import com.project.restau_management.entity.*;
import com.project.restau_management.service.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderItemService orderItemService;
    private final UserService userService;
    private final ClientService clientService;
    private final TableService tableService;
    private final ProductService productService;


    public OrderController(OrderService orderService, OrderItemService orderItemService,
                           UserService userService,
                           ClientService clientService,
                           TableService tableService, ProductService productService) {
        this.orderService = orderService;
        this.orderItemService = orderItemService;
        this.userService = userService;
        this.clientService = clientService;
        this.tableService = tableService;
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequestDTO orderDTO) {
        try {
            // ✅ Step 1: Fetch user
            User user = userService.getUserById(Math.toIntExact(orderDTO.getUserId()))
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + orderDTO.getUserId()));

            // ✅ Step 2: Create basic Order entity
            Order order = new Order();
            order.setUser(user);
            order.setStatus(orderDTO.getStatus() != null ? orderDTO.getStatus() : "ON GOING");
            order.setCreatedAt(LocalDateTime.now());
            order.setTotalAmount(BigDecimal.valueOf(orderDTO.getTotalAmount() != null ? orderDTO.getTotalAmount().floatValue() : 0.0f));

            if (orderDTO.getDescription() != null) {
                order.setDescription(orderDTO.getDescription());
            }

            // ✅ Step 3: Optional client and table
            if (orderDTO.getClientId() != null) {
                Client client = clientService.getClientById(Math.toIntExact(orderDTO.getClientId()))
                        .orElseThrow(() -> new RuntimeException("Client not found with id: " + orderDTO.getClientId()));
                order.setClient(client);
            }

            if (orderDTO.getTableId() != null) {
                RestaurantTable table = tableService.getTableById(Math.toIntExact(orderDTO.getTableId()))
                        .orElseThrow(() -> new RuntimeException("Table not found with id: " + orderDTO.getTableId()));

                if (!table.isAvailable()) {
                    throw new RuntimeException("Table " + table.getTableNumber() + " is already occupied");
                }

                order.setTable(table);
                table.setAvailable(false);
                tableService.saveTable(table);
            }

            // ✅ Step 4: Save the order first
            Order savedOrder = orderService.saveOrder(order);

            BigDecimal calculatedTotal = BigDecimal.ZERO;

            // ✅ Step 5: Process order items (fixed the main issue here)
            if (orderDTO.getItems() != null && !orderDTO.getItems().isEmpty()) {
                for (OrderItemDTO itemDTO : orderDTO.getItems()) { // Changed from OrderItem to OrderItemDTO
                    OrderItem item = new OrderItem();
                    item.setOrder(savedOrder);
                    item.setQuantity(itemDTO.getQuantity());

                    // ✅ Use getUnitPrice() or getPrice() depending on your DTO structure
                    BigDecimal unitPrice = itemDTO.getUnitPrice() != null ? itemDTO.getUnitPrice() :
                            (itemDTO.getPrice() != null ? itemDTO.getPrice() : BigDecimal.ZERO);

                    // Check if unitPrice is greater than zero using compareTo()
                    if (unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
                        // If no valid price provided, we'll try to get it from the product
                        unitPrice = BigDecimal.ZERO;
                    }

                    item.setUnitPrice(BigDecimal.valueOf(unitPrice.floatValue())); // Convert to float if OrderItem uses float

                    // ✅ Calculate subtotal using BigDecimal multiplication
                    BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
                    item.setSubtotal(BigDecimal.valueOf(subtotal.floatValue())); // Convert to float if OrderItem uses float

                    if (itemDTO.getDetails() != null) {
                        item.setDetails(itemDTO.getDetails());
                    }

                    // ✅ Handle product association properly
                    if (itemDTO.getProductId() != null && itemDTO.getProductId() > 0) {
                        // Fetch the product by ID
                        Product product = productService.getProductById(Math.toIntExact(itemDTO.getProductId()))
                                .orElseThrow(() -> new RuntimeException("Product not found with id: " + itemDTO.getProductId()));
                        item.setProduct(product);

                        // If unit price wasn't provided or is zero, use product price
                        if (itemDTO.getUnitPrice() == null && itemDTO.getPrice() == null ||
                                unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
                            BigDecimal productPrice = product.getPrice();
                            item.setUnitPrice(BigDecimal.valueOf(productPrice.floatValue())); // Convert to float if needed
                            BigDecimal calculatedSubtotal = productPrice.multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
                            item.setSubtotal(BigDecimal.valueOf(calculatedSubtotal.floatValue())); // Convert to float if needed
                            subtotal = calculatedSubtotal; // Keep BigDecimal for total calculation
                        }
                    }

                    calculatedTotal = calculatedTotal.add(item.getSubtotal());
                    orderItemService.saveOrderItem(item);
                }
            }

            // ✅ Step 6: Update totalAmount and save again
            savedOrder.setTotalAmount(BigDecimal.valueOf(calculatedTotal.floatValue()));
            orderService.saveOrder(savedOrder);

            return ResponseEntity.status(201).body(OrderResponseDTO.fromEntity(savedOrder));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "timestamp", LocalDateTime.now()
            ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> updateOrder(
            @PathVariable int id,
            @RequestBody OrderRequestDTO orderDTO) {

        Optional<Order> existingOrder = orderService.getOrderById(id);
        if (existingOrder.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order orderToUpdate = existingOrder.get();

        // Update order fields
        if (orderDTO.getDescription() != null) orderToUpdate.setDescription(orderDTO.getDescription());
        if (orderDTO.getStatus() != null) orderToUpdate.setStatus(orderDTO.getStatus());

        // Delete existing items
        List<OrderItem> oldItems = orderItemService.getOrderItemsByOrder(orderToUpdate);
        oldItems.forEach(item -> orderItemService.deleteOrderItem(item.getOrderItemId()));

        BigDecimal newTotal = BigDecimal.ZERO;

        if (orderDTO.getItems() != null) {
            for (OrderItemDTO itemDTO : orderDTO.getItems()) {
                OrderItem newItem = new OrderItem();
                newItem.setOrder(orderToUpdate);
                newItem.setQuantity(itemDTO.getQuantity());
                newItem.setUnitPrice(itemDTO.getUnitPrice());
                newItem.setSubtotal(itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
                newItem.setDetails(itemDTO.getDetails());

                Product product = productService.getProductById(Math.toIntExact(itemDTO.getProductId()))
                        .orElseThrow(() -> new RuntimeException("Product not found: " + itemDTO.getProductId()));
                newItem.setProduct(product);

                newTotal = newTotal.add(newItem.getSubtotal());

                orderItemService.saveOrderItem(newItem);
            }
        }

        orderToUpdate.setTotalAmount(newTotal);
        Order updatedOrder = orderService.saveOrder(orderToUpdate);

        return ResponseEntity.ok(OrderResponseDTO.fromEntity(updatedOrder));
    }

    @PutMapping("/{orderId}/quantities")
    public ResponseEntity<Order> updateQuantities(
            @PathVariable Long orderId,
            @RequestBody List<OrderItemDTO> updatedItems) {
        try {
            Order updatedOrder = orderService.updateOrderQuantities(orderId, updatedItems);
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            e.printStackTrace(); // Log full stack trace
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
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

    @PutMapping("/{orderId}/assign-client")
    public ResponseEntity<?> assignClientToOrder(@PathVariable int orderId, @RequestBody Map<String, Integer> payload) {
        try {
            int clientId = payload.get("clientId");

            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Optional<Client> clientOpt = clientService.getClientById(clientId);
            if (clientOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Client not found with id: " + clientId));
            }

            Order order = orderOpt.get();
            Client client = clientOpt.get();

            order.setClient(client);
            order.setStatus("COMPLETED"); // ✅ Mark as paid via subscription

            Order updatedOrder = orderService.saveOrder(order);

            return ResponseEntity.ok(OrderResponseDTO.fromEntity(updatedOrder));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to assign client to order", "details", e.getMessage()));
        }
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<Order>> getOrdersByClientAndMonth(
            @PathVariable int clientId,
            @RequestParam(required = false) String from, // ISO date e.g. 2025-08-01
            @RequestParam(required = false) String to    // ISO date e.g. 2025-08-31
    ) {
        // Optional range (month) filter
        List<Order> orders = orderService.getOrdersByClientAndDateRange(clientId, from, to);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable int id) {
        return orderService.getOrderById(id)
                .map(o -> ResponseEntity.ok(OrderResponseDTO.fromEntity(o)))
                .orElse(ResponseEntity.notFound().build());
    }




}