package com.rtdabe.repository;

import com.rtdabe.entity.ComplianceScore;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplianceScoreRepository extends JpaRepository<ComplianceScore, UUID> {}
