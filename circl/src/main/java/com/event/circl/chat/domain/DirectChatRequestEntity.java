package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.DirectChatRequestId;
import com.event.circl.chat.domain.models.DirectChatRequestStatus;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.AssertUtil;
import jakarta.persistence.*;

@Entity
@Table(name = "direct_chat_requests", uniqueConstraints = {
        @UniqueConstraint(name = "uk_direct_request_sender_receiver", columnNames = {"sender_id", "receiver_id"})
})
class DirectChatRequestEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private DirectChatRequestId id;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(name = "receiver_id", nullable = false)
    private String receiverId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DirectChatRequestStatus status;

    @Column(name = "chat_room_id")
    private String chatRoomId;

    protected DirectChatRequestEntity() {}

    DirectChatRequestEntity(DirectChatRequestId id, String senderId, String receiverId) {
        this.id = AssertUtil.requireNotNull(id, "DirectChatRequest id cannot be null");
        this.senderId = AssertUtil.requireNotBlank(senderId, "Sender id cannot be blank");
        this.receiverId = AssertUtil.requireNotBlank(receiverId, "Receiver id cannot be blank");
        this.status = DirectChatRequestStatus.PENDING;
    }

    static DirectChatRequestEntity create(String senderId, String receiverId) {
        return new DirectChatRequestEntity(DirectChatRequestId.generate(), senderId, receiverId);
    }

    void accept(String chatRoomId) {
        this.status = DirectChatRequestStatus.ACCEPTED;
        this.chatRoomId = chatRoomId;
    }

    void decline() {
        this.status = DirectChatRequestStatus.DECLINED;
    }

    DirectChatRequestId getId() { return id; }
    String getSenderId() { return senderId; }
    String getReceiverId() { return receiverId; }
    DirectChatRequestStatus getStatus() { return status; }
    String getChatRoomId() { return chatRoomId; }
}
