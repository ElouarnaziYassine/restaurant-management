package com.project.restau_management.service;

import com.project.restau_management.entity.RestaurantTable;
import com.project.restau_management.repository.TableRepository;
import jakarta.persistence.Table;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TableService {

    @Autowired
    private TableRepository tableRepository;

    public List<RestaurantTable> getAllTables() {
        return tableRepository.findAll();
    }

    public Optional<RestaurantTable> getTableById(int id) {
        return tableRepository.findById(id);
    }

    public RestaurantTable saveTable(RestaurantTable table) {
        return tableRepository.save(table);
    }

    public void deleteTable(int id) {
        tableRepository.deleteById(id);
    }

    public Optional<RestaurantTable> findByTableNumber(int tableNumber) {
        return tableRepository.findByTableNumber(tableNumber);
    }

    public List<RestaurantTable> getAvailableTables() {
        return tableRepository.findByIsAvailable(true);
    }

    public List<RestaurantTable> getTablesWithCapacity(int capacity) {
        return tableRepository.findByCapacityGreaterThanEqual(capacity);
    }

    public List<RestaurantTable> getAvailableTablesWithCapacity(int capacity) {
        return tableRepository.findByIsAvailableAndCapacityGreaterThanEqual(true, capacity);
    }

    public void setTableAvailability(int tableId, boolean isAvailable) {
        Optional<RestaurantTable> table = tableRepository.findById(tableId);
        if (table.isPresent()) {
            table.get().setAvailable(isAvailable);
            tableRepository.save(table.get());
        }
    }


}