package com.project.restau_management.service;

import com.project.restau_management.entity.Client;
import com.project.restau_management.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    public Optional<Client> getClientById(int id) {
        return clientRepository.findById(id);
    }

    public Client saveClient(Client client) {
        return clientRepository.save(client);
    }

    public void deleteClient(int id) {
        clientRepository.deleteById(id);
    }

    public List<Client> searchByFirstName(String firstName) {
        return clientRepository.findByFirstNameContainingIgnoreCase(firstName);
    }

    public List<Client> searchByLastName(String lastName) {
        return clientRepository.findByLastNameContainingIgnoreCase(lastName);
    }

    public List<Client> findByFullName(String firstName, String lastName) {
        return clientRepository.findByFirstNameAndLastName(firstName, lastName);
    }
}