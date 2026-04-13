package com.event.circl.activity.rest.controllers;

import com.event.circl.activity.domain.ActivityService;
import com.event.circl.activity.domain.models.ActivityVM;
import com.event.circl.activity.domain.models.UpdateAttendanceCmd;
import com.event.circl.activity.rest.dtos.UpdateAttendanceRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityService activityService;

    ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    /** Paginated activity feed for the logged-in user. */
    @GetMapping
    public ResponseEntity<Page<ActivityVM>> getMyActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(
                activityService.getMyActivities(userId(jwt), PageRequest.of(page, size)));
    }

    /** All attendees for a specific event — organizer or admin only. */
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<List<ActivityVM>> getEventActivities(
            @PathVariable String eventId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(
                activityService.getEventActivities(eventId, userId(jwt), isAdmin(jwt)));
    }

    /** User marks themselves as attended (self check-in). */
    @PostMapping("/{activityId}/check-in")
    public ResponseEntity<ActivityVM> checkIn(
            @PathVariable String activityId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(activityService.checkIn(activityId, userId(jwt)));
    }

    /** Organizer or admin sets ATTENDED or NO_SHOW for any attendee. */
    @PatchMapping("/{activityId}/status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<ActivityVM> updateAttendance(
            @PathVariable String activityId,
            @Valid @RequestBody UpdateAttendanceRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new UpdateAttendanceCmd(activityId, userId(jwt), isAdmin(jwt), request.status());
        return ResponseEntity.ok(activityService.updateAttendance(cmd));
    }

    private String userId(Jwt jwt) {
        return jwt.getClaimAsString("userId");
    }

    private boolean isAdmin(Jwt jwt) {
        return "ADMIN".equals(jwt.getClaimAsString("role"));
    }
}
