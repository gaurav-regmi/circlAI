package com.event.circl.notifications.domain.models;

import java.time.Instant;

public record NotificationVM(
        String id,
        NotificationType type,
        String title,
        String message,
        String referenceId,
        boolean seen,
        Instant createdAt
) {}
