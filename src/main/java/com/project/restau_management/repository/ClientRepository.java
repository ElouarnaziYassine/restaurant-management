package com.project.restau_management.repository;

import com.project.restau_management.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {
    List<Client> findByFirstNameContainingIgnoreCase(String firstName);
    List<Client> findByLastNameContainingIgnoreCase(String lastName);
    List<Client> findByFirstNameAndLastName(String firstName, String lastName);
}