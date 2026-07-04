package com.rtdabe.dto;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        long expiresInSeconds,
        String tokenType
) {}
