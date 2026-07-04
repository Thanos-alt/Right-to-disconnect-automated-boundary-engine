package com.rtdabe.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmployeeRequest(
        @NotBlank String employeeCode,
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank String department,
        @NotBlank String countryCode,
        @NotBlank String timezone,
        @NotBlank String contractType
) {}
