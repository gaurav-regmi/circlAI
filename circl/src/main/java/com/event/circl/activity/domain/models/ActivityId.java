package com.event.circl.activity.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record ActivityId(String id) implements Serializable {
    public ActivityId {
        if (id == null || id.trim().isBlank()) throw new IllegalArgumentException("Activity id cannot be null or empty");
    }

    public static ActivityId of(String id) { return new ActivityId(id); }
    public static ActivityId generate() { return new ActivityId(IdGenerator.generateString()); }
}
