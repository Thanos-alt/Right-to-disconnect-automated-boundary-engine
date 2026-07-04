package com.rtdabe.service.impl;

import com.rtdabe.dto.ComplianceDashboardResponse;
import com.rtdabe.dto.MessageRequest;
import com.rtdabe.dto.MessageResponse;
import com.rtdabe.entity.Employee;
import com.rtdabe.entity.Message;
import com.rtdabe.entity.Message.MessageStatus;
import com.rtdabe.holiday.HolidayCalendarService;
import com.rtdabe.kafka.MessageEventPublisher;
import com.rtdabe.notification.NotificationEvent;
import com.rtdabe.notification.NotificationPublisher;
import com.rtdabe.policy.CountryLawEngine;
import com.rtdabe.policy.CountryLawStrategy;
import com.rtdabe.repository.EmployeeRepository;
import com.rtdabe.repository.MessageRepository;
import com.rtdabe.service.MessageService;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MessageServiceImpl implements MessageService {
    private final MessageRepository messageRepository;
    private final EmployeeRepository employeeRepository;
    private final CountryLawEngine countryLawEngine;
    private final HolidayCalendarService holidayCalendarService;
    private final MessageEventPublisher messageEventPublisher;
    private final NotificationPublisher notificationPublisher;
    private final String messageTopic;

    public MessageServiceImpl(
            MessageRepository messageRepository,
            EmployeeRepository employeeRepository,
            CountryLawEngine countryLawEngine,
            HolidayCalendarService holidayCalendarService,
            MessageEventPublisher messageEventPublisher,
            NotificationPublisher notificationPublisher,
            @Value("${rtdabe.kafka.message-topic}") String messageTopic) {
        this.messageRepository = messageRepository;
        this.employeeRepository = employeeRepository;
        this.countryLawEngine = countryLawEngine;
        this.holidayCalendarService = holidayCalendarService;
        this.messageEventPublisher = messageEventPublisher;
        this.notificationPublisher = notificationPublisher;
        this.messageTopic = messageTopic;
    }

    @Override
    public MessageResponse send(MessageRequest request) {
        Employee employee = employeeRepository.findByEmployeeCode(request.employeeCode())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        Message message = new Message();
        message.setEmployee(employee);
        message.setManagerId(request.managerId());
        message.setPlatform(request.platform().toLowerCase(Locale.ROOT));
        message.setSubject(request.subject());
        message.setBody(request.body());
        OffsetDateTime requestedAt = OffsetDateTime.now();
        message.setSentAt(requestedAt);
        message.setEmergencyOverride(request.emergencyOverride());

        CountryLawStrategy.LawDecision decision = countryLawEngine.evaluate(
                new CountryLawStrategy.LawContext(
                        employee.getCountryCode(),
                        requestedAt,
                        employee.getTimezone(),
                        request.emergencyOverride()));

        boolean holiday = holidayCalendarService.isHoliday(employee.getCountryCode(), requestedAt.toLocalDate());
        boolean deliverNow = decision.allowed() && !holiday;

        message.setQueued(!deliverNow);
        message.setStatus(deliverNow ? MessageStatus.DELIVERED : MessageStatus.QUEUED);
        if (!deliverNow) {
            message.setDeliverAt(decision.nextAllowedAt());
        }

        Message saved = messageRepository.save(message);

        // Publish to Kafka for audit and downstream processing
        String kafkaPayload = String.format(
                "{\"messageId\":\"%s\",\"employeeCode\":\"%s\",\"managerId\":\"%s\",\"status\":\"%s\",\"deliverAt\":\"%s\"}",
                saved.getId(), employee.getEmployeeCode(), request.managerId(),
                saved.getStatus(), saved.getDeliverAt() != null ? saved.getDeliverAt().toString() : "");
        messageEventPublisher.publish(messageTopic, saved.getId().toString(), kafkaPayload);

        // Notify if queued
        if (!deliverNow) {
            notificationPublisher.publish(new NotificationEvent(
                    employee.getEmail(),
                    "email",
                    "Message deferred due to Right to Disconnect policy",
                    "Your manager sent a message that will be delivered at your next shift start.",
                    "low"));
        }

        return map(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> queue() {
        return messageRepository.findAll().stream()
                .filter(Message::isQueued)
                .map(this::map)
                .collect(Collectors.toList());
    }

    @Override
    public List<MessageResponse> releaseQueuedMessages() {
        OffsetDateTime now = OffsetDateTime.now();
        List<MessageResponse> released = messageRepository.findAll().stream()
                .filter(m -> m.isQueued() && m.getDeliverAt() != null && !m.getDeliverAt().isAfter(now))
                .map(message -> {
                    message.setQueued(false);
                    message.setStatus(MessageStatus.RELEASED);
                    message.setDeliverAt(OffsetDateTime.now());
                    Message saved = messageRepository.save(message);

                    // Publish release event to Kafka
                    String kafkaPayload = String.format(
                            "{\"messageId\":\"%s\",\"employeeCode\":\"%s\",\"status\":\"%s\",\"deliverAt\":\"%s\"}",
                            saved.getId(), saved.getEmployee().getEmployeeCode(),
                            saved.getStatus(), saved.getDeliverAt());
                    messageEventPublisher.publish(messageTopic, saved.getId().toString(), kafkaPayload);

                    return map(saved);
                })
                .collect(Collectors.toList());
        return released;
    }

    @Override
    @Transactional(readOnly = true)
    public ComplianceDashboardResponse dashboard() {
        List<Message> allMessages = messageRepository.findAll();
        long queued = allMessages.stream().filter(Message::isQueued).count();
        long delivered = allMessages.stream().filter(m -> m.getStatus() == MessageStatus.DELIVERED).count();
        long released = allMessages.stream().filter(m -> m.getStatus() == MessageStatus.RELEASED).count();
        long employees = employeeRepository.count();
        double complianceRate = queued + delivered + released == 0 ? 100.0
                : (double) (delivered + released) * 100.0 / (queued + delivered + released);
        return new ComplianceDashboardResponse(
                employees,
                queued,
                delivered + released,
                queued,
                Math.round(complianceRate * 100.0) / 100.0,
                List.of(),
                List.of()
        );
    }

    private MessageResponse map(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getEmployee().getEmployeeCode(),
                message.getManagerId(),
                message.getPlatform(),
                message.getSubject(),
                message.getStatus(),
                message.getSentAt(),
                message.getDeliverAt(),
                message.isQueued(),
                message.isEmergencyOverride()
        );
    }
}
