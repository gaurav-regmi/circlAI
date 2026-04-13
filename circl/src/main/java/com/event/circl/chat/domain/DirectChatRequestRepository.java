package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.DirectChatRequestId;
import com.event.circl.chat.domain.models.DirectChatRequestStatus;
import com.event.circl.shared.exceptions.ResourceNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

interface DirectChatRequestRepository extends JpaRepository<DirectChatRequestEntity, DirectChatRequestId> {

    List<DirectChatRequestEntity> findByReceiverIdAndStatus(String receiverId, DirectChatRequestStatus status);

    List<DirectChatRequestEntity> findBySenderId(String senderId);

    boolean existsBySenderIdAndReceiverIdAndStatus(String senderId, String receiverId, DirectChatRequestStatus status);

    @Query("SELECT COUNT(r) > 0 FROM DirectChatRequestEntity r WHERE r.status = :status AND ((r.senderId = :u1 AND r.receiverId = :u2) OR (r.senderId = :u2 AND r.receiverId = :u1))")
    boolean existsBetweenWithStatus(@Param("u1") String u1, @Param("u2") String u2, @Param("status") DirectChatRequestStatus status);

    @Query("SELECT r FROM DirectChatRequestEntity r WHERE r.status = :status AND ((r.senderId = :u1 AND r.receiverId = :u2) OR (r.senderId = :u2 AND r.receiverId = :u1))")
    java.util.Optional<DirectChatRequestEntity> findBetweenWithStatus(@Param("u1") String u1, @Param("u2") String u2, @Param("status") DirectChatRequestStatus status);

    default DirectChatRequestEntity getById(String id) {
        return findById(DirectChatRequestId.of(id))
                .orElseThrow(() -> new ResourceNotFoundException("Chat request not found: " + id));
    }
}
