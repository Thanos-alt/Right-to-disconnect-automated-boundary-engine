package com.rtdabe.dto;

import jakarta.validation.constraints.NotBlank;

public record MessageRequest(
        @NotBlank String employeeCode,
        @NotBlank String managerId,
        @NotBlank String platform,
        @NotBlank String subject,
        @NotBlank String body,
        boolean emergencyOverride
) {}
