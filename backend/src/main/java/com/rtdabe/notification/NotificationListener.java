package com.rtdabe.notification;

import org.springframework.context.event.EventListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class NotificationListener {
    private final JavaMailSender javaMailSender;

    public NotificationListener(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    @EventListener
    public void handle(NotificationEvent event) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(event.recipient());
        message.setSubject(event.title());
        message.setText(event.message());
        javaMailSender.send(message);
    }
}
