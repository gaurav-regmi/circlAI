package com.event.circl.chat.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record ChatMemberId(String id) implements Serializable {
    public ChatMemberId {
        if (id == null || id.trim().isBlank()) throw new IllegalArgumentException("ChatMember id cannot be null or empty");
    }

    public static ChatMemberId of(String id) { return new ChatMemberId(id); }
    public static ChatMemberId generate() { return new ChatMemberId(IdGenerator.generateString()); }
}
