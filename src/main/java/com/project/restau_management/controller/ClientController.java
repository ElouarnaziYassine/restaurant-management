package com.project.restau_management.controller;

import com.project.restau_management.entity.Client;
import com.project.restau_management.service.ClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public List<Client> getAllClients() {
        return clientService.getAllClients();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Client> getClientById(@PathVariable int id) {
        return clientService.getClientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Client createClient(@RequestBody Client client) {
        return clientService.saveClient(client);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Client> updateClient(@PathVariable int id, @RequestBody Client client) {
        if (!clientService.getClientById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        client.setClientId(id);
        return ResponseEntity.ok(clientService.saveClient(client));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable int id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search/first-name")
    public List<Client> searchByFirstName(@RequestParam String firstName) {
        return clientService.searchByFirstName(firstName);
    }

    @GetMapping("/search/last-name")
    public List<Client> searchByLastName(@RequestParam String lastName) {
        return clientService.searchByLastName(lastName);
    }

    @GetMapping("/search/full-name")
    public List<Client> searchByFullName(
            @RequestParam String firstName,
            @RequestParam String lastName) {
        return clientService.findByFullName(firstName, lastName);
    }
}