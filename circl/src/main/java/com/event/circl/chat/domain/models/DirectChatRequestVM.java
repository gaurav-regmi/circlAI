package com.event.circl.chat.domain.models;

public record DirectChatRequestVM(
        String id,
        String senderId,
        String senderFirstName,
        String senderLastName,
        boolean senderHasPicture,
        String receiverId,
        String receiverFirstName,
        String receiverLastName,
        boolean receiverHasPicture,
        String status,
        String chatRoomId
) {}
