package com.event.circl.events.rest.controllers;

import com.event.circl.events.domain.EventService;
import com.event.circl.events.domain.models.*;
import com.event.circl.events.rest.dtos.CreateCouponRequest;
import com.event.circl.events.rest.dtos.CreateEventRequest;
import com.event.circl.events.rest.dtos.GeneratedCouponCodeResponse;
import com.event.circl.events.rest.dtos.RegisterForEventRequest;
import com.event.circl.events.rest.dtos.UpdateEventRequest;
import com.event.circl.shared.exceptions.DomainException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<EventVM> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new CreateEventCmd(
                request.title(), request.description(), request.location(),
                request.type(), request.startDateTime(), request.endDateTime(),
                userId(jwt), request.maxCapacity(), request.parking(), request.interests()
        );
        EventId eventId = eventService.createEvent(cmd);
        EventVM event = eventService.getEventById(eventId.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(event);
    }

    @PatchMapping("/{eventId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<EventVM> updateEvent(
            @PathVariable String eventId,
            @Valid @RequestBody UpdateEventRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new UpdateEventCmd(
                eventId, request.title(), request.description(), request.location(),
                request.type(), request.startDateTime(), request.endDateTime(),
                request.maxCapacity(), request.parking(), request.interests(),
                userId(jwt), isAdmin(jwt)
        );
        return ResponseEntity.ok(eventService.updateEvent(cmd));
    }

    @PostMapping("/{eventId}/publish")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<EventVM> publishEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal Jwt jwt) {
        EventVM event = eventService.publishEvent(eventId, userId(jwt), isAdmin(jwt));
        return ResponseEntity.ok(event);
    }

    @PostMapping("/{eventId}/cancel")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<EventVM> cancelEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal Jwt jwt) {
        EventVM event = eventService.cancelEvent(eventId, userId(jwt), isAdmin(jwt));
        return ResponseEntity.ok(event);
    }

    @GetMapping
    public ResponseEntity<Page<EventVM>> listPublishedEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTo,
            @RequestParam(required = false) String location,
            @AuthenticationPrincipal() Jwt jwt) {
        EventType eventType = (type != null && !type.isBlank()) ? EventType.valueOf(type.toUpperCase()) : null;
        String requestingUserId = jwt != null ? userId(jwt) : null;
        var filter = new EventFilterCmd(search, eventType, startFrom, startTo, location, requestingUserId);
        return ResponseEntity.ok(eventService.getPublishedEvents(filter, PageRequest.of(page, size)));
    }

    @GetMapping("/my-events")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<List<EventVM>> listMyEvents(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(eventService.getMyEvents(userId(jwt)));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<EventVM> getEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal Jwt jwt) {
        String requestingUserId = jwt != null ? userId(jwt) : null;
        return ResponseEntity.ok(eventService.getEventForUser(eventId, requestingUserId));
    }

    @PostMapping("/{eventId}/coupons")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<CouponVM> createCoupon(
            @PathVariable String eventId,
            @Valid @RequestBody CreateCouponRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new CreateCouponCmd(
                eventId, request.code(), request.maxUses(), request.expiresAt(),
                userId(jwt), isAdmin(jwt)
        );
        CouponVM coupon = eventService.createCoupon(cmd);
        return ResponseEntity.status(HttpStatus.CREATED).body(coupon);
    }

    @GetMapping("/{eventId}/coupons")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<List<CouponVM>> listCoupons(
            @PathVariable String eventId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(eventService.getCouponsForEvent(eventId, userId(jwt), isAdmin(jwt)));
    }

    @GetMapping("/{eventId}/coupons/generate")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<GeneratedCouponCodeResponse> generateCouponCode(
            @PathVariable String eventId,
            @AuthenticationPrincipal Jwt jwt) {
        String code = eventService.generateCouponCode(eventId, userId(jwt), isAdmin(jwt));
        return ResponseEntity.ok(new GeneratedCouponCodeResponse(code));
    }

    @PostMapping("/{eventId}/register")
    public ResponseEntity<RegistrationVM> register(
            @PathVariable String eventId,
            @RequestBody(required = false) RegisterForEventRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String couponCode = request != null ? request.couponCode() : null;
        var cmd = new RegisterForEventCmd(eventId, userId(jwt), couponCode);
        RegistrationVM registration = eventService.registerForEvent(cmd);
        return ResponseEntity.status(HttpStatus.CREATED).body(registration);
    }

    @GetMapping("/{eventId}/registrations")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<List<RegistrationVM>> listRegistrations(
            @PathVariable String eventId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(eventService.getRegistrationsForEvent(eventId, userId(jwt), isAdmin(jwt)));
    }

    @GetMapping("/my-registrations")
    public ResponseEntity<List<RegistrationVM>> listMyRegistrations(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(eventService.getMyRegistrations(userId(jwt)));
    }

    @PostMapping("/{eventId}/cover")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EVENT_ORGANIZER', 'EVENT_ORGANIZER_MEMBER')")
    public ResponseEntity<Void> uploadCover(
            @PathVariable String eventId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new DomainException("Only image files are allowed");
        }
        if (file.getSize() > 10L * 1024 * 1024) {
            throw new DomainException("Cover image must be smaller than 10 MB");
        }
        eventService.uploadCoverImage(eventId, userId(jwt), isAdmin(jwt), file.getBytes(), contentType);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{eventId}/cover")
    public ResponseEntity<Void> getCover(@PathVariable String eventId) {
        Optional<String> imageUrl = eventService.getCoverImageUrl(eventId);

        if (imageUrl.isPresent()) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, imageUrl.get())
                    .build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    private String userId(Jwt jwt) {
        return jwt.getClaimAsString("userId");
    }

    private boolean isAdmin(Jwt jwt) {
        return "ADMIN".equals(jwt.getClaimAsString("role"));
    }
}
