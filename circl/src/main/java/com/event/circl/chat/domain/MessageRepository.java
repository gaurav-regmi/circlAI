package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.MessageId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

interface MessageRepository extends JpaRepository<MessageEntity, MessageId> {

    Page<MessageEntity> findByChatRoomIdOrderByCreatedAtDesc(String chatRoomId, Pageable pageable);

    default Optional<MessageEntity> findByStringId(String id) {
        return findById(MessageId.of(id));
    }
}
