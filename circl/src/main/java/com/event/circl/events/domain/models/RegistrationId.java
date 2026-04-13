package com.event.circl.events.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record RegistrationId(String id) implements Serializable {
    public RegistrationId {
        if (id == null || id.trim().isBlank()) {
            throw new IllegalArgumentException("Registration id cannot be null or empty");
        }
    }

    public static RegistrationId of(String id) {
        return new RegistrationId(id);
    }

    public static RegistrationId generate() {
        return new RegistrationId(IdGenerator.generateString());
    }
}
