package com.event.circl.chat.domain.models;

import com.event.circl.shared.models.DomainEvent;

public record DirectChatRequestSent(
        String requestId,
        String senderId,
        String senderName,
        String receiverId
) implements DomainEvent {}
