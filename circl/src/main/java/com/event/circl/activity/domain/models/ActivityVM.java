package com.event.circl.activity.domain.models;

import java.time.Instant;

public record ActivityVM(
        String id,
        String userId,
        String eventId,
        String eventTitle,
        String eventType,
        String attendanceStatus,
        Instant registeredAt,
        String eventStatus,
        long totalRegistrations
) {}
