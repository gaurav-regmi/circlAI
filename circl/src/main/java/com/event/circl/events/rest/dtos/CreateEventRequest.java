package com.event.circl.events.rest.dtos;

import com.event.circl.events.domain.models.EventType;
import com.event.circl.events.domain.models.ParkingType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public record CreateEventRequest(
        @NotBlank(message = "Title is required")
        String title,

        String description,

        @NotBlank(message = "Location is required")
        String location,

        @NotNull(message = "Event type is required")
        EventType type,

        @NotNull(message = "Start date time is required")
        @Future(message = "Start date time must be in the future")
        Instant startDateTime,

        @NotNull(message = "End date time is required")
        @Future(message = "End date time must be in the future")
        Instant endDateTime,

        Integer maxCapacity,

        ParkingType parking,

        List<String> interests
) {}
