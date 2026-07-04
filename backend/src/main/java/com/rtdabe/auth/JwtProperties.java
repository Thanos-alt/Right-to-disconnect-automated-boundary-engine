package com.rtdabe.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "rtdabe.jwt")
public record JwtProperties(String secret, long expirationMinutes, long refreshExpirationDays) {}
