package com.rtdabe.scheduler;

import com.rtdabe.entity.Message;
import com.rtdabe.entity.Message.MessageStatus;
import com.rtdabe.repository.MessageRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MessageScheduler {
    private final MessageRepository messageRepository;

    public MessageScheduler(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @Scheduled(fixedDelayString = "${rtdabe.scheduler.delay-ms:60000}")
    @Transactional
    public void tick() {
        OffsetDateTime now = OffsetDateTime.now();
        List<Message> dueMessages = messageRepository.findAll().stream()
                .filter(m -> m.isQueued() && m.getDeliverAt() != null && !m.getDeliverAt().isAfter(now))
                .toList();
        for (Message message : dueMessages) {
            message.setQueued(false);
            message.setStatus(MessageStatus.RELEASED);
            message.setDeliverAt(OffsetDateTime.now());
            messageRepository.save(message);
        }
    }
}
