package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.InvitationId;
import com.event.circl.chat.domain.models.InvitationStatus;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.AssertUtil;
import jakarta.persistence.*;

@Entity
@Table(name = "chat_invitations")
class ChatInvitationEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private InvitationId id;

    @Column(name = "chat_room_id", nullable = false)
    private String chatRoomId;

    @Column(name = "invited_user_id", nullable = false)
    private String invitedUserId;

    @Column(name = "invited_by_user_id", nullable = false)
    private String invitedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InvitationStatus status;

    protected ChatInvitationEntity() {}

    ChatInvitationEntity(InvitationId id, String chatRoomId,
                         String invitedUserId, String invitedByUserId) {
        this.id = AssertUtil.requireNotNull(id, "Invitation id cannot be null");
        this.chatRoomId = AssertUtil.requireNotBlank(chatRoomId, "Chat room id cannot be blank");
        this.invitedUserId = AssertUtil.requireNotBlank(invitedUserId, "Invited user id cannot be blank");
        this.invitedByUserId = AssertUtil.requireNotBlank(invitedByUserId, "Inviting user id cannot be blank");
        this.status = InvitationStatus.PENDING;
    }

    static ChatInvitationEntity create(String chatRoomId, String invitedUserId, String invitedByUserId) {
        return new ChatInvitationEntity(InvitationId.generate(), chatRoomId, invitedUserId, invitedByUserId);
    }

    void accept() { this.status = InvitationStatus.ACCEPTED; }
    void decline() { this.status = InvitationStatus.DECLINED; }

    InvitationId getId() { return id; }
    String getChatRoomId() { return chatRoomId; }
    String getInvitedUserId() { return invitedUserId; }
    String getInvitedByUserId() { return invitedByUserId; }
    InvitationStatus getStatus() { return status; }
}
