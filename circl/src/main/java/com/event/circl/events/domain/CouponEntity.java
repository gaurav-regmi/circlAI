package com.event.circl.events.domain;

import com.event.circl.events.domain.models.CouponId;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.exceptions.DomainException;
import com.event.circl.shared.utils.AssertUtil;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "coupons", uniqueConstraints = {
        @UniqueConstraint(name = "uk_coupons_event_code", columnNames = {"event_id", "code"})
})
class CouponEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private CouponId id;

    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Column(name = "code", nullable = false)
    private String code;

    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "used_count", nullable = false)
    private int usedCount;

    @Column(name = "expires_at")
    private Instant expiresAt;

    protected CouponEntity() {}

    CouponEntity(CouponId id, String eventId, String code, Integer maxUses, Instant expiresAt) {
        this.id = AssertUtil.requireNotNull(id, "Coupon id cannot be null");
        this.eventId = AssertUtil.requireNotBlank(eventId, "Event id cannot be blank");
        this.code = AssertUtil.requireNotBlank(code, "Coupon code cannot be blank");
        this.maxUses = maxUses;
        this.usedCount = 0;
        this.expiresAt = expiresAt;
    }

    static CouponEntity create(String eventId, String code, Integer maxUses, Instant expiresAt) {
        return new CouponEntity(CouponId.generate(), eventId, code, maxUses, expiresAt);
    }

    void validateAndUse() {
        if (expiresAt != null && Instant.now().isAfter(expiresAt)) {
            throw new DomainException("Coupon '" + code + "' has expired");
        }
        if (maxUses != null && usedCount >= maxUses) {
            throw new DomainException("Coupon '" + code + "' has reached its maximum number of uses");
        }
        this.usedCount++;
    }

    boolean isActive() {
        boolean notExpired = expiresAt == null || Instant.now().isBefore(expiresAt);
        boolean hasUsesLeft = maxUses == null || usedCount < maxUses;
        return notExpired && hasUsesLeft;
    }

    CouponId getId() { return id; }
    String getEventId() { return eventId; }
    String getCode() { return code; }
    Integer getMaxUses() { return maxUses; }
    int getUsedCount() { return usedCount; }
    Instant getExpiresAt() { return expiresAt; }
}
