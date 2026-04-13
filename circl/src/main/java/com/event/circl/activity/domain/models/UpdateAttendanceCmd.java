package com.event.circl.activity.domain.models;

public record UpdateAttendanceCmd(
        String activityId,
        String requestingUserId,
        boolean requestingUserIsAdmin,
        AttendanceStatus newStatus
) {}
