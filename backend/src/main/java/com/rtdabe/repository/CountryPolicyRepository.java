package com.rtdabe.repository;

import com.rtdabe.entity.CountryPolicy;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CountryPolicyRepository extends JpaRepository<CountryPolicy, UUID> {
    Optional<CountryPolicy> findByCountryCode(String countryCode);
}
