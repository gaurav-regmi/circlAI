package com.event.circl.chat.domain.models;

import java.time.Instant;

public record ChatRoomVM(
        String id,
        String name,
        String type,
        String eventId,
        String parentChatRoomId,
        String createdBy,
        Instant createdAt
) {}
