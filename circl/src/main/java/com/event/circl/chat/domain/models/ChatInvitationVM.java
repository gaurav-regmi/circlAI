package com.event.circl.chat.domain.models;

import java.time.Instant;

public record ChatInvitationVM(
        String id,
        String chatRoomId,
        String chatRoomName,
        String invitedByUserId,
        String status,
        Instant createdAt
) {}
