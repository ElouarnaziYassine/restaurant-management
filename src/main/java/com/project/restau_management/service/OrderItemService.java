package com.project.restau_management.service;

import com.project.restau_management.entity.Order;
import com.project.restau_management.entity.OrderItem;
import com.project.restau_management.entity.Product;
import com.project.restau_management.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class OrderItemService {

    @Autowired
    private OrderItemRepository orderItemRepository;

    public List<OrderItem> getAllOrderItems() {
        return orderItemRepository.findAll();
    }

    public Optional<OrderItem> getOrderItemById(int id) {
        return orderItemRepository.findById(id);
    }

    public OrderItem saveOrderItem(OrderItem orderItem) {
        // Calculate subtotal
        orderItem.setSubtotal(orderItem.getUnitPrice() * orderItem.getQuantity());
        return orderItemRepository.save(orderItem);
    }

    public void deleteOrderItem(int id) {
        orderItemRepository.deleteById(id);
    }

    public List<OrderItem> getOrderItemsByOrder(Order order) {
        return orderItemRepository.findByOrder(order);
    }

    public List<OrderItem> getOrderItemsByOrderId(int orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    public List<OrderItem> getOrderItemsByProduct(Product product) {
        return orderItemRepository.findByProduct(product);
    }

    public List<OrderItem> getOrderItemsByProductId(int productId) {
        return orderItemRepository.findByProductId(productId);
    }

    public Long getTotalQuantityByProduct(int productId) {
        return orderItemRepository.getTotalQuantityByProductId(productId);
    }
}
