package com.project.restau_management.controller;

import com.project.restau_management.entity.RestaurantTable;
import com.project.restau_management.service.TableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
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
    public ResponseEntity<RestaurantTable> updateTable(@PathVariable int id, @RequestBody RestaurantTable table) {
        if (!tableService.getTableById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        table.setTableId(id);
        return ResponseEntity.ok(tableService.saveTable(table));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable int id) {
        tableService.deleteTable(id);
        return ResponseEntity.noContent().build();
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
