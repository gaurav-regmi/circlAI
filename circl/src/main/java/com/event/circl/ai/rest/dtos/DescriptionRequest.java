package com.event.circl.ai.rest.dtos;

import java.time.Instant;

public record DescriptionRequest(
        String title,
        String location,
        String type,
        Instant startDateTime,
        Instant endDateTime,
        Integer maxCapacity
) {}
