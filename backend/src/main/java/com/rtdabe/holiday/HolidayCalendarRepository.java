package com.rtdabe.holiday;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HolidayCalendarRepository extends JpaRepository<HolidayCalendar, UUID> {
    List<HolidayCalendar> findByCountryCodeAndHolidayDateGreaterThanEqual(String countryCode, LocalDate holidayDate);
    boolean existsByCountryCodeAndHolidayDate(String countryCode, LocalDate holidayDate);
}
