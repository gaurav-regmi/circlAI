package com.event.circl.notifications.domain;

import com.event.circl.notifications.domain.models.NotificationType;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.*;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_user_id", columnList = "user_id"),
        @Index(name = "idx_notif_user_seen", columnList = "user_id, seen")
})
class NotificationEntity extends BaseEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private NotificationType type;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "reference_id")
    private String referenceId;

    @Column(name = "seen", nullable = false)
    private boolean seen = false;

    protected NotificationEntity() {}

    static NotificationEntity create(String userId, NotificationType type,
                                     String title, String message, String referenceId) {
        var n = new NotificationEntity();
        n.id = IdGenerator.generateString();
        n.userId = userId;
        n.type = type;
        n.title = title;
        n.message = message;
        n.referenceId = referenceId;
        n.seen = false;
        return n;
    }

    void markSeen() {
        this.seen = true;
    }

    String getId() { return id; }
    String getUserId() { return userId; }
    NotificationType getType() { return type; }
    String getTitle() { return title; }
    String getMessage() { return message; }
    String getReferenceId() { return referenceId; }
    boolean isSeen() { return seen; }
}
