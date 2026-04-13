package com.event.circl.events;

import com.event.circl.events.domain.EventService;
import com.event.circl.events.domain.models.CreateEventCmd;
import com.event.circl.events.domain.models.EventId;
import com.event.circl.events.domain.models.EventVM;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class EventsAPI {
    private final EventService eventService;

    public EventsAPI(EventService eventService) {
        this.eventService = eventService;
    }

    public EventId createEvent(CreateEventCmd cmd) {
        return eventService.createEvent(cmd);
    }

    public EventVM getEventById(String eventId) {
        return eventService.getEventById(eventId);
    }

    public Map<String, String> getEventStatuses(List<String> eventIds) {
        return eventService.getEventStatuses(eventIds);
    }

    public List<String> getRegisteredEventIds(String userId) {
        return eventService.getRegisteredEventIds(userId);
    }

    public List<String> getCoAttendeeUserIds(List<String> eventIds, String excludeUserId) {
        return eventService.getCoAttendeeUserIds(eventIds, excludeUserId);
    }

    public List<String> getAttendeeUserIds(String eventId, String excludeUserId) {
        return eventService.getAttendeeUserIds(eventId, excludeUserId);
    }

    public Map<String, Long> getSharedEventCounts(List<String> eventIds, List<String> userIds) {
        return eventService.getSharedEventCounts(eventIds, userIds);
    }
}
