package com.event.circl.activity.domain;

import com.event.circl.activity.domain.models.ActivityVM;
import org.springframework.stereotype.Component;

@Component
class ActivityMapper {

    ActivityVM toActivityVM(UserActivityEntity activity, String eventStatus, long totalRegistrations) {
        return new ActivityVM(
                activity.getId().id(),
                activity.getUserId(),
                activity.getEventId(),
                activity.getEventTitle(),
                activity.getEventType(),
                activity.getAttendanceStatus().name(),
                activity.getCreatedAt(),
                eventStatus,
                totalRegistrations
        );
    }
}
