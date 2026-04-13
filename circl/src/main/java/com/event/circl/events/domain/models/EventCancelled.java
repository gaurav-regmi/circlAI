package com.event.circl.events.domain.models;

import com.event.circl.shared.models.DomainEvent;

import java.util.List;

public record EventCancelled(
        String eventId,
        String eventTitle,
        List<String> registeredUserIds
) implements DomainEvent {}
