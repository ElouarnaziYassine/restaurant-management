package com.project.restau_management.controller;

import com.project.restau_management.dto.OrderItemDTO;
import com.project.restau_management.dto.OrderRequestDTO;
import com.project.restau_management.dto.OrderResponseDTO;
import com.project.restau_management.entity.*;
import com.project.restau_management.repository.PaymentMethodRepository;
import com.project.restau_management.service.*;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private final PaymentMethodRepository paymentMethodRepository;
    private final PaymentService paymentService;



    public OrderController(OrderService orderService, OrderItemService orderItemService,
                           UserService userService,
                           ClientService clientService,
                           TableService tableService, ProductService productService, PaymentMethodRepository paymentMethodRepository, PaymentService paymentService) {
        this.orderService = orderService;
        this.orderItemService = orderItemService;
        this.userService = userService;
        this.clientService = clientService;
        this.tableService = tableService;
        this.productService = productService;
        this.paymentMethodRepository = paymentMethodRepository;
        this.paymentService = paymentService;
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
    public ResponseEntity<?> assignClientToOrder(
            @PathVariable int orderId,
            @RequestBody Map<String, Object> payload) {
        try {
            // clientId is required
            Object clientIdObj = payload.get("clientId");
            if (clientIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "clientId is required"));
            }
            int clientId = ((Number) clientIdObj).intValue();

            // optional: subscription flag (default true)
            boolean subscription = true;
            if (payload.containsKey("subscription") && payload.get("subscription") instanceof Boolean) {
                subscription = (Boolean) payload.get("subscription");
            }

            Optional<Order> orderOpt = orderService.getOrderById(orderId);
            if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();

            Optional<Client> clientOpt = clientService.getClientById(clientId);
            if (clientOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Client not found with id: " + clientId));
            }

            Order order = orderOpt.get();
            order.setClient(clientOpt.get());

            if (subscription) {
                order.setStatus("PENDING_PAYMENT");
                // ✅ Immediately free the table for subscription orders
                orderService.freeTableIfNoOtherOnGoing(order);
            } else {
                order.setStatus("COMPLETED");
                // If you also want to free the table here, you already do it in completeOrder(...)
                // but since we're not calling completeOrder here, you can also:
                orderService.freeTableIfNoOtherOnGoing(order);
            }

            Order updated = orderService.saveOrder(order);
            return ResponseEntity.ok(OrderResponseDTO.fromEntity(updated));


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

    @PostMapping("/client/{clientId}/settle")
    @Transactional
    public ResponseEntity<?> settleClientPeriod(
            @PathVariable int clientId,
            @RequestParam String from,   // yyyy-MM-dd
            @RequestParam String to,     // yyyy-MM-dd
            @RequestBody Map<String, Object> body
    ) {
        try {
            // 1) Parse window as full days
            LocalDate start = LocalDate.parse(from);
            LocalDate end   = LocalDate.parse(to);
            LocalDateTime fromDt = start.atStartOfDay();
            LocalDateTime toDt   = end.atTime(23, 59, 59, 999000000);

            // 2) Load all PENDING_PAYMENT orders for client in range
            List<Order> pendingOrders = orderService
                    .getOrdersByClientAndDateRange(clientId, from, to) // your existing method
                    .stream()
                    .filter(o -> "PENDING_PAYMENT".equalsIgnoreCase(o.getStatus()))
                    .collect(java.util.stream.Collectors.toList());

            if (pendingOrders.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No pending orders to settle."));
            }

            // 3) Sum totals
            BigDecimal pendingTotal = pendingOrders.stream()
                    .map(o -> o.getTotalAmount() == null ? BigDecimal.ZERO : o.getTotalAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // 4) Parse payments from body
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> payments = (List<Map<String, Object>>) body.get("payments");
            if (payments == null || payments.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "payments[] is required"));
            }
            BigDecimal provided = payments.stream()
                    .map(p -> new BigDecimal(String.valueOf(p.get("amount"))))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // 5) Validate equality (allow tiny epsilon)
            if (pendingTotal.subtract(provided).abs().compareTo(new BigDecimal("0.01")) > 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Amounts must equal the pending total",
                        "pendingTotal", pendingTotal,
                        "provided", provided
                ));
            }

            // 6) Prepare PaymentMethod lookup by name (CASH/CARD)
            // If you use PaymentMethod entity, inject PaymentMethodRepository
            java.util.function.Function<String, PaymentMethod> findMethod = (name) ->
                    paymentMethodRepository.findByNameIgnoreCase(name)
                            .orElseThrow(() -> new IllegalArgumentException("PaymentMethod not found: " + name));

            // 7) Proportionally allocate each payment across orders and mark orders completed
            BigDecimal remainingCash = payments.stream()
                    .filter(p -> "CASH".equalsIgnoreCase(String.valueOf(p.get("method"))))
                    .map(p -> new BigDecimal(String.valueOf(p.get("amount"))))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal remainingCard = payments.stream()
                    .filter(p -> "CARD".equalsIgnoreCase(String.valueOf(p.get("method"))))
                    .map(p -> new BigDecimal(String.valueOf(p.get("amount"))))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            for (Order o : pendingOrders) {
                BigDecimal orderTotal = o.getTotalAmount() == null ? BigDecimal.ZERO : o.getTotalAmount();

                // prorata share
                BigDecimal ratio = pendingTotal.signum()==0 ? BigDecimal.ZERO : orderTotal.divide(pendingTotal, 4, java.math.RoundingMode.HALF_UP);

                BigDecimal cashForOrder = remainingCash.multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP);
                BigDecimal cardForOrder = remainingCard.multiply(ratio).setScale(2, java.math.RoundingMode.HALF_UP);

                // fix rounding last order
                boolean isLast = (o == pendingOrders.get(pendingOrders.size()-1));
                if (isLast) {
                    // snap leftovers
                    cashForOrder = cashForOrder.min(remainingCash);
                    cardForOrder = cardForOrder.min(remainingCard);
                }

                // create payments (skip zeroes)
                if (cashForOrder.compareTo(BigDecimal.ZERO) > 0) {
                    Payment pay = new Payment();
                    pay.setOrder(o);
                    pay.setPaymentMethod(findMethod.apply("CASH"));
                    pay.setAmount(cashForOrder.floatValue());
                    pay.setStatus("COMPLETED");
                    paymentService.savePayment(pay);
                    remainingCash = remainingCash.subtract(cashForOrder);
                }
                if (cardForOrder.compareTo(BigDecimal.ZERO) > 0) {
                    Payment pay = new Payment();
                    pay.setOrder(o);
                    pay.setPaymentMethod(findMethod.apply("CARD"));
                    pay.setAmount(cardForOrder.floatValue());
                    pay.setStatus("COMPLETED");
                    paymentService.savePayment(pay);
                    remainingCard = remainingCard.subtract(cardForOrder);
                }

                // mark order completed
                // ✅ frees the linked table as part of completion
                orderService.completeOrder(o.getOrderId());

            }

            // 8) Return updated orders (so UI can immediately reflect)
            List<Order> updated = orderService.getOrdersByClientAndDateRange(clientId, from, to);
            return ResponseEntity.ok(Map.of(
                    "ordersSettled", pendingOrders.size(),
                    "totalPaid", provided,
                    "orders", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Settlement failed", "details", e.getMessage()));
        }
    }





}