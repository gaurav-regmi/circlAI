package com.event.circl.chat.domain.models;

public record InviteUserCmd(
        String chatRoomId,
        String invitedUserId,
        String invitedByUserId
) {}
