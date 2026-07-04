package com.rtdabe.dto;

import com.rtdabe.entity.Message.MessageStatus;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        String employeeCode,
        String managerId,
        String platform,
        String subject,
        MessageStatus status,
        OffsetDateTime sentAt,
        OffsetDateTime deliverAt,
        boolean queued,
        boolean emergencyOverride
) {}
