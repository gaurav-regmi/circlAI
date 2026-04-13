package com.event.circl.chat.domain.models;

import com.event.circl.shared.models.DomainEvent;

public record DirectChatRequestAccepted(
        String requestId,
        String senderId,
        String receiverId,
        String receiverName,
        String chatRoomId
) implements DomainEvent {}
