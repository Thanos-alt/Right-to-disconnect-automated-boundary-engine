package com.rtdabe.controller;

import com.rtdabe.dto.MessageResponse;
import com.rtdabe.service.MessageService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scheduler")
public class SchedulerController {
    private final MessageService messageService;

    public SchedulerController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping("/tick")
    public Map<String, Object> tick() {
        List<MessageResponse> released = messageService.releaseQueuedMessages();
        return Map.of(
                "releasedCount", released.size(),
                "released", released,
                "dashboard", messageService.dashboard()
        );
    }
}
