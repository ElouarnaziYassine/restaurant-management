package com.project.restau_management.service;

import com.project.restau_management.dto.OrderItemDTO;
import com.project.restau_management.entity.Client;
import com.project.restau_management.entity.Order;
import com.project.restau_management.entity.OrderItem;
import com.project.restau_management.entity.User;
import com.project.restau_management.repository.OrderItemRepository;
import com.project.restau_management.repository.OrderRepository;
import jakarta.persistence.Table;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private OrderItemRepository orderItemRepository;


    @Autowired
    private TableService tableService;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Optional<Order> getOrderById(int id) {
        return orderRepository.findById(id);
    }

    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    public void deleteOrder(int id) {
        orderRepository.deleteById(id);
    }

    public List<Order> getOrdersByStatus(String status) {
        return orderRepository.findByStatusWithItems(status);
    }

    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUser(user);
    }

    public List<Order> getOrdersByUserId(int userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getOrdersByClient(Client client) {
        return orderRepository.findByClient(client);
    }

    public List<Order> getOrdersByTable(Table table) {
        return orderRepository.findByTable(table);
    }

    public List<Order> getOrdersByTableIdAndStatus(int tableId, String status) {
        return orderRepository.findByTableIdAndStatus(tableId, status);
    }

    public List<Order> getOrdersByDateRange(LocalDateTime start, LocalDateTime end) {
        return orderRepository.findByCreatedAtBetween(start, end);
    }

    public List<Order> getTodaysOrders() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
    }

    public Order completeOrder(int orderId) {
        Optional<Order> order = orderRepository.findById(orderId);
        if (order.isPresent()) {
            order.get().setStatus("COMPLETED");
            order.get().setUpdatedAt(LocalDateTime.now());

            // Free up the table
            if (order.get().getTable() != null) {
                tableService.setTableAvailability(order.get().getTable().getTableId(), true);
            }

            return orderRepository.save(order.get());
        }
        return null;
    }

    public Order cancelOrder(int orderId) {
        Optional<Order> order = orderRepository.findById(orderId);
        if (order.isPresent()) {
            order.get().setStatus("CANCELLED");
            order.get().setUpdatedAt(LocalDateTime.now());

            // Free up the table
            if (order.get().getTable() != null) {
                tableService.setTableAvailability(order.get().getTable().getTableId(), true);
            }

            return orderRepository.save(order.get());
        }
        return null;
    }

    public Order updateOrderQuantities(Long orderId, List<OrderItemDTO> updatedItems) {
        System.out.println("🔁 Updating order ID: " + orderId);
        System.out.println("📦 Payload: " + updatedItems);

        Optional<Order> optionalOrder = orderRepository.findById(orderId.intValue());
        if (optionalOrder.isEmpty()) {
            throw new RuntimeException("❌ Order not found with ID: " + orderId);
        }

        Order order = optionalOrder.get();
        BigDecimal newTotal = BigDecimal.ZERO;

        for (OrderItemDTO dto : updatedItems) {
            System.out.println("➡️ Item: " + dto.getOrderItemId() + " Quantity: " + dto.getQuantity());

            OrderItem item = orderItemRepository.findById(Math.toIntExact(dto.getOrderItemId()))
                    .orElseThrow(() -> new RuntimeException("❌ Order item not found: " + dto.getOrderItemId()));

            item.setQuantity(dto.getQuantity());
            BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(dto.getQuantity()));
            item.setSubtotal(subtotal);

            newTotal = newTotal.add(subtotal);
            orderItemRepository.save(item);
        }

        order.setTotalAmount(newTotal);
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    public List<Order> getOrdersByClientAndDateRange(int clientId, String from, String to) {
        // If no range provided, return all for client
        if ((from == null || from.isBlank()) || (to == null || to.isBlank())) {
            return orderRepository.findByClient_ClientIdOrderByCreatedAtDesc(clientId);
        }
        return orderRepository.findByClient_ClientIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                clientId, LocalDateTime.parse(from + "T00:00:00"), LocalDateTime.parse(to + "T23:59:59"));
    }

    public List<Order> getOrdersByClientAndDateRangeWithStatus(int clientId, String from, String to, String status) {
        // Implement using your repository. Example:
        // return orderRepository.findByClientIdAndCreatedAtBetweenAndStatus(
        //     clientId, LocalDate.parse(from).atStartOfDay(), LocalDate.parse(to).atTime(23,59,59), status
        // );
        throw new UnsupportedOperationException("Implement in service/repo");
    }

    @Transactional
    public void freeTableIfNoOtherOnGoing(Order order) {
        if (order == null || order.getTable() == null) return;

        int tableId = order.getTable().getTableId();

        // If you never allow multiple orders per table, you can skip this "others" check
        boolean others = orderRepository.existsByTable_TableIdAndStatusAndOrderIdNot(
                tableId, "ON GOING", order.getOrderId());

        if (!others) {
            tableService.setTableAvailability(tableId, true); // mark table FREE
        }

        // Optional but recommended: unlink to avoid future accidental locks
        order.setTable(null);
    }


}
