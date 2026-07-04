package com.rtdabe.controller;

import com.rtdabe.dto.ComplianceDashboardResponse;
import com.rtdabe.service.MessageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/compliance")
public class ComplianceController {
    private final MessageService messageService;

    public ComplianceController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/dashboard")
    public ComplianceDashboardResponse dashboard() {
        return messageService.dashboard();
    }
}
