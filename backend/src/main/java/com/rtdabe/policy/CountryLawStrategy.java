package com.rtdabe.policy;

import java.time.OffsetDateTime;

public interface CountryLawStrategy {
    boolean supports(String countryCode);
    LawDecision evaluate(LawContext context);

    record LawContext(String countryCode, OffsetDateTime requestedAt, String timezone, boolean emergencyOverride) {}
    record LawDecision(boolean allowed, String reason, OffsetDateTime nextAllowedAt) {}
}
