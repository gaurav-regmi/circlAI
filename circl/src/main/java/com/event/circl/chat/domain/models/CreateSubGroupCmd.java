package com.event.circl.chat.domain.models;

public record CreateSubGroupCmd(
        String parentChatRoomId,
        String name,
        String createdByUserId
) {}
