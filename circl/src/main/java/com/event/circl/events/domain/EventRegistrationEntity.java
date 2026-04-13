package com.event.circl.events.domain;

import com.event.circl.events.domain.models.RegistrationId;
import com.event.circl.events.domain.models.RegistrationStatus;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.AssertUtil;
import jakarta.persistence.*;

@Entity
@Table(name = "event_registrations", uniqueConstraints = {
        @UniqueConstraint(name = "uk_registrations_event_user", columnNames = {"event_id", "user_id"})
})
class EventRegistrationEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private RegistrationId id;

    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "coupon_id")
    private String couponId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RegistrationStatus status;

    protected EventRegistrationEntity() {}

    EventRegistrationEntity(RegistrationId id, String eventId, String userId, String couponId) {
        this.id = AssertUtil.requireNotNull(id, "Registration id cannot be null");
        this.eventId = AssertUtil.requireNotBlank(eventId, "Event id cannot be blank");
        this.userId = AssertUtil.requireNotBlank(userId, "User id cannot be blank");
        this.couponId = couponId;
        this.status = RegistrationStatus.REGISTERED;
    }

    static EventRegistrationEntity create(String eventId, String userId, String couponId) {
        return new EventRegistrationEntity(RegistrationId.generate(), eventId, userId, couponId);
    }

    RegistrationId getId() { return id; }
    String getEventId() { return eventId; }
    String getUserId() { return userId; }
    String getCouponId() { return couponId; }
    RegistrationStatus getStatus() { return status; }
}
