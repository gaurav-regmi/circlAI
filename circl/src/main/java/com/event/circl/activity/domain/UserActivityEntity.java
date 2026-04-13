package com.event.circl.activity.domain;

import com.event.circl.activity.domain.models.ActivityId;
import com.event.circl.activity.domain.models.AttendanceStatus;
import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.AssertUtil;
import jakarta.persistence.*;

@Entity
@Table(name = "user_activities", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_activities_event_user", columnNames = {"event_id", "user_id"})
})
class UserActivityEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private ActivityId id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Column(name = "event_title", nullable = false)
    private String eventTitle;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "organizer_id", nullable = false)
    private String organizerId;

    @Column(name = "user_role", nullable = false)
    private String userRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false)
    private AttendanceStatus attendanceStatus;

    protected UserActivityEntity() {}

    UserActivityEntity(ActivityId id, String userId, String eventId,
                       String eventTitle, String eventType, String organizerId, String userRole) {
        this.id = AssertUtil.requireNotNull(id, "Activity id cannot be null");
        this.userId = AssertUtil.requireNotBlank(userId, "User id cannot be blank");
        this.eventId = AssertUtil.requireNotBlank(eventId, "Event id cannot be blank");
        this.eventTitle = AssertUtil.requireNotBlank(eventTitle, "Event title cannot be blank");
        this.eventType = AssertUtil.requireNotBlank(eventType, "Event type cannot be blank");
        this.organizerId = AssertUtil.requireNotBlank(organizerId, "Organizer id cannot be blank");
        this.userRole = AssertUtil.requireNotBlank(userRole, "User role cannot be blank");
        this.attendanceStatus = AttendanceStatus.REGISTERED;
    }

    static UserActivityEntity create(String userId, String eventId,
                                     String eventTitle, String eventType, String organizerId, String userRole) {
        return new UserActivityEntity(ActivityId.generate(), userId, eventId, eventTitle, eventType, organizerId, userRole);
    }

    void checkIn() {
        this.attendanceStatus = AttendanceStatus.ATTENDED;
    }

    void markAttendance(AttendanceStatus status) {
        this.attendanceStatus = status;
    }

    ActivityId getId() { return id; }
    String getUserId() { return userId; }
    String getEventId() { return eventId; }
    String getEventTitle() { return eventTitle; }
    String getEventType() { return eventType; }
    String getOrganizerId() { return organizerId; }
    String getUserRole() { return userRole; }
    AttendanceStatus getAttendanceStatus() { return attendanceStatus; }
}
