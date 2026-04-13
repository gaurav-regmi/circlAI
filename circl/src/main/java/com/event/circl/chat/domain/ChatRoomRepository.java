package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.ChatRoomId;
import com.event.circl.chat.domain.models.ChatRoomType;
import com.event.circl.shared.exceptions.ResourceNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface ChatRoomRepository extends JpaRepository<ChatRoomEntity, ChatRoomId> {

    Optional<ChatRoomEntity> findByEventIdAndType(String eventId, ChatRoomType type);

    List<ChatRoomEntity> findByIdInOrderByCreatedAtDesc(List<ChatRoomId> ids);

    List<ChatRoomEntity> findAllByOrderByCreatedAtDesc();

    default ChatRoomEntity getById(String id) {
        return findById(ChatRoomId.of(id))
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found: " + id));
    }
}
