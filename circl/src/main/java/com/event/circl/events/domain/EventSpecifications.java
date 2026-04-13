package com.event.circl.events.domain;

import com.event.circl.events.domain.models.EventStatus;
import com.event.circl.events.domain.models.EventType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;

class EventSpecifications {

    private EventSpecifications() {}

    /**
     * Builds a compound specification for published event discovery.
     *
     * {@code search} supports comma-separated terms (from profile keywords) — each term is OR-matched
     * against title and description. A plain phrase (no commas) is matched as a single LIKE pattern.
     */
    static Specification<EventEntity> published(
            String search, EventType type, Instant startFrom, Instant startTo, String location) {
        return (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            predicates.add(cb.equal(root.get("status"), EventStatus.PUBLISHED));

            if (search != null && !search.isBlank()) {
                String[] terms = search.contains(",")
                        ? search.split(",")
                        : new String[]{ search };
                Predicate[] termPredicates = Arrays.stream(terms)
                        .map(String::trim)
                        .filter(t -> !t.isBlank())
                        .map(t -> {
                            String pattern = "%" + t.toLowerCase() + "%";
                            return cb.or(
                                    cb.like(cb.lower(root.get("title")), pattern),
                                    cb.like(cb.lower(root.get("description")), pattern)
                            );
                        })
                        .toArray(Predicate[]::new);
                if (termPredicates.length > 0) {
                    predicates.add(cb.or(termPredicates));
                }
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (location != null && !location.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + location.trim().toLowerCase() + "%"));
            }
            if (startFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startDateTime"), startFrom));
            }
            if (startTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startDateTime"), startTo));
            }

            if (query != null) query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
