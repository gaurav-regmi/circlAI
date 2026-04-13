package com.event.circl.activity.domain;

import com.event.circl.activity.domain.models.ActivityVM;
import com.event.circl.activity.domain.models.AttendanceStatus;
import com.event.circl.activity.domain.models.UpdateAttendanceCmd;
import com.event.circl.events.EventsAPI;
import com.event.circl.events.domain.models.UserRegisteredForEvent;
import com.event.circl.shared.exceptions.DomainException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityService {
    private static final Logger log = LoggerFactory.getLogger(ActivityService.class);
    private static final List<String> ORGANIZER_ROLES = List.of("EVENT_ORGANIZER", "EVENT_ORGANIZER_MEMBER");

    private final UserActivityRepository activityRepository;
    private final ActivityMapper activityMapper;
    private final EventsAPI eventsAPI;

    ActivityService(UserActivityRepository activityRepository, ActivityMapper activityMapper, EventsAPI eventsAPI) {
        this.activityRepository = activityRepository;
        this.activityMapper = activityMapper;
        this.eventsAPI = eventsAPI;
    }

    // ── Domain event listener ───────────────────────────────────────────────

    @EventListener
    @Transactional
    public void onUserRegisteredForEvent(UserRegisteredForEvent event) {
        if (activityRepository.existsByEventIdAndUserId(event.eventId(), event.userId())) {
            return; // idempotent — organizer may already have an activity from event creation
        }
        var activity = UserActivityEntity.create(
                event.userId(), event.eventId(), event.eventTitle(),
                event.eventType(), event.organizerId(), event.userRole()
        );
        activityRepository.save(activity);
        log.debug("Created activity for user {} on event {}", event.userId(), event.eventId());
    }

    // ── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ActivityVM> getMyActivities(String userId, Pageable pageable) {
        var page = activityRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        var eventIds = page.getContent().stream().map(UserActivityEntity::getEventId).distinct().toList();
        var statusMap = eventsAPI.getEventStatuses(eventIds);
        var countMap = eventIds.stream()
                .collect(Collectors.toMap(id -> id,
                        id -> activityRepository.countByEventIdAndUserRoleNotIn(id, ORGANIZER_ROLES)));
        var mapped = page.getContent().stream()
                .map(a -> activityMapper.toActivityVM(
                        a,
                        statusMap.getOrDefault(a.getEventId(), "UNKNOWN"),
                        countMap.getOrDefault(a.getEventId(), 0L)
                ))
                .toList();
        return new PageImpl<>(mapped, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<ActivityVM> getEventActivities(String eventId, String requestingUserId, boolean requestingUserIsAdmin) {
        var activities = activityRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        if (activities.isEmpty()) return List.of();
        boolean isOrganizer = !requestingUserIsAdmin &&
                activities.get(0).getOrganizerId().equals(requestingUserId);
        if (!requestingUserIsAdmin && !isOrganizer) {
            throw new DomainException("Only the event organizer or an admin can view all attendees");
        }
        var statusMap = eventsAPI.getEventStatuses(List.of(eventId));
        var eventStatus = statusMap.getOrDefault(eventId, "UNKNOWN");
        long totalRegistrations = activityRepository.countByEventIdAndUserRoleNotIn(eventId, ORGANIZER_ROLES);
        return activities.stream()
                .map(a -> activityMapper.toActivityVM(a, eventStatus, totalRegistrations))
                .toList();
    }

    // ── Self check-in (user marks themselves as attended) ───────────────────

    @Transactional
    public ActivityVM checkIn(String activityId, String userId) {
        var activity = activityRepository.getById(activityId);
        if (!activity.getUserId().equals(userId)) {
            throw new DomainException("You can only check in to your own activities");
        }
        if (activity.getAttendanceStatus() == AttendanceStatus.ATTENDED) {
            throw new DomainException("You have already checked in to this event");
        }
        activity.checkIn();
        activityRepository.save(activity);
        return enrichedVM(activity);
    }

    // ── Organizer / admin attendance update ─────────────────────────────────

    @Transactional
    public ActivityVM updateAttendance(UpdateAttendanceCmd cmd) {
        var activity = activityRepository.getById(cmd.activityId());
        boolean isOrganizerOrAdmin = cmd.requestingUserIsAdmin()
                || activity.getOrganizerId().equals(cmd.requestingUserId());
        if (!isOrganizerOrAdmin) {
            throw new DomainException("Only the event organizer or an admin can update attendance");
        }
        activity.markAttendance(cmd.newStatus());
        activityRepository.save(activity);
        return enrichedVM(activity);
    }

    private ActivityVM enrichedVM(UserActivityEntity activity) {
        var statusMap = eventsAPI.getEventStatuses(List.of(activity.getEventId()));
        var eventStatus = statusMap.getOrDefault(activity.getEventId(), "UNKNOWN");
        var totalRegistrations = activityRepository.countByEventIdAndUserRoleNotIn(activity.getEventId(), ORGANIZER_ROLES);
        return activityMapper.toActivityVM(activity, eventStatus, totalRegistrations);
    }
}
