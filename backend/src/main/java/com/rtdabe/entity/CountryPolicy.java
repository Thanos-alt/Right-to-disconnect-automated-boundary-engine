package com.rtdabe.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "country_policies")
public class CountryPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "country_code", nullable = false, unique = true, length = 10)
    private String countryCode;

    @Column(name = "country_name", nullable = false, length = 120)
    private String countryName;

    @Column(name = "legal_start_time", nullable = false)
    private String legalStartTime;

    @Column(name = "legal_end_time", nullable = false)
    private String legalEndTime;

    @Column(name = "allow_after_hours", nullable = false)
    private boolean allowAfterHours;

    @Column(name = "fine_amount", precision = 12, scale = 2)
    private BigDecimal fineAmount;

    @Column(name = "emergency_override_allowed", nullable = false)
    private boolean emergencyOverrideAllowed;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getCountryName() {
        return countryName;
    }

    public void setCountryName(String countryName) {
        this.countryName = countryName;
    }

    public String getLegalStartTime() {
        return legalStartTime;
    }

    public void setLegalStartTime(String legalStartTime) {
        this.legalStartTime = legalStartTime;
    }

    public String getLegalEndTime() {
        return legalEndTime;
    }

    public void setLegalEndTime(String legalEndTime) {
        this.legalEndTime = legalEndTime;
    }

    public boolean isAllowAfterHours() {
        return allowAfterHours;
    }

    public void setAllowAfterHours(boolean allowAfterHours) {
        this.allowAfterHours = allowAfterHours;
    }

    public BigDecimal getFineAmount() {
        return fineAmount;
    }

    public void setFineAmount(BigDecimal fineAmount) {
        this.fineAmount = fineAmount;
    }

    public boolean isEmergencyOverrideAllowed() {
        return emergencyOverrideAllowed;
    }

    public void setEmergencyOverrideAllowed(boolean emergencyOverrideAllowed) {
        this.emergencyOverrideAllowed = emergencyOverrideAllowed;
    }
}
