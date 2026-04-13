package com.event.circl.events.domain;

import com.event.circl.events.domain.models.CouponVM;
import com.event.circl.events.domain.models.EventVM;
import com.event.circl.events.domain.models.RegistrationVM;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
class EventMapper {

    EventVM toEventVM(EventEntity event) {
        return new EventVM(
                event.getId().id(),
                event.getTitle(),
                event.getDescription(),
                event.getLocation(),
                event.getType().name(),
                event.getStatus().name(),
                event.getStartDateTime(),
                event.getEndDateTime(),
                event.getOrganizerId(),
                event.getMaxCapacity(),
                event.getParking() != null ? event.getParking().name() : null,
                parseList(event.getInterests())
        );
    }

    private List<String> parseList(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    CouponVM toCouponVM(CouponEntity coupon) {
        return new CouponVM(
                coupon.getId().id(),
                coupon.getEventId(),
                coupon.getCode(),
                coupon.getMaxUses(),
                coupon.getUsedCount(),
                coupon.getExpiresAt(),
                coupon.isActive()
        );
    }

    RegistrationVM toRegistrationVM(EventRegistrationEntity registration) {
        return new RegistrationVM(
                registration.getId().id(),
                registration.getEventId(),
                registration.getUserId(),
                registration.getStatus().name(),
                registration.getCreatedAt()
        );
    }
}
