package com.rtdabe.analytics;

import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ComplianceAnalyticsService {
    public Map<String, Object> summary() {
        return Map.of(
                "trend", "stable",
                "burnoutRisk", "medium",
                "messageVolume", 1248,
                "blockedRate", 18.5
        );
    }
}
