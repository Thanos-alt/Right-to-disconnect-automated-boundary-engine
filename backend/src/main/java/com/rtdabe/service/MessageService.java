package com.rtdabe.service;

import com.rtdabe.dto.ComplianceDashboardResponse;
import com.rtdabe.dto.MessageRequest;
import com.rtdabe.dto.MessageResponse;
import java.util.List;

public interface MessageService {
    MessageResponse send(MessageRequest request);
    List<MessageResponse> queue();
    List<MessageResponse> releaseQueuedMessages();
    ComplianceDashboardResponse dashboard();
}
