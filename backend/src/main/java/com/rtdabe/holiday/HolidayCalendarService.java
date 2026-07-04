package com.rtdabe.holiday;

import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class HolidayCalendarService {
    private final HolidayCalendarRepository repository;

    public HolidayCalendarService(HolidayCalendarRepository repository) {
        this.repository = repository;
    }

    public boolean isHoliday(String countryCode, LocalDate date) {
        return repository.existsByCountryCodeAndHolidayDate(countryCode, date);
    }
}
