package com.rtdabe.policy;

import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.springframework.stereotype.Component;

@Component
public class FranceCountryLawStrategy implements CountryLawStrategy {
    @Override
    public boolean supports(String countryCode) {
        return "FR".equalsIgnoreCase(countryCode);
    }

    @Override
    public LawDecision evaluate(LawContext context) {
        if (context.emergencyOverride()) {
            return new LawDecision(true, "Emergency override approved", context.requestedAt());
        }

        ZonedDateTime local = context.requestedAt().atZoneSameInstant(ZoneId.of(context.timezone()));
        boolean weekday = local.getDayOfWeek().getValue() >= DayOfWeek.MONDAY.getValue() && local.getDayOfWeek().getValue() <= DayOfWeek.FRIDAY.getValue();
        boolean insideHours = local.getHour() >= 9 && local.getHour() < 18;
        if (weekday && insideHours) {
            return new LawDecision(true, "France working-hour policy satisfied", context.requestedAt());
        }
        return new LawDecision(false, "France right-to-disconnect restriction", local.plusHours(12).toOffsetDateTime());
    }
}
