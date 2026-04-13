package com.event.circl.events.domain;

import com.event.circl.events.domain.models.EventId;
import com.event.circl.shared.exceptions.ResourceNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

interface EventRepository extends JpaRepository<EventEntity, EventId>, JpaSpecificationExecutor<EventEntity> {

    List<EventEntity> findByOrganizerIdOrderByCreatedAtDesc(String organizerId);

    default EventEntity getById(String id) {
        return findById(EventId.of(id))
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + id));
    }
}
