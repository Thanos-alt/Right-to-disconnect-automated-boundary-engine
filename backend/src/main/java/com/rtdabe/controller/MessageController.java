package com.rtdabe.controller;

import com.rtdabe.dto.ComplianceDashboardResponse;
import com.rtdabe.dto.MessageRequest;
import com.rtdabe.dto.MessageResponse;
import com.rtdabe.service.MessageService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MessageResponse send(@Valid @RequestBody MessageRequest request) {
        return messageService.send(request);
    }

    @GetMapping("/queue")
    public List<MessageResponse> queue() {
        return messageService.queue();
    }

    @GetMapping("/dashboard")
    public ComplianceDashboardResponse dashboard() {
        return messageService.dashboard();
    }
}
