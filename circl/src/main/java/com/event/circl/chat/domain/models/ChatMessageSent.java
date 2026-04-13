package com.event.circl.chat.domain.models;

import com.event.circl.shared.models.DomainEvent;

import java.util.List;

public record ChatMessageSent(
        String chatRoomId,
        String chatRoomName,
        String senderId,
        String senderName,
        String messagePreview,
        List<String> recipientUserIds
) implements DomainEvent {}
