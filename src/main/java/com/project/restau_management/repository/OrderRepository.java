package com.project.restau_management.repository;

import com.project.restau_management.entity.Client;
import com.project.restau_management.entity.Order;
import com.project.restau_management.entity.User;
import jakarta.persistence.Table;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByStatus(String status);
    List<Order> findByUser(User user);
    List<Order> findByClient(Client client);
    List<Order> findByTable(Table table);
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT o FROM Order o WHERE o.status = :status AND o.createdAt >= :date")
    List<Order> findByStatusAndCreatedAfter(@Param("status") String status, @Param("date") LocalDateTime date);

    @Query("SELECT o FROM Order o WHERE o.user.userId = :userId")
    List<Order> findByUserId(@Param("userId") int userId);

    @Query("SELECT o FROM Order o WHERE o.table.tableId = :tableId AND o.status = :status")
    List<Order> findByTableIdAndStatus(@Param("tableId") int tableId, @Param("status") String status);
}