package com.event.circl.notifications.rest.controllers;

import com.event.circl.notifications.domain.NotificationService;
import com.event.circl.notifications.domain.models.NotificationVM;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationVM>> getAll(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(notificationService.getAll(userId(jwt)));
    }

    @GetMapping("/unseen")
    public ResponseEntity<List<NotificationVM>> getUnseen(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(notificationService.getUnseen(userId(jwt)));
    }

    @GetMapping("/unseen/count")
    public ResponseEntity<Map<String, Long>> countUnseen(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(Map.of("count", notificationService.countUnseen(userId(jwt))));
    }

    @PutMapping("/{id}/seen")
    public ResponseEntity<Void> markSeen(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        notificationService.markSeen(id, userId(jwt));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/seen")
    public ResponseEntity<Void> markAllSeen(@AuthenticationPrincipal Jwt jwt) {
        notificationService.markAllSeen(userId(jwt));
        return ResponseEntity.noContent().build();
    }

    private String userId(Jwt jwt) {
        return jwt.getClaimAsString("userId");
    }
}
