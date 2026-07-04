package com.rtdabe.policy;

import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.springframework.stereotype.Component;

@Component
public class IndiaCountryLawStrategy implements CountryLawStrategy {
    @Override
    public boolean supports(String countryCode) {
        return "IN".equalsIgnoreCase(countryCode);
    }

    @Override
    public LawDecision evaluate(LawContext context) {
        if (context.emergencyOverride()) {
            return new LawDecision(true, "Emergency override approved", context.requestedAt());
        }

        ZonedDateTime local = context.requestedAt().atZoneSameInstant(ZoneId.of(context.timezone()));
        boolean weekday = local.getDayOfWeek() != DayOfWeek.SATURDAY && local.getDayOfWeek() != DayOfWeek.SUNDAY;
        boolean insideHours = local.getHour() >= 9 && local.getHour() < 18;
        if (weekday && insideHours) {
            return new LawDecision(true, "India working-hour policy satisfied", context.requestedAt());
        }
        return new LawDecision(false, "India policy requires delayed delivery", local.plusHours(12).toOffsetDateTime());
    }
}
