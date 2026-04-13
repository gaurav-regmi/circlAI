package com.event.circl.activity.domain;

import com.event.circl.activity.domain.models.ActivityId;
import com.event.circl.shared.exceptions.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface UserActivityRepository extends JpaRepository<UserActivityEntity, ActivityId> {

    Page<UserActivityEntity> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<UserActivityEntity> findByEventIdOrderByCreatedAtDesc(String eventId);

    boolean existsByEventIdAndUserId(String eventId, String userId);

    long countByEventIdAndUserRoleNotIn(String eventId, List<String> excludedRoles);

    default UserActivityEntity getById(String id) {
        return findById(ActivityId.of(id))
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found: " + id));
    }
}
