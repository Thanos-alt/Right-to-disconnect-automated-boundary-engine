package com.rtdabe.controller;

import com.rtdabe.dto.PolicyDecisionResponse;
import com.rtdabe.policy.CountryLawEngine;
import com.rtdabe.policy.CountryLawStrategy;
import java.time.OffsetDateTime;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {
    private final CountryLawEngine countryLawEngine;

    public PolicyController(CountryLawEngine countryLawEngine) {
        this.countryLawEngine = countryLawEngine;
    }

    @PostMapping("/{countryCode}/evaluate")
    public PolicyDecisionResponse evaluate(
            @PathVariable String countryCode,
            @RequestParam String timezone,
            @RequestParam(required = false, defaultValue = "false") boolean emergencyOverride) {
        CountryLawStrategy.LawDecision decision = countryLawEngine.evaluate(
                new CountryLawStrategy.LawContext(countryCode, OffsetDateTime.now(), timezone, emergencyOverride));
        return new PolicyDecisionResponse(countryCode, decision.allowed(), decision.reason(), decision.nextAllowedAt());
    }

    @GetMapping("/{countryCode}")
    public String policy(@PathVariable String countryCode) {
        return countryCode + " policy configured";
    }
}
