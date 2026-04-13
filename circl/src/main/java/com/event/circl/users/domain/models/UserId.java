package com.event.circl.users.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record UserId(String id) implements Serializable {
    public UserId {
        if (id == null || id.trim().isBlank()) {
            throw new IllegalArgumentException("User id cannot be null or empty");
        }
    }

    public static UserId of(String id) {
        return new UserId(id);
    }

    public static UserId generate() {
        return new UserId(IdGenerator.generateString());
    }
}
