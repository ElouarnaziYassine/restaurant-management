package com.project.restau_management.controller;

import com.project.restau_management.entity.RestaurantTable;
import com.project.restau_management.repository.OrderRepository;
import com.project.restau_management.service.TableService;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final TableService tableService;
    private final OrderRepository orderRepository;


    public TableController(TableService tableService, OrderRepository orderRepository) {
        this.tableService = tableService;
        this.orderRepository = orderRepository;

    }

    @GetMapping
    public List<RestaurantTable> getAllTables() {
        return tableService.getAllTables();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantTable> getTableById(@PathVariable int id) {
        return tableService.getTableById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public RestaurantTable createTable(@RequestBody RestaurantTable table) {
        return tableService.saveTable(table);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTable(@PathVariable int id, @RequestBody RestaurantTable table) {
        Optional<RestaurantTable> existingTableOpt = tableService.getTableById(id);
        if (existingTableOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Check if table is linked to an ongoing order
        boolean inUse = !orderRepository.findByTableIdAndStatus(id, "ON GOING").isEmpty();
        if (inUse) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Cannot edit table: it is currently linked to an active order."));
        }

        // Proceed with update
        table.setTableId(id); // Ensure correct ID is used
        RestaurantTable updated = tableService.saveTable(table);
        return ResponseEntity.ok(updated);
    }





    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTable(@PathVariable int id) {
        try {
            tableService.deleteTable(id);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "⚠️ Cannot delete table: it's linked to an existing order."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unexpected error: " + e.getMessage()));
        }
    }



    @GetMapping("/available")
    public List<RestaurantTable> getAvailableTables() {
        return tableService.getAvailableTables();
    }

    @GetMapping("/capacity/{capacity}")
    public List<RestaurantTable> getTablesWithCapacity(@PathVariable int capacity) {
        return tableService.getTablesWithCapacity(capacity);
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<Void> setTableAvailability(@PathVariable int id, @RequestParam boolean available) {
        tableService.setTableAvailability(id, available);
        return ResponseEntity.noContent().build();
    }
}
