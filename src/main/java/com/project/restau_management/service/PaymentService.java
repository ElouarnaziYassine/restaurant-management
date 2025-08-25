package com.project.restau_management.service;

import com.project.restau_management.dto.PaymentRequest;
import com.project.restau_management.entity.Order;
import com.project.restau_management.entity.Payment;
import com.project.restau_management.entity.PaymentMethod;
import com.project.restau_management.repository.PaymentMethodRepository;
import com.project.restau_management.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private final PaymentRepository paymentRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final OrderService orderService;

    public PaymentService(PaymentRepository pr, PaymentMethodRepository pmr, OrderService os) {
        this.paymentRepository = pr; this.paymentMethodRepository = pmr; this.orderService = os;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> getPaymentById(int id) {
        return paymentRepository.findById(id);
    }

    public Payment savePayment(Payment payment) {
        return paymentRepository.save(payment);
    }

    public void deletePayment(int id) {
        paymentRepository.deleteById(id);
    }

    public Optional<Payment> getPaymentByOrder(Order order) {
        return paymentRepository.findByOrder(order);
    }

    public Optional<Payment> getPaymentByOrderId(int orderId) {
        return paymentRepository.findByOrderId(orderId);
    }

    public List<Payment> getPaymentsByStatus(String status) {
        return paymentRepository.findByStatus(status);
    }

    public List<Payment> getPaymentsByMethod(PaymentMethod paymentMethod) {
        return paymentRepository.findByPaymentMethod(paymentMethod);
    }

    public List<Payment> getPaymentsByDateRange(LocalDateTime start, LocalDateTime end) {
        return paymentRepository.findByTimestampBetween(start, end);
    }

    public Optional<Payment> findByTransactionId(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId);
    }

    public Optional<Payment> findByReceiptNumber(String receiptNumber) {
        return paymentRepository.findByReceiptNumber(receiptNumber);
    }

    public Double getTotalRevenue(String status, LocalDateTime fromDate) {
        return paymentRepository.getTotalAmountByStatusAndDate(status, fromDate);
    }

    public Double getTodaysRevenue() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return paymentRepository.getTotalAmountByStatusAndDate("COMPLETED", startOfDay);
    }

    public void recordPaymentsForOrder(Integer orderId, java.util.List<PaymentRequest> parts) {
        Order order = orderService.getOrderById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        double sum = 0.0;
        for (PaymentRequest p : parts) {
            PaymentMethod method = paymentMethodRepository.findByNameIgnoreCase(p.getMethod())
                    .orElseThrow(() -> new IllegalArgumentException("PaymentMethod not found: " + p.getMethod()));

            Payment pay = new Payment();
            pay.setOrder(order);
            pay.setPaymentMethod(method);      // Payment has ManyToOne PaymentMethod (entity)
            pay.setAmount(p.getAmount().floatValue());
            pay.setStatus("COMPLETED");        // or "RECORDED"
            // timestamp via @PrePersist
            paymentRepository.save(pay);

            sum += (p.getAmount() != null ? p.getAmount() : 0);
        }

        double orderTotal = order.getTotalAmount() == null ? 0.0 : order.getTotalAmount().doubleValue();
        if (Math.abs(sum - orderTotal) < 0.01) {
            order.setStatus("COMPLETED");
            orderService.saveOrder(order);
        }
    }


}