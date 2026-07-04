package com.rtdabe.controller;

import com.rtdabe.analytics.ComplianceAnalyticsService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final ComplianceAnalyticsService analyticsService;

    public AnalyticsController(ComplianceAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return analyticsService.summary();
    }
}
