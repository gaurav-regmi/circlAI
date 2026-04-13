package com.event.circl.chat.rest.controllers;

import com.event.circl.chat.domain.DirectChatRequestService;
import com.event.circl.chat.domain.models.DirectChatRequestVM;
import com.event.circl.chat.rest.dtos.SendDirectChatRequestRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/direct-requests")
public class DirectChatRequestController {

    private final DirectChatRequestService directChatRequestService;

    DirectChatRequestController(DirectChatRequestService directChatRequestService) {
        this.directChatRequestService = directChatRequestService;
    }

    @PostMapping
    public ResponseEntity<DirectChatRequestVM> sendRequest(
            @Valid @RequestBody SendDirectChatRequestRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(directChatRequestService.sendRequest(userId(jwt), request.targetUserId()));
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<DirectChatRequestVM>> getIncoming(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(directChatRequestService.getIncomingRequests(userId(jwt)));
    }

    @GetMapping("/outgoing")
    public ResponseEntity<List<DirectChatRequestVM>> getOutgoing(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(directChatRequestService.getOutgoingRequests(userId(jwt)));
    }

    @PostMapping("/{requestId}/accept")
    public ResponseEntity<DirectChatRequestVM> accept(
            @PathVariable String requestId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(directChatRequestService.acceptRequest(requestId, userId(jwt)));
    }

    @PostMapping("/{requestId}/decline")
    public ResponseEntity<DirectChatRequestVM> decline(
            @PathVariable String requestId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(directChatRequestService.declineRequest(requestId, userId(jwt)));
    }

    @GetMapping("/connection-status/{targetUserId}")
    public ResponseEntity<DirectChatRequestVM> getConnectionStatus(
            @PathVariable String targetUserId,
            @AuthenticationPrincipal Jwt jwt) {
        return directChatRequestService.getConnectionStatus(userId(jwt), targetUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<Void> cancel(
            @PathVariable String requestId,
            @AuthenticationPrincipal Jwt jwt) {
        directChatRequestService.cancelRequest(requestId, userId(jwt));
        return ResponseEntity.noContent().build();
    }

    private String userId(Jwt jwt) {
        return jwt.getClaimAsString("userId");
    }
}
