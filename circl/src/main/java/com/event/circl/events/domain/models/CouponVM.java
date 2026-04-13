package com.event.circl.events.domain.models;

import java.time.Instant;

public record CouponVM(
        String id,
        String eventId,
        String code,
        Integer maxUses,
        int usedCount,
        Instant expiresAt,
        boolean active
) {}
