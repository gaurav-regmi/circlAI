package com.event.circl.events.domain.models;

import com.event.circl.shared.models.DomainEvent;

public record EventCreated(String eventId, String title, String organizerId, String type) implements DomainEvent {}
