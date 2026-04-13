package com.event.circl.chat.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record DirectChatRequestId(String id) implements Serializable {
    public DirectChatRequestId {
        if (id == null || id.trim().isBlank()) throw new IllegalArgumentException("DirectChatRequest id cannot be null or empty");
    }

    public static DirectChatRequestId of(String id) { return new DirectChatRequestId(id); }
    public static DirectChatRequestId generate() { return new DirectChatRequestId(IdGenerator.generateString()); }
}
