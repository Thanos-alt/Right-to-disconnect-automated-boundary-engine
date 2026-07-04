package com.rtdabe.repository;

import com.rtdabe.entity.Manager;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ManagerRepository extends JpaRepository<Manager, UUID> {
    Optional<Manager> findByManagerCode(String managerCode);
}
