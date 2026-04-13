package com.event.circl.events.domain;

import com.event.circl.events.domain.models.CouponId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface CouponRepository extends JpaRepository<CouponEntity, CouponId> {

    Optional<CouponEntity> findByCodeAndEventId(String code, String eventId);

    List<CouponEntity> findByEventId(String eventId);

    boolean existsByCodeAndEventId(String code, String eventId);
}
