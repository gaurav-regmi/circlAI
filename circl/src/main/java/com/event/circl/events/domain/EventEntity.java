package com.event.circl.events.domain;

import com.event.circl.events.domain.models.EventId;
import com.event.circl.events.domain.models.EventStatus;
import com.event.circl.events.domain.models.EventType;
import com.event.circl.events.domain.models.ParkingType;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.AssertUtil;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "events")
class EventEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private EventId id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "location", nullable = false)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private EventType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EventStatus status;

    @Column(name = "start_date_time", nullable = false)
    private Instant startDateTime;

    @Column(name = "end_date_time", nullable = false)
    private Instant endDateTime;

    @Column(name = "organizer_id", nullable = false)
    private String organizerId;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "parking")
    private ParkingType parking;

    @Column(name = "interests", columnDefinition = "TEXT")
    private String interests;  // comma-separated

    @Column(name = "cover_key")
    private String coverKey;

    protected EventEntity() {}

    EventEntity(EventId id, String title, String description, String location,
                EventType type, EventStatus status, Instant startDateTime, Instant endDateTime,
                String organizerId, Integer maxCapacity, ParkingType parking, String interests) {
        this.id = AssertUtil.requireNotNull(id, "Event id cannot be null");
        this.title = AssertUtil.requireNotBlank(title, "Title cannot be blank");
        this.description = description;
        this.location = AssertUtil.requireNotBlank(location, "Location cannot be blank");
        this.type = AssertUtil.requireNotNull(type, "Event type cannot be null");
        this.status = AssertUtil.requireNotNull(status, "Event status cannot be null");
        this.startDateTime = AssertUtil.requireNotNull(startDateTime, "Start date time cannot be null");
        this.endDateTime = AssertUtil.requireNotNull(endDateTime, "End date time cannot be null");
        this.organizerId = AssertUtil.requireNotBlank(organizerId, "Organizer id cannot be blank");
        this.maxCapacity = maxCapacity;
        this.parking = parking;
        this.interests = interests;
    }

    static EventEntity create(String title, String description, String location, EventType type,
                              Instant startDateTime, Instant endDateTime,
                              String organizerId, Integer maxCapacity, ParkingType parking, String interests) {
        return new EventEntity(
                EventId.generate(), title, description, location,
                type, EventStatus.PUBLISHED, startDateTime, endDateTime,
                organizerId, maxCapacity, parking, interests
        );
    }

    void publish() {
        if (this.status == EventStatus.PUBLISHED) return;
        if (this.status != EventStatus.DRAFT) {
            throw new IllegalStateException("Cannot publish a " + status.name().toLowerCase() + " event");
        }
        this.status = EventStatus.PUBLISHED;
    }

    void cancel() {
        if (this.status == EventStatus.COMPLETED) {
            throw new IllegalStateException("Completed events cannot be cancelled");
        }
        this.status = EventStatus.CANCELLED;
    }

    void update(String title, String description, String location, EventType type,
                Instant startDateTime, Instant endDateTime, Integer maxCapacity,
                ParkingType parking, String interests) {
        if (this.status == EventStatus.CANCELLED || this.status == EventStatus.COMPLETED) {
            throw new IllegalStateException("Cannot edit a " + status.name().toLowerCase() + " event");
        }
        this.title = AssertUtil.requireNotBlank(title, "Title cannot be blank");
        this.description = description;
        this.location = AssertUtil.requireNotBlank(location, "Location cannot be blank");
        this.type = AssertUtil.requireNotNull(type, "Event type cannot be null");
        this.startDateTime = AssertUtil.requireNotNull(startDateTime, "Start date time cannot be null");
        this.endDateTime = AssertUtil.requireNotNull(endDateTime, "End date time cannot be null");
        this.maxCapacity = maxCapacity;
        this.parking = parking;
        this.interests = interests;
    }

    boolean isPublished() { return status == EventStatus.PUBLISHED; }
    boolean isPrivate() { return type == EventType.PRIVATE; }

    void setCoverKey(String coverKey) { this.coverKey = coverKey; }

    EventId getId() { return id; }
    String getTitle() { return title; }
    String getDescription() { return description; }
    String getLocation() { return location; }
    EventType getType() { return type; }
    EventStatus getStatus() { return status; }
    Instant getStartDateTime() { return startDateTime; }
    Instant getEndDateTime() { return endDateTime; }
    String getOrganizerId() { return organizerId; }
    Integer getMaxCapacity() { return maxCapacity; }
    ParkingType getParking() { return parking; }
    String getInterests() { return interests; }
    String getCoverKey() { return coverKey; }
}
