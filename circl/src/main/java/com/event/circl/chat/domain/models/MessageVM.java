package com.event.circl.chat.domain.models;

import java.time.Instant;

public record MessageVM(
        String id,
        String chatRoomId,
        String senderId,
        String senderName,
        String content,
        Instant sentAt,
        String fileKey,
        String fileName,
        Long fileSize,
        String fileContentType
) {}
