package com.event.circl.events.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record EventId(String id) implements Serializable {
    public EventId {
        if (id == null || id.trim().isBlank()) {
            throw new IllegalArgumentException("Event id cannot be null or empty");
        }
    }

    public static EventId of(String id) {
        return new EventId(id);
    }

    public static EventId generate() {
        return new EventId(IdGenerator.generateString());
    }
}
