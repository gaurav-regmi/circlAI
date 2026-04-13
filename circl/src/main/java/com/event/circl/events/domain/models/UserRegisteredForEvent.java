package com.event.circl.events.domain.models;

import com.event.circl.shared.models.DomainEvent;

public record UserRegisteredForEvent(
        String eventId,
        String eventTitle,
        String eventType,
        String organizerId,
        String userId,
        String userRole
) implements DomainEvent {}
