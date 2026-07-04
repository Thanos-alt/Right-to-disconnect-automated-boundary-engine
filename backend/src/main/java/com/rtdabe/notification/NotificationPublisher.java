package com.rtdabe.notification;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class NotificationPublisher {
    private final ApplicationEventPublisher applicationEventPublisher;

    public NotificationPublisher(ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }

    public void publish(NotificationEvent event) {
        applicationEventPublisher.publishEvent(event);
    }
}
