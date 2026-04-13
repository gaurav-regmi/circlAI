package com.event.circl.chat.domain.models;

public record SendMessageCmd(
        String chatRoomId,
        String senderId,
        String content,
        boolean isOrganizerOrAdmin
) {}
