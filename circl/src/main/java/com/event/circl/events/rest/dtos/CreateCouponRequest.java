package com.event.circl.events.rest.dtos;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public record CreateCouponRequest(
        @NotBlank(message = "Coupon code is required")
        String code,

        Integer maxUses,

        Instant expiresAt
) {}
