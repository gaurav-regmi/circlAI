package com.event.circl.events.domain.models;

import java.time.Instant;

public record CreateCouponCmd(
        String eventId,
        String code,
        Integer maxUses,
        Instant expiresAt,
        String requestingUserId,
        boolean requestingUserIsAdmin
) {}
