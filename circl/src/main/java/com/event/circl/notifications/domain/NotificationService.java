package com.event.circl.notifications.domain;

import com.event.circl.chat.domain.models.ChatMessageSent;
import com.event.circl.chat.domain.models.DirectChatRequestAccepted;
import com.event.circl.chat.domain.models.DirectChatRequestSent;
import com.event.circl.events.domain.models.EventCancelled;
import com.event.circl.events.domain.models.EventCreated;
import com.event.circl.events.domain.models.UserRegisteredForEvent;
import com.event.circl.notifications.domain.models.NotificationType;
import com.event.circl.notifications.domain.models.NotificationVM;
import com.event.circl.shared.exceptions.DomainException;
import com.event.circl.shared.exceptions.ResourceNotFoundException;
import com.event.circl.users.UsersAPI;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repository;
    private final NotificationMapper mapper;
    private final UsersAPI usersAPI;

    NotificationService(NotificationRepository repository, NotificationMapper mapper, UsersAPI usersAPI) {
        this.repository = repository;
        this.mapper = mapper;
        this.usersAPI = usersAPI;
    }

    // ── Domain event listeners ──────────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEventCreated(EventCreated event) {
        if (!"PUBLIC".equals(event.type())) return;
        List<String> userIds = usersAPI.getAllUserIdsExcept(event.organizerId());
        if (userIds.isEmpty()) return;
        var notifications = userIds.stream()
                .map(uid -> NotificationEntity.create(
                        uid,
                        NotificationType.EVENT_CREATED,
                        "New event",
                        "\"" + event.title() + "\" is now available — check it out!",
                        event.eventId()
                ))
                .toList();
        repository.saveAll(notifications);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUserRegisteredForEvent(UserRegisteredForEvent event) {
        // Skip the auto-registration that fires when the organizer creates their own event
        if (event.userId().equals(event.organizerId())) return;

        // Notify the organizer
        repository.save(NotificationEntity.create(
                event.organizerId(),
                NotificationType.EVENT_REGISTRATION,
                "New registration",
                "Someone registered for \"" + event.eventTitle() + "\"",
                event.eventId()
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onChatMessageSent(ChatMessageSent event) {
        if (event.recipientUserIds().isEmpty()) return;
        String preview = event.senderName() + ": " + truncate(event.messagePreview(), 80);
        var notifications = event.recipientUserIds().stream()
                .map(uid -> NotificationEntity.create(
                        uid,
                        NotificationType.CHAT_MESSAGE,
                        event.chatRoomName(),
                        preview,
                        event.chatRoomId()
                ))
                .toList();
        repository.saveAll(notifications);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEventCancelled(EventCancelled event) {
        if (event.registeredUserIds().isEmpty()) return;
        var notifications = event.registeredUserIds().stream()
                .map(uid -> NotificationEntity.create(
                        uid,
                        NotificationType.EVENT_CANCELLED,
                        "Event cancelled",
                        "\"" + event.eventTitle() + "\" has been cancelled",
                        event.eventId()
                ))
                .toList();
        repository.saveAll(notifications);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDirectChatRequestSent(DirectChatRequestSent event) {
        repository.save(NotificationEntity.create(
                event.receiverId(),
                NotificationType.CHAT_REQUEST,
                "New chat request",
                event.senderName() + " wants to chat with you",
                event.requestId()
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDirectChatRequestAccepted(DirectChatRequestAccepted event) {
        repository.save(NotificationEntity.create(
                event.senderId(),
                NotificationType.CHAT_REQUEST_ACCEPTED,
                "Chat request accepted",
                event.receiverName() + " accepted your chat request",
                event.chatRoomId()
        ));
    }

    // ── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NotificationVM> getAll(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(mapper::toVM).toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationVM> getUnseen(String userId) {
        return repository.findByUserIdAndSeenFalseOrderByCreatedAtDesc(userId)
                .stream().map(mapper::toVM).toList();
    }

    @Transactional(readOnly = true)
    public long countUnseen(String userId) {
        return repository.countByUserIdAndSeenFalse(userId);
    }

    @Transactional
    public void markSeen(String notificationId, String userId) {
        var notification = repository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new DomainException("Cannot mark another user's notification as seen");
        }
        notification.markSeen();
        repository.save(notification);
    }

    @Transactional
    public void markAllSeen(String userId) {
        repository.markAllSeenForUser(userId);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() <= maxLen ? text : text.substring(0, maxLen) + "…";
    }
}
