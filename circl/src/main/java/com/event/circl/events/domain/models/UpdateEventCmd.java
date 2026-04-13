package com.event.circl.events.domain.models;

import java.time.Instant;
import java.util.List;

public record UpdateEventCmd(
        String eventId,
        String title,
        String description,
        String location,
        EventType type,
        Instant startDateTime,
        Instant endDateTime,
        Integer maxCapacity,
        ParkingType parking,
        List<String> interests,
        String requestingUserId,
        boolean requestingUserIsAdmin
) {}
