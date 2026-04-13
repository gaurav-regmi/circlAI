package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.*;
import com.event.circl.events.domain.models.EventCreated;
import com.event.circl.events.domain.models.UserRegisteredForEvent;
import com.event.circl.shared.exceptions.DomainException;
import com.event.circl.shared.services.S3StorageService;
import com.event.circl.shared.services.SpringEventPublisher;
import com.event.circl.users.UsersAPI;
import com.event.circl.users.domain.models.UserVM;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final MessageRepository messageRepository;
    private final ChatInvitationRepository invitationRepository;
    private final ChatMapper chatMapper;
    private final UsersAPI usersAPI;
    private final SpringEventPublisher eventPublisher;
    private final S3StorageService s3StorageService;

    ChatService(ChatRoomRepository chatRoomRepository,
                ChatMemberRepository chatMemberRepository,
                MessageRepository messageRepository,
                ChatInvitationRepository invitationRepository,
                ChatMapper chatMapper,
                UsersAPI usersAPI,
                SpringEventPublisher eventPublisher,
                S3StorageService s3StorageService) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMemberRepository = chatMemberRepository;
        this.messageRepository = messageRepository;
        this.invitationRepository = invitationRepository;
        this.chatMapper = chatMapper;
        this.usersAPI = usersAPI;
        this.eventPublisher = eventPublisher;
        this.s3StorageService = s3StorageService;
    }

    // ── Domain event listeners ──────────────────────────────────────────────

    @EventListener
    @Transactional
    public void onEventCreated(EventCreated event) {
        var chatRoom = ChatRoomEntity.createEventGroup(event.eventId(), event.title(), event.organizerId());
        chatRoomRepository.save(chatRoom);
        log.debug("Created event group chat '{}' for event {}", chatRoom.getName(), event.eventId());
    }

    @EventListener
    @Transactional
    public void onUserRegisteredForEvent(UserRegisteredForEvent event) {
        chatRoomRepository.findByEventIdAndType(event.eventId(), ChatRoomType.EVENT_GROUP).ifPresentOrElse(
                chatRoom -> {
                    if (!chatMemberRepository.existsByChatRoomIdAndUserId(chatRoom.getId().id(), event.userId())) {
                        chatMemberRepository.save(
                                ChatMemberEntity.create(chatRoom.getId().id(), event.userId(), MemberRole.MEMBER));
                        log.debug("Added user {} to event group chat {}", event.userId(), chatRoom.getId().id());
                    }
                },
                () -> log.warn("No group chat found for event {} when adding user {}", event.eventId(), event.userId())
        );
    }

    // ── Chat room operations ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ChatRoomVM> getMyChatRooms(String userId) {
        var roomIds = chatMemberRepository.findByUserId(userId).stream()
                .map(m -> ChatRoomId.of(m.getChatRoomId()))
                .toList();
        if (roomIds.isEmpty()) return List.of();
        var rooms = chatRoomRepository.findByIdInOrderByCreatedAtDesc(roomIds);
        Map<String, String> directNames = resolveDirectRoomNames(rooms, userId);
        return rooms.stream()
                .map(r -> overrideDirectName(chatMapper.toChatRoomVM(r), directNames))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatRoomVM> getAllChatRooms() {
        return chatRoomRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(chatMapper::toChatRoomVM).toList();
    }

    @Transactional(readOnly = true)
    public ChatRoomVM getChatRoom(String chatRoomId, String userId) {
        assertMember(chatRoomId, userId);
        var room = chatRoomRepository.getById(chatRoomId);
        var vm = chatMapper.toChatRoomVM(room);
        if (room.getType() == ChatRoomType.DIRECT) {
            Map<String, String> directNames = resolveDirectRoomNames(List.of(room), userId);
            return overrideDirectName(vm, directNames);
        }
        return vm;
    }

    @Transactional(readOnly = true)
    public List<ChatMemberVM> getChatRoomMembers(String chatRoomId, String userId, boolean isOrganizerOrAdmin) {
        if (!isOrganizerOrAdmin) assertMember(chatRoomId, userId);
        var members = chatMemberRepository.findByChatRoomId(chatRoomId);

        // Batch-resolve full user data (name + role) to avoid N+1 calls
        Map<String, UserVM> userCache = new java.util.HashMap<>();
        members.stream().map(ChatMemberEntity::getUserId).distinct().forEach(id -> {
            try { userCache.put(id, usersAPI.getById(id)); }
            catch (Exception e) { log.warn("Could not resolve user {}", id); }
        });

        return members.stream()
                .filter(m -> {
                    if (isOrganizerOrAdmin) return true;
                    var user = userCache.get(m.getUserId());
                    if (user == null) return true;
                    // Regular users cannot see organizer-role members
                    String role = user.role();
                    return !"EVENT_ORGANIZER".equals(role) && !"EVENT_ORGANIZER_MEMBER".equals(role);
                })
                .map(m -> {
                    var user = userCache.get(m.getUserId());
                    String name = user != null ? user.firstName() + " " + user.lastName() : "Unknown";
                    return chatMapper.toChatMemberVM(m, name);
                })
                .toList();
    }

    @Transactional
    public void leaveChatRoom(String chatRoomId, String userId) {
        var membership = chatMemberRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .orElseThrow(() -> new DomainException("You are not a member of this chat room"));
        chatMemberRepository.delete(membership);
        log.debug("User {} left chat room {}", userId, chatRoomId);
    }

    @Transactional
    public ChatMemberVM addMember(AddMemberCmd cmd) {
        var room = chatRoomRepository.getById(cmd.chatRoomId());
        if (room.getType() != ChatRoomType.SUB_GROUP) {
            throw new DomainException("Members can only be added directly to sub-groups");
        }
        var requester = chatMemberRepository.findByChatRoomIdAndUserId(cmd.chatRoomId(), cmd.addedByUserId())
                .orElseThrow(() -> new DomainException("You are not a member of this chat room"));
        if (requester.getRole() != MemberRole.ADMIN) {
            throw new DomainException("Only admins can add members directly");
        }
        String parentRoomId = room.getParentChatRoomId();
        if (!chatMemberRepository.existsByChatRoomIdAndUserId(parentRoomId, cmd.userIdToAdd())) {
            throw new DomainException("You can only add users who have joined the same event");
        }
        if (chatMemberRepository.existsByChatRoomIdAndUserId(cmd.chatRoomId(), cmd.userIdToAdd())) {
            throw new DomainException("User is already a member of this group");
        }
        var member = ChatMemberEntity.create(cmd.chatRoomId(), cmd.userIdToAdd(), MemberRole.MEMBER);
        chatMemberRepository.save(member);
        return chatMapper.toChatMemberVM(member, resolveUserName(cmd.userIdToAdd()));
    }

    @Transactional
    public ChatRoomVM createSubGroup(CreateSubGroupCmd cmd) {
        var parentRoom = chatRoomRepository.getById(cmd.parentChatRoomId());
        if (parentRoom.getType() != ChatRoomType.EVENT_GROUP) {
            throw new DomainException("Sub-groups can only be created from an event group chat");
        }
        assertMember(cmd.parentChatRoomId(), cmd.createdByUserId());

        var subGroup = ChatRoomEntity.createSubGroup(
                cmd.name(), cmd.parentChatRoomId(), parentRoom.getEventId(), cmd.createdByUserId());
        chatRoomRepository.save(subGroup);

        chatMemberRepository.save(
                ChatMemberEntity.create(subGroup.getId().id(), cmd.createdByUserId(), MemberRole.ADMIN));

        return chatMapper.toChatRoomVM(subGroup);
    }

    // ── Invitations ─────────────────────────────────────────────────────────

    @Transactional
    public ChatInvitationVM inviteUser(InviteUserCmd cmd) {
        var room = chatRoomRepository.getById(cmd.chatRoomId());
        if (room.getType() != ChatRoomType.SUB_GROUP) {
            throw new DomainException("Invitations are only for sub-groups; event group chats are joined automatically");
        }
        assertMember(cmd.chatRoomId(), cmd.invitedByUserId());

        // Invited user must be in the parent event group
        String parentRoomId = room.getParentChatRoomId();
        if (!chatMemberRepository.existsByChatRoomIdAndUserId(parentRoomId, cmd.invitedUserId())) {
            throw new DomainException("You can only invite users who have joined the same event");
        }
        if (chatMemberRepository.existsByChatRoomIdAndUserId(cmd.chatRoomId(), cmd.invitedUserId())) {
            throw new DomainException("User is already a member of this group");
        }
        if (invitationRepository.existsByChatRoomIdAndInvitedUserIdAndStatus(
                cmd.chatRoomId(), cmd.invitedUserId(), InvitationStatus.PENDING)) {
            throw new DomainException("A pending invitation already exists for this user");
        }

        var invitation = ChatInvitationEntity.create(cmd.chatRoomId(), cmd.invitedUserId(), cmd.invitedByUserId());
        invitationRepository.save(invitation);
        return chatMapper.toChatInvitationVM(invitation, room.getName());
    }

    @Transactional(readOnly = true)
    public List<ChatInvitationVM> getMyPendingInvitations(String userId) {
        return invitationRepository.findByInvitedUserIdAndStatus(userId, InvitationStatus.PENDING)
                .stream()
                .map(inv -> {
                    String roomName = chatRoomRepository.findById(ChatRoomId.of(inv.getChatRoomId()))
                            .map(ChatRoomEntity::getName).orElse("Unknown");
                    return chatMapper.toChatInvitationVM(inv, roomName);
                })
                .toList();
    }

    @Transactional
    public ChatInvitationVM respondToInvitation(RespondToInvitationCmd cmd) {
        var invitation = invitationRepository.getById(cmd.invitationId());
        if (!invitation.getInvitedUserId().equals(cmd.userId())) {
            throw new DomainException("You can only respond to your own invitations");
        }
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new DomainException("This invitation has already been " + invitation.getStatus().name().toLowerCase());
        }
        if (cmd.accept()) {
            invitation.accept();
            chatMemberRepository.save(
                    ChatMemberEntity.create(invitation.getChatRoomId(), cmd.userId(), MemberRole.MEMBER));
        } else {
            invitation.decline();
        }
        invitationRepository.save(invitation);

        String roomName = chatRoomRepository.findById(ChatRoomId.of(invitation.getChatRoomId()))
                .map(ChatRoomEntity::getName).orElse("Unknown");
        return chatMapper.toChatInvitationVM(invitation, roomName);
    }

    // ── Messages ────────────────────────────────────────────────────────────

    @Transactional
    public MessageVM sendMessage(SendMessageCmd cmd) {
        if (cmd.isOrganizerOrAdmin()) {
            ensureMember(cmd.chatRoomId(), cmd.senderId());
        } else {
            assertMember(cmd.chatRoomId(), cmd.senderId());
        }
        var message = MessageEntity.create(cmd.chatRoomId(), cmd.senderId(), cmd.content());
        messageRepository.save(message);
        String senderName = resolveUserName(cmd.senderId());

        // Notify all other members of the chat room
        var recipientIds = chatMemberRepository.findByChatRoomId(cmd.chatRoomId()).stream()
                .map(ChatMemberEntity::getUserId)
                .filter(uid -> !uid.equals(cmd.senderId()))
                .toList();
        if (!recipientIds.isEmpty()) {
            String roomName = chatRoomRepository.getById(cmd.chatRoomId()).getName();
            eventPublisher.publish(new ChatMessageSent(
                    cmd.chatRoomId(), roomName, cmd.senderId(), senderName, cmd.content(), recipientIds));
        }

        return chatMapper.toMessageVM(message, senderName);
    }

    @Transactional(readOnly = true)
    public Page<MessageVM> getMessages(String chatRoomId, String userId, boolean isOrganizerOrAdmin, Pageable pageable) {
        if (!isOrganizerOrAdmin) assertMember(chatRoomId, userId);
        var messagePage = messageRepository.findByChatRoomIdOrderByCreatedAtDesc(chatRoomId, pageable);

        // Batch-resolve sender names to avoid N+1 lookups
        Map<String, String> nameCache = messagePage.getContent().stream()
                .map(MessageEntity::getSenderId)
                .distinct()
                .collect(Collectors.toMap(id -> id, this::resolveUserName));

        var vms = messagePage.getContent().stream()
                .map(m -> chatMapper.toMessageVM(m, nameCache.get(m.getSenderId())))
                .toList();
        return new PageImpl<>(vms, pageable, messagePage.getTotalElements());
    }

    // ── File uploads ────────────────────────────────────────────────────────

    @Transactional
    public MessageVM uploadFile(UploadFileCmd cmd) {
        if (cmd.isOrganizerOrAdmin()) {
            ensureMember(cmd.chatRoomId(), cmd.senderId());
        } else {
            assertMember(cmd.chatRoomId(), cmd.senderId());
        }
        var id = MessageId.generate();
        String safeFileName = cmd.originalFileName() != null ? cmd.originalFileName() : "file";
        String key = "chat/" + cmd.chatRoomId() + "/" + id.id() + "/" + safeFileName;
        s3StorageService.upload(key, cmd.bytes(), cmd.contentType());
        var message = MessageEntity.createFile(id, cmd.chatRoomId(), cmd.senderId(),
                key, safeFileName, (long) cmd.bytes().length, cmd.contentType());
        messageRepository.save(message);
        String senderName = resolveUserName(cmd.senderId());
        return chatMapper.toMessageVM(message, senderName);
    }

    @Transactional(readOnly = true)
    public String getFileUrl(String chatRoomId, String messageId, String userId) {
        assertMember(chatRoomId, userId);
        var message = messageRepository.findByStringId(messageId)
                .orElseThrow(() -> new DomainException("Message not found"));
        if (message.getFileKey() == null) {
            throw new DomainException("This message has no file attachment");
        }
        return s3StorageService.presignedGetUrl(message.getFileKey());
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /**
     * For each DIRECT room in the list, finds the other member's full name
     * (i.e. the member who is not {@code userId}) and returns a map of roomId → display name.
     */
    private Map<String, String> resolveDirectRoomNames(List<ChatRoomEntity> rooms, String userId) {
        // roomId → otherUserId
        Map<String, String> roomToOtherUser = new HashMap<>();
        for (var room : rooms) {
            if (room.getType() == ChatRoomType.DIRECT) {
                chatMemberRepository.findByChatRoomId(room.getId().id()).stream()
                        .filter(m -> !m.getUserId().equals(userId))
                        .findFirst()
                        .ifPresent(m -> roomToOtherUser.put(room.getId().id(), m.getUserId()));
            }
        }
        if (roomToOtherUser.isEmpty()) return Collections.emptyMap();

        // Batch-resolve names to avoid N calls
        var otherUserIds = roomToOtherUser.values().stream().distinct().toList();
        Map<String, String> nameByUserId = new HashMap<>();
        try {
            usersAPI.getUsersByIds(otherUserIds)
                    .forEach(u -> nameByUserId.put(u.id(), u.firstName() + " " + u.lastName()));
        } catch (Exception e) {
            log.warn("Could not batch-resolve user names for direct rooms");
        }

        Map<String, String> result = new HashMap<>();
        roomToOtherUser.forEach((roomId, otherUserId) ->
                result.put(roomId, nameByUserId.getOrDefault(otherUserId, "Direct Message")));
        return result;
    }

    private ChatRoomVM overrideDirectName(ChatRoomVM vm, Map<String, String> directNames) {
        String name = directNames.get(vm.id());
        if (name == null) return vm;
        return new ChatRoomVM(vm.id(), name, vm.type(), vm.eventId(), vm.parentChatRoomId(), vm.createdBy(), vm.createdAt());
    }

    private void assertMember(String chatRoomId, String userId) {
        if (!chatMemberRepository.existsByChatRoomIdAndUserId(chatRoomId, userId)) {
            throw new DomainException("You are not a member of this chat room");
        }
    }

    /** Auto-joins an organizer/admin as a MEMBER if they aren't already one. */
    private void ensureMember(String chatRoomId, String userId) {
        if (!chatMemberRepository.existsByChatRoomIdAndUserId(chatRoomId, userId)) {
            chatMemberRepository.save(ChatMemberEntity.create(chatRoomId, userId, MemberRole.MEMBER));
            log.debug("Auto-joined organizer/admin {} into chat room {}", userId, chatRoomId);
        }
    }

    private String resolveUserName(String userId) {
        try {
            var user = usersAPI.getById(userId);
            return user.firstName() + " " + user.lastName();
        } catch (Exception e) {
            log.warn("Could not resolve name for user {}", userId);
            return "Unknown";
        }
    }
}
