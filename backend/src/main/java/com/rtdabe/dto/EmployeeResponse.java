package com.rtdabe.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EmployeeResponse(
        UUID id,
        String employeeCode,
        String fullName,
        String email,
        String department,
        String countryCode,
        String timezone,
        String contractType,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
