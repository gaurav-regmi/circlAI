package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.ChatRoomId;
import com.event.circl.chat.domain.models.ChatRoomType;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.AssertUtil;
import jakarta.persistence.*;

@Entity
@Table(name = "chat_rooms")
class ChatRoomEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private ChatRoomId id;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, columnDefinition = "VARCHAR(20)")
    private ChatRoomType type;

    @Column(name = "event_id")
    private String eventId;

    @Column(name = "parent_chat_room_id")
    private String parentChatRoomId;

    @Column(name = "created_by")
    private String createdBy;

    protected ChatRoomEntity() {}

    ChatRoomEntity(ChatRoomId id, String name, ChatRoomType type,
                   String eventId, String parentChatRoomId, String createdBy) {
        this.id = AssertUtil.requireNotNull(id, "ChatRoom id cannot be null");
        this.name = AssertUtil.requireNotBlank(name, "ChatRoom name cannot be blank");
        this.type = AssertUtil.requireNotNull(type, "ChatRoom type cannot be null");
        this.eventId = eventId;
        this.parentChatRoomId = parentChatRoomId;
        this.createdBy = createdBy;
    }

    static ChatRoomEntity createEventGroup(String eventId, String eventTitle, String organizerId) {
        return new ChatRoomEntity(
                ChatRoomId.generate(),
                eventTitle,
                ChatRoomType.EVENT_GROUP,
                eventId, null, organizerId
        );
    }

    static ChatRoomEntity createSubGroup(String name, String parentChatRoomId,
                                         String eventId, String createdByUserId) {
        return new ChatRoomEntity(
                ChatRoomId.generate(),
                name,
                ChatRoomType.SUB_GROUP,
                eventId, parentChatRoomId, createdByUserId
        );
    }

    static ChatRoomEntity createDirect(String name, String createdByUserId) {
        return new ChatRoomEntity(
                ChatRoomId.generate(),
                name,
                ChatRoomType.DIRECT,
                null, null, createdByUserId
        );
    }

    ChatRoomId getId() { return id; }
    String getName() { return name; }
    ChatRoomType getType() { return type; }
    String getEventId() { return eventId; }
    String getParentChatRoomId() { return parentChatRoomId; }
    String getCreatedBy() { return createdBy; }
}
