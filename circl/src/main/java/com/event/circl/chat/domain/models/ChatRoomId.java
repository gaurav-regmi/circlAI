package com.event.circl.chat.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record ChatRoomId(String id) implements Serializable {
    public ChatRoomId {
        if (id == null || id.trim().isBlank()) throw new IllegalArgumentException("ChatRoom id cannot be null or empty");
    }

    public static ChatRoomId of(String id) { return new ChatRoomId(id); }
    public static ChatRoomId generate() { return new ChatRoomId(IdGenerator.generateString()); }
}
