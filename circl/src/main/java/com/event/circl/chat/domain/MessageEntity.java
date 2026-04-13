package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.MessageId;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.AssertUtil;
import jakarta.persistence.*;

@Entity
@Table(name = "messages")
class MessageEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private MessageId id;

    @Column(name = "chat_room_id", nullable = false)
    private String chatRoomId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "file_key")
    private String fileKey;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_content_type")
    private String fileContentType;

    protected MessageEntity() {}

    private MessageEntity(MessageId id, String chatRoomId, String senderId, String content,
                          String fileKey, String fileName, Long fileSize, String fileContentType) {
        this.id = AssertUtil.requireNotNull(id, "Message id cannot be null");
        this.chatRoomId = AssertUtil.requireNotBlank(chatRoomId, "Chat room id cannot be blank");
        this.senderId = AssertUtil.requireNotBlank(senderId, "Sender id cannot be blank");
        this.content = content;
        this.fileKey = fileKey;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.fileContentType = fileContentType;
    }

    static MessageEntity create(String chatRoomId, String senderId, String content) {
        AssertUtil.requireNotBlank(content, "Content cannot be blank");
        return new MessageEntity(MessageId.generate(), chatRoomId, senderId, content, null, null, null, null);
    }

    static MessageEntity createFile(MessageId id, String chatRoomId, String senderId,
                                    String fileKey, String fileName, Long fileSize, String fileContentType) {
        return new MessageEntity(id, chatRoomId, senderId, null, fileKey, fileName, fileSize, fileContentType);
    }

    MessageId getId() { return id; }
    String getChatRoomId() { return chatRoomId; }
    String getSenderId() { return senderId; }
    String getContent() { return content; }
    String getFileKey() { return fileKey; }
    String getFileName() { return fileName; }
    Long getFileSize() { return fileSize; }
    String getFileContentType() { return fileContentType; }
}
