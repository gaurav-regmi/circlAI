package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.ChatMemberId;
import com.event.circl.chat.domain.models.MemberRole;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.AssertUtil;
import jakarta.persistence.*;

@Entity
@Table(name = "chat_members", uniqueConstraints = {
        @UniqueConstraint(name = "uk_chat_members_room_user", columnNames = {"chat_room_id", "user_id"})
})
class ChatMemberEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private ChatMemberId id;

    @Column(name = "chat_room_id", nullable = false)
    private String chatRoomId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private MemberRole role;

    protected ChatMemberEntity() {}

    ChatMemberEntity(ChatMemberId id, String chatRoomId, String userId, MemberRole role) {
        this.id = AssertUtil.requireNotNull(id, "ChatMember id cannot be null");
        this.chatRoomId = AssertUtil.requireNotBlank(chatRoomId, "Chat room id cannot be blank");
        this.userId = AssertUtil.requireNotBlank(userId, "User id cannot be blank");
        this.role = AssertUtil.requireNotNull(role, "Role cannot be null");
    }

    static ChatMemberEntity create(String chatRoomId, String userId, MemberRole role) {
        return new ChatMemberEntity(ChatMemberId.generate(), chatRoomId, userId, role);
    }

    ChatMemberId getId() { return id; }
    String getChatRoomId() { return chatRoomId; }
    String getUserId() { return userId; }
    MemberRole getRole() { return role; }
}
