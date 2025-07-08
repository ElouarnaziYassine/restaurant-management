package com.project.restau_management.repository;

import com.project.restau_management.entity.Order;
import com.project.restau_management.entity.Payment;
import com.project.restau_management.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByOrder(Order order);
    List<Payment> findByStatus(String status);
    List<Payment> findByPaymentMethod(PaymentMethod paymentMethod);
    List<Payment> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
    Optional<Payment> findByTransactionId(String transactionId);
    Optional<Payment> findByReceiptNumber(String receiptNumber);

    @Query("SELECT p FROM Payment p WHERE p.order.orderId = :orderId")
    Optional<Payment> findByOrderId(@Param("orderId") int orderId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = :status AND p.timestamp >= :date")
    Double getTotalAmountByStatusAndDate(@Param("status") String status, @Param("date") LocalDateTime date);
}