package com.event.circl.events.domain.models;

import java.time.Instant;

public record RegistrationVM(
        String id,
        String eventId,
        String userId,
        String status,
        Instant registeredAt
) {}
