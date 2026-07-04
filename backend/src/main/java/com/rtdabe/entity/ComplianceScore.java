package com.rtdabe.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "compliance_scores")
public class ComplianceScore {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "score", nullable = false)
    private int score;

    @Column(name = "blocked_messages", nullable = false)
    private int blockedMessages;

    @Column(name = "delayed_messages", nullable = false)
    private int delayedMessages;

    @Column(name = "violations", nullable = false)
    private int violations;

    @Column(name = "last_calculated_at", nullable = false)
    private OffsetDateTime lastCalculatedAt = OffsetDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getBlockedMessages() { return blockedMessages; }
    public void setBlockedMessages(int blockedMessages) { this.blockedMessages = blockedMessages; }
    public int getDelayedMessages() { return delayedMessages; }
    public void setDelayedMessages(int delayedMessages) { this.delayedMessages = delayedMessages; }
    public int getViolations() { return violations; }
    public void setViolations(int violations) { this.violations = violations; }
    public OffsetDateTime getLastCalculatedAt() { return lastCalculatedAt; }
    public void setLastCalculatedAt(OffsetDateTime lastCalculatedAt) { this.lastCalculatedAt = lastCalculatedAt; }
}
