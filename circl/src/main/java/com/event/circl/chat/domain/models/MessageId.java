package com.event.circl.chat.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record MessageId(String id) implements Serializable {
    public MessageId {
        if (id == null || id.trim().isBlank()) throw new IllegalArgumentException("Message id cannot be null or empty");
    }

    public static MessageId of(String id) { return new MessageId(id); }
    public static MessageId generate() { return new MessageId(IdGenerator.generateString()); }
}
