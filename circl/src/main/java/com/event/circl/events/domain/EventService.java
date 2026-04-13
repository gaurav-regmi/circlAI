package com.event.circl.events.domain;

import com.event.circl.events.domain.models.*;
import com.event.circl.shared.exceptions.DomainException;
import com.event.circl.shared.services.S3StorageService;
import com.event.circl.shared.services.SpringEventPublisher;
import com.event.circl.events.domain.models.EventCancelled;
import com.event.circl.users.UsersAPI;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class EventService {
    private static final String COUPON_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int COUPON_LENGTH = 8;
    private static final int MAX_GENERATE_ATTEMPTS = 10;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String COVER_KEY_PREFIX = "event-covers/";

    private final EventRepository eventRepository;
    private final CouponRepository couponRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EventMapper eventMapper;
    private final SpringEventPublisher eventPublisher;
    private final UsersAPI usersAPI;
    private final S3StorageService s3StorageService;

    EventService(EventRepository eventRepository,
                 CouponRepository couponRepository,
                 EventRegistrationRepository registrationRepository,
                 EventMapper eventMapper,
                 SpringEventPublisher eventPublisher,
                 UsersAPI usersAPI,
                 S3StorageService s3StorageService) {
        this.eventRepository = eventRepository;
        this.couponRepository = couponRepository;
        this.registrationRepository = registrationRepository;
        this.eventMapper = eventMapper;
        this.eventPublisher = eventPublisher;
        this.usersAPI = usersAPI;
        this.s3StorageService = s3StorageService;
    }

    @Transactional
    public EventId createEvent(CreateEventCmd cmd) {
        String interestsStr = toCommaString(cmd.interests());
        var event = EventEntity.create(
                cmd.title(), cmd.description(), cmd.location(),
                cmd.type(), cmd.startDateTime(), cmd.endDateTime(),
                cmd.organizerId(), cmd.maxCapacity(), cmd.parking(), interestsStr
        );
        eventRepository.save(event);
        eventPublisher.publish(new EventCreated(event.getId().id(), event.getTitle(), event.getOrganizerId(), event.getType().name()));
        String organizerRole = usersAPI.getById(event.getOrganizerId()).role();
        eventPublisher.publish(new UserRegisteredForEvent(event.getId().id(), event.getTitle(), event.getType().name(), event.getOrganizerId(), event.getOrganizerId(), organizerRole));
        return event.getId();
    }

    @Transactional
    public EventVM updateEvent(UpdateEventCmd cmd) {
        var event = eventRepository.getById(cmd.eventId());
        assertOrganizerOrAdmin(event, cmd.requestingUserId(), cmd.requestingUserIsAdmin(), "edit");
        event.update(cmd.title(), cmd.description(), cmd.location(), cmd.type(),
                cmd.startDateTime(), cmd.endDateTime(), cmd.maxCapacity(),
                cmd.parking(), toCommaString(cmd.interests()));
        eventRepository.save(event);
        return eventMapper.toEventVM(event);
    }

    @Transactional
    public EventVM publishEvent(String eventId, String requestingUserId, boolean requestingUserIsAdmin) {
        var event = eventRepository.getById(eventId);
        assertOrganizerOrAdmin(event, requestingUserId, requestingUserIsAdmin, "publish");
        event.publish();
        eventRepository.save(event);
        return eventMapper.toEventVM(event);
    }

    @Transactional
    public EventVM cancelEvent(String eventId, String requestingUserId, boolean requestingUserIsAdmin) {
        var event = eventRepository.getById(eventId);
        assertOrganizerOrAdmin(event, requestingUserId, requestingUserIsAdmin, "cancel");
        event.cancel();
        eventRepository.save(event);

        // Notify all registered users (excluding the organizer who initiated the cancellation)
        var registeredUserIds = registrationRepository.findByEventId(eventId).stream()
                .map(EventRegistrationEntity::getUserId)
                .filter(uid -> !uid.equals(requestingUserId))
                .toList();
        if (!registeredUserIds.isEmpty()) {
            eventPublisher.publish(new EventCancelled(eventId, event.getTitle(), registeredUserIds));
        }

        return eventMapper.toEventVM(event);
    }

    @Transactional(readOnly = true)
    public Page<EventVM> getPublishedEvents(EventFilterCmd cmd, Pageable pageable) {
        String search = cmd.search();
        EventType type = cmd.type();
        String location = cmd.location();

        var spec = EventSpecifications.published(search, type, cmd.startFrom(), cmd.startTo(), location);
        var page = eventRepository.findAll(spec, pageable);

        // Batch-load which private events the requesting user is registered for
        String requestingUserId = cmd.requestingUserId();
        Set<String> registeredEventIds = Collections.emptySet();
        if (requestingUserId != null) {
            List<String> privateEventIds = page.getContent().stream()
                    .filter(EventEntity::isPrivate)
                    .map(e -> e.getId().id())
                    .toList();
            if (!privateEventIds.isEmpty()) {
                registeredEventIds = registrationRepository.findRegisteredEventIds(requestingUserId, privateEventIds);
            }
        }

        final Set<String> finalRegisteredIds = registeredEventIds;
        return page.map(event -> {
            var vm = eventMapper.toEventVM(event);
            if (event.isPrivate()) {
                boolean isOrganizer = event.getOrganizerId().equals(requestingUserId);
                boolean isRegistered = finalRegisteredIds.contains(event.getId().id());
                if (!isOrganizer && !isRegistered) {
                    vm = new EventVM(vm.id(), vm.title(), vm.description(), null,
                            vm.type(), vm.status(), vm.startDateTime(), vm.endDateTime(),
                            vm.organizerId(), vm.maxCapacity(), vm.parking(), vm.interests());
                }
            }
            return vm;
        });
    }

    @Transactional(readOnly = true)
    public List<EventVM> getMyEvents(String organizerId) {
        return eventRepository.findByOrganizerIdOrderByCreatedAtDesc(organizerId)
                .stream().map(eventMapper::toEventVM).toList();
    }

    @Transactional(readOnly = true)
    public EventVM getEventById(String eventId) {
        return eventMapper.toEventVM(eventRepository.getById(eventId));
    }

    @Transactional(readOnly = true)
    public EventVM getEventForUser(String eventId, String requestingUserId) {
        var event = eventRepository.getById(eventId);
        var vm = eventMapper.toEventVM(event);
        if (event.isPrivate()) {
            boolean isOrganizer = event.getOrganizerId().equals(requestingUserId);
            boolean isRegistered = requestingUserId != null &&
                    registrationRepository.existsByEventIdAndUserId(eventId, requestingUserId);
            if (!isOrganizer && !isRegistered) {
                vm = new EventVM(vm.id(), vm.title(), vm.description(), null,
                        vm.type(), vm.status(), vm.startDateTime(), vm.endDateTime(),
                        vm.organizerId(), vm.maxCapacity(), vm.parking(),vm.interests());
            }
        }
        return vm;
    }

    @Transactional(readOnly = true)
    public Map<String, String> getEventStatuses(List<String> eventIds) {
        return eventIds.stream()
                .distinct()
                .flatMap(id -> {
                    try {
                        return Stream.of(eventRepository.getById(id));
                    } catch (Exception e) {
                        return Stream.empty();
                    }
                })
                .collect(Collectors.toMap(
                        e -> e.getId().id(),
                        e -> e.getStatus().name()
                ));
    }

    @Transactional
    public CouponVM createCoupon(CreateCouponCmd cmd) {
        var event = eventRepository.getById(cmd.eventId());
        assertOrganizerOrAdmin(event, cmd.requestingUserId(), cmd.requestingUserIsAdmin(), "create coupons for");
        if (!event.isPrivate()) {
            throw new DomainException("Coupons can only be created for private events");
        }
        if (couponRepository.existsByCodeAndEventId(cmd.code(), cmd.eventId())) {
            throw new DomainException("Coupon code '" + cmd.code() + "' already exists for this event");
        }
        var coupon = CouponEntity.create(cmd.eventId(), cmd.code(), cmd.maxUses(), cmd.expiresAt());
        couponRepository.save(coupon);
        return eventMapper.toCouponVM(coupon);
    }

    @Transactional(readOnly = true)
    public List<CouponVM> getCouponsForEvent(String eventId, String requestingUserId, boolean requestingUserIsAdmin) {
        var event = eventRepository.getById(eventId);
        assertOrganizerOrAdmin(event, requestingUserId, requestingUserIsAdmin, "view coupons for");
        return couponRepository.findByEventId(eventId)
                .stream().map(eventMapper::toCouponVM).toList();
    }

    @Transactional(readOnly = true)
    public String generateCouponCode(String eventId, String requestingUserId, boolean requestingUserIsAdmin) {
        var event = eventRepository.getById(eventId);
        assertOrganizerOrAdmin(event, requestingUserId, requestingUserIsAdmin, "generate coupons for");
        if (!event.isPrivate()) {
            throw new DomainException("Coupon codes can only be generated for private events");
        }
        for (int attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt++) {
            String code = randomCode();
            if (!couponRepository.existsByCodeAndEventId(code, eventId)) {
                return code;
            }
        }
        throw new DomainException("Could not generate a unique coupon code — please try again");
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(COUPON_LENGTH);
        for (int i = 0; i < COUPON_LENGTH; i++) {
            sb.append(COUPON_CHARS.charAt(SECURE_RANDOM.nextInt(COUPON_CHARS.length())));
        }
        return sb.toString();
    }

    @Transactional
    public RegistrationVM registerForEvent(RegisterForEventCmd cmd) {
        var event = eventRepository.getById(cmd.eventId());
        if (!event.isPublished()) {
            throw new DomainException("Event is not available for registration");
        }
        if (registrationRepository.existsByEventIdAndUserId(cmd.eventId(), cmd.userId())) {
            throw new DomainException("You are already registered for this event");
        }
        if (event.getMaxCapacity() != null) {
            long count = registrationRepository.countByEventId(cmd.eventId());
            if (count >= event.getMaxCapacity()) {
                throw new DomainException("Event has reached maximum capacity");
            }
        }
        String couponId = null;
        if (event.isPrivate()) {
            if (cmd.couponCode() == null || cmd.couponCode().isBlank()) {
                throw new DomainException("A coupon code is required to register for this private event");
            }
            var coupon = couponRepository.findByCodeAndEventId(cmd.couponCode(), cmd.eventId())
                    .orElseThrow(() -> new DomainException("Invalid coupon code"));
            coupon.validateAndUse();
            couponRepository.save(coupon);
            couponId = coupon.getId().id();
        }
        var registration = EventRegistrationEntity.create(cmd.eventId(), cmd.userId(), couponId);
        registrationRepository.save(registration);
        String registrantRole = usersAPI.getById(cmd.userId()).role();
        eventPublisher.publish(new UserRegisteredForEvent(event.getId().id(), event.getTitle(), event.getType().name(), event.getOrganizerId(), cmd.userId(), registrantRole));
        return eventMapper.toRegistrationVM(registration);
    }

    @Transactional(readOnly = true)
    public List<RegistrationVM> getRegistrationsForEvent(String eventId, String requestingUserId, boolean requestingUserIsAdmin) {
        var event = eventRepository.getById(eventId);
        assertOrganizerOrAdmin(event, requestingUserId, requestingUserIsAdmin, "view registrations for");
        return registrationRepository.findByEventId(eventId)
                .stream().map(eventMapper::toRegistrationVM).toList();
    }

    @Transactional(readOnly = true)
    public List<RegistrationVM> getMyRegistrations(String userId) {
        return registrationRepository.findByUserId(userId)
                .stream().map(eventMapper::toRegistrationVM).toList();
    }

    @Transactional(readOnly = true)
    public List<String> getRegisteredEventIds(String userId) {
        return registrationRepository.findEventIdsByUserIdAndStatus(userId, RegistrationStatus.REGISTERED);
    }

    @Transactional(readOnly = true)
    public List<String> getCoAttendeeUserIds(List<String> eventIds, String excludeUserId) {
        if (eventIds.isEmpty()) return Collections.emptyList();
        return registrationRepository.findCoAttendeeUserIds(eventIds, excludeUserId, RegistrationStatus.REGISTERED);
    }

    @Transactional(readOnly = true)
    public List<String> getAttendeeUserIds(String eventId, String excludeUserId) {
        return registrationRepository.findAttendeeUserIdsByEventId(eventId, excludeUserId, RegistrationStatus.REGISTERED);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getSharedEventCounts(List<String> eventIds, List<String> userIds) {
        if (eventIds.isEmpty() || userIds.isEmpty()) return Collections.emptyMap();
        List<Object[]> rows = registrationRepository.countSharedEventsByUserIds(eventIds, userIds, RegistrationStatus.REGISTERED);
        return rows.stream().collect(Collectors.toMap(
                row -> (String) row[0],
                row -> (Long) row[1]
        ));
    }

    @Transactional
    public void uploadCoverImage(String eventId, String requestingUserId, boolean requestingUserIsAdmin,
                                 byte[] bytes, String contentType) {
        var event = eventRepository.getById(eventId);
        assertOrganizerOrAdmin(event, requestingUserId, requestingUserIsAdmin, "upload a cover for");
        String key = COVER_KEY_PREFIX + eventId;
        s3StorageService.upload(key, bytes, contentType);
        event.setCoverKey(key);
        eventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public Optional<String> getCoverImageUrl(String eventId) {
        return eventRepository.findById(EventId.of(eventId))
                .filter(e -> e.getCoverKey() != null)
                .map(e -> s3StorageService.presignedGetUrl(e.getCoverKey()));
    }

    private String toCommaString(List<String> list) {
        return (list == null || list.isEmpty()) ? null : String.join(",", list);
    }

    private void assertOrganizerOrAdmin(EventEntity event, String userId, boolean isAdmin, String action) {
        if (!isAdmin && !event.getOrganizerId().equals(userId)) {
            throw new DomainException("Only the event organizer or an admin can " + action + " this event");
        }
    }
}
