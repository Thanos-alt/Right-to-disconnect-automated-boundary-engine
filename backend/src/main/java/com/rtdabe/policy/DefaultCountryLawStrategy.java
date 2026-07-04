package com.rtdabe.policy;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Integer.MAX_VALUE)
public class DefaultCountryLawStrategy implements CountryLawStrategy {
    @Override
    public boolean supports(String countryCode) {
        return true;
    }

    @Override
    public LawDecision evaluate(LawContext context) {
        ZonedDateTime local = context.requestedAt().atZoneSameInstant(ZoneId.of(context.timezone()));
        int hour = local.getHour();
        boolean insideHours = hour >= 9 && hour < 18;
        if (context.emergencyOverride()) {
            return new LawDecision(true, "Emergency override approved", context.requestedAt());
        }
        if (insideHours) {
            return new LawDecision(true, "Within working hours", context.requestedAt());
        }
        return new LawDecision(false, "Outside working hours", local.plusHours(12).toOffsetDateTime());
    }
}
