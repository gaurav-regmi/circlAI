package com.event.circl.chat.domain.models;

public record RespondToInvitationCmd(
        String invitationId,
        String userId,
        boolean accept
) {}
