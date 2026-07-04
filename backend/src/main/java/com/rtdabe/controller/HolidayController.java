package com.rtdabe.controller;

import com.rtdabe.holiday.HolidayCalendar;
import com.rtdabe.holiday.HolidayCalendarRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {
    private final HolidayCalendarRepository holidayCalendarRepository;

    public HolidayController(HolidayCalendarRepository holidayCalendarRepository) {
        this.holidayCalendarRepository = holidayCalendarRepository;
    }

    @GetMapping("/{countryCode}")
    public List<HolidayCalendar> listByCountry(
            @PathVariable String countryCode,
            @RequestParam(required = false) String fromDate) {
        LocalDate date = fromDate == null ? LocalDate.now() : LocalDate.parse(fromDate);
        return holidayCalendarRepository.findByCountryCodeAndHolidayDateGreaterThanEqual(countryCode, date);
    }
}
