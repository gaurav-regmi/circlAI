package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.*;
import org.springframework.stereotype.Component;

@Component
class ChatMapper {

    ChatRoomVM toChatRoomVM(ChatRoomEntity room) {
        return new ChatRoomVM(
                room.getId().id(),
                room.getName(),
                room.getType().name(),
                room.getEventId(),
                room.getParentChatRoomId(),
                room.getCreatedBy(),
                room.getCreatedAt()
        );
    }

    MessageVM toMessageVM(MessageEntity message, String senderName) {
        return new MessageVM(
                message.getId().id(),
                message.getChatRoomId(),
                message.getSenderId(),
                senderName,
                message.getContent(),
                message.getCreatedAt(),
                message.getFileKey(),
                message.getFileName(),
                message.getFileSize(),
                message.getFileContentType()
        );
    }

    ChatMemberVM toChatMemberVM(ChatMemberEntity member, String userName) {
        return new ChatMemberVM(
                member.getUserId(),
                userName,
                member.getRole().name(),
                member.getCreatedAt()
        );
    }

    ChatInvitationVM toChatInvitationVM(ChatInvitationEntity invitation, String chatRoomName) {
        return new ChatInvitationVM(
                invitation.getId().id(),
                invitation.getChatRoomId(),
                chatRoomName,
                invitation.getInvitedByUserId(),
                invitation.getStatus().name(),
                invitation.getCreatedAt()
        );
    }
}
