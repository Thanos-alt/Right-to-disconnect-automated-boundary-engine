package com.rtdabe.notification;

public record NotificationEvent(
        String recipient,
        String channel,
        String title,
        String message,
        String priority
) {}
