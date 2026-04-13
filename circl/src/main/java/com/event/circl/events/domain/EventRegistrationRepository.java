package com.event.circl.events.domain;

import com.event.circl.events.domain.models.RegistrationId;
import com.event.circl.events.domain.models.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

interface EventRegistrationRepository extends JpaRepository<EventRegistrationEntity, RegistrationId> {

    boolean existsByEventIdAndUserId(String eventId, String userId);

    long countByEventId(String eventId);

    List<EventRegistrationEntity> findByEventId(String eventId);

    List<EventRegistrationEntity> findByUserId(String userId);

    @Query("SELECT r.eventId FROM EventRegistrationEntity r WHERE r.userId = :userId AND r.eventId IN :eventIds")
    Set<String> findRegisteredEventIds(@Param("userId") String userId, @Param("eventIds") List<String> eventIds);

    @Query("SELECT r.eventId FROM EventRegistrationEntity r WHERE r.userId = :userId AND r.status = :status")
    List<String> findEventIdsByUserIdAndStatus(@Param("userId") String userId, @Param("status") RegistrationStatus status);

    @Query("SELECT DISTINCT r.userId FROM EventRegistrationEntity r WHERE r.eventId IN :eventIds AND r.userId <> :excludeUserId AND r.status = :status")
    List<String> findCoAttendeeUserIds(@Param("eventIds") List<String> eventIds, @Param("excludeUserId") String excludeUserId, @Param("status") RegistrationStatus status);

    @Query("SELECT DISTINCT r.userId FROM EventRegistrationEntity r WHERE r.eventId = :eventId AND r.userId <> :excludeUserId AND r.status = :status")
    List<String> findAttendeeUserIdsByEventId(@Param("eventId") String eventId, @Param("excludeUserId") String excludeUserId, @Param("status") RegistrationStatus status);

    @Query("SELECT r.userId, COUNT(r.eventId) FROM EventRegistrationEntity r WHERE r.eventId IN :eventIds AND r.userId IN :userIds AND r.status = :status GROUP BY r.userId")
    List<Object[]> countSharedEventsByUserIds(@Param("eventIds") List<String> eventIds, @Param("userIds") List<String> userIds, @Param("status") RegistrationStatus status);
}
