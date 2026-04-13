package com.event.circl.events.domain.models;

import java.time.Instant;
import java.util.List;

public record EventVM(
        String id,
        String title,
        String description,
        String location,
        String type,
        String status,
        Instant startDateTime,
        Instant endDateTime,
        String organizerId,
        Integer maxCapacity,
        String parking,
        List<String> interests
) {}
