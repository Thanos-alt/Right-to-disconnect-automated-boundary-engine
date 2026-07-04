package com.rtdabe.policy;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CountryLawEngine {
    private final List<CountryLawStrategy> strategies;

    public CountryLawEngine(List<CountryLawStrategy> strategies) {
        this.strategies = strategies;
    }

    public CountryLawStrategy.LawDecision evaluate(CountryLawStrategy.LawContext context) {
        return strategies.stream()
                .filter(strategy -> strategy.supports(context.countryCode()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No country law strategy found"))
                .evaluate(context);
    }
}
