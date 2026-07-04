package com.rtdabe.dto;

import java.util.List;

public record ComplianceDashboardResponse(
        long employees,
        long queuedMessages,
        long deliveredMessages,
        long blockedMessages,
        double complianceRate,
        List<ManagerComplianceSummary> managers,
        List<CountryComplianceSummary> countries
) {
    public record ManagerComplianceSummary(String managerId, long sent, long blocked, double complianceRate) {}
    public record CountryComplianceSummary(String countryCode, long delivered, long blocked) {}
}
