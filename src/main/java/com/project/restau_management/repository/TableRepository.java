package com.project.restau_management.repository;

import com.project.restau_management.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TableRepository extends JpaRepository<RestaurantTable, Integer> {
    Optional<RestaurantTable> findByTableNumber(int tableNumber);
    List<RestaurantTable> findByIsAvailable(boolean isAvailable);
    List<RestaurantTable> findByCapacityGreaterThanEqual(int capacity);
    List<RestaurantTable> findByIsAvailableAndCapacityGreaterThanEqual(boolean isAvailable, int capacity);
}