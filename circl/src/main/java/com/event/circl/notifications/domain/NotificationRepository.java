package com.event.circl.notifications.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

interface NotificationRepository extends JpaRepository<NotificationEntity, String> {

    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    List<NotificationEntity> findByUserIdAndSeenFalseOrderByCreatedAtDesc(String userId);

    long countByUserIdAndSeenFalse(String userId);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.seen = true WHERE n.userId = :userId AND n.seen = false")
    void markAllSeenForUser(String userId);
}
