package com.rtdabe.controller;

import com.rtdabe.audit.AuditLogDocument;
import com.rtdabe.audit.AuditLogRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
public class AuditController {
    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/logs")
    public List<AuditLogDocument> logs() {
        return auditLogRepository.findAll();
    }
}
