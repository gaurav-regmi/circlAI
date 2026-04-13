package com.event.circl.chat.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record InvitationId(String id) implements Serializable {
    public InvitationId {
        if (id == null || id.trim().isBlank()) throw new IllegalArgumentException("Invitation id cannot be null or empty");
    }

    public static InvitationId of(String id) { return new InvitationId(id); }
    public static InvitationId generate() { return new InvitationId(IdGenerator.generateString()); }
}
