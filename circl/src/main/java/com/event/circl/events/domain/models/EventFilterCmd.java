package com.event.circl.events.domain.models;

import java.time.Instant;

public record EventFilterCmd(
        String search,
        EventType type,
        Instant startFrom,
        Instant startTo,
        String location,
        String requestingUserId   // nullable; used to apply profile preferences as defaults
) {}
