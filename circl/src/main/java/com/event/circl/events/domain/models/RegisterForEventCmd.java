package com.event.circl.events.domain.models;

public record RegisterForEventCmd(
        String eventId,
        String userId,
        String couponCode
) {}
