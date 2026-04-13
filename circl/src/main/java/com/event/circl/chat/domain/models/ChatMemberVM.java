package com.event.circl.chat.domain.models;

import java.time.Instant;

public record ChatMemberVM(
        String userId,
        String userName,
        String role,
        Instant joinedAt
) {}
