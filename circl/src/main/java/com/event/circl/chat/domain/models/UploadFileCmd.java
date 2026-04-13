package com.event.circl.chat.domain.models;

public record UploadFileCmd(
        String chatRoomId,
        String senderId,
        String originalFileName,
        byte[] bytes,
        String contentType,
        boolean isOrganizerOrAdmin
) {}
