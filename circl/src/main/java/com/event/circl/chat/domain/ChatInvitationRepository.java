package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.InvitationId;
import com.event.circl.chat.domain.models.InvitationStatus;
import com.event.circl.shared.exceptions.ResourceNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface ChatInvitationRepository extends JpaRepository<ChatInvitationEntity, InvitationId> {

    List<ChatInvitationEntity> findByInvitedUserIdAndStatus(String invitedUserId, InvitationStatus status);

    boolean existsByChatRoomIdAndInvitedUserIdAndStatus(
            String chatRoomId, String invitedUserId, InvitationStatus status);

    default ChatInvitationEntity getById(String id) {
        return findById(InvitationId.of(id))
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found: " + id));
    }
}
