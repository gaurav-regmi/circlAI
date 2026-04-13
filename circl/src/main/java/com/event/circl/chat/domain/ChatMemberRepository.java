package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.ChatMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface ChatMemberRepository extends JpaRepository<ChatMemberEntity, ChatMemberId> {

    List<ChatMemberEntity> findByChatRoomId(String chatRoomId);

    List<ChatMemberEntity> findByUserId(String userId);

    Optional<ChatMemberEntity> findByChatRoomIdAndUserId(String chatRoomId, String userId);

    boolean existsByChatRoomIdAndUserId(String chatRoomId, String userId);
}
