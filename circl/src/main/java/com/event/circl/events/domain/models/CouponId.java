package com.event.circl.events.domain.models;

import com.event.circl.shared.utils.IdGenerator;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public record CouponId(String id) implements Serializable {
    public CouponId {
        if (id == null || id.trim().isBlank()) {
            throw new IllegalArgumentException("Coupon id cannot be null or empty");
        }
    }

    public static CouponId of(String id) {
        return new CouponId(id);
    }

    public static CouponId generate() {
        return new CouponId(IdGenerator.generateString());
    }
}
