package com.event.circl.discovery.rest.controllers;

import com.event.circl.discovery.domain.PeopleDiscoveryService;
import com.event.circl.discovery.domain.models.PersonSuggestionVM;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/people")
public class PeopleController {

    private final PeopleDiscoveryService discoveryService;

    PeopleController(PeopleDiscoveryService discoveryService) {
        this.discoveryService = discoveryService;
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<PersonSuggestionVM>> getSuggestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(discoveryService.findSuggestedPeople(userId(jwt), page, size));
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<List<PersonSuggestionVM>> getEventAttendees(
            @PathVariable String eventId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(discoveryService.findEventAttendees(eventId, userId(jwt)));
    }

    private String userId(Jwt jwt) {
        return jwt.getClaimAsString("userId");
    }
}
