package com.rtdabe.dto;

import java.time.OffsetDateTime;

public record PolicyDecisionResponse(
        String countryCode,
        boolean allowed,
        String reason,
        OffsetDateTime nextAllowedAt
) {}
