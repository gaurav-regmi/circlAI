package com.event.circl.activity.domain.models;

public enum AttendanceStatus {
    /** User registered but the event has not happened yet (or status not yet updated). */
    REGISTERED,
    /** User attended the event. */
    ATTENDED,
    /** User registered but did not show up. */
    NO_SHOW
}
