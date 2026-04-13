package com.event.circl.events.domain.models;

import java.time.Instant;
import java.util.List;

public record CreateEventCmd(
        String title,
        String description,
        String location,
        EventType type,
        Instant startDateTime,
        Instant endDateTime,
        String organizerId,
        Integer maxCapacity,
        ParkingType parking,
        List<String> interests
) {}
