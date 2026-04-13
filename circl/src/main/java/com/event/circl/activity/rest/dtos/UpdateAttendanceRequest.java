package com.event.circl.activity.rest.dtos;

import com.event.circl.activity.domain.models.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAttendanceRequest(
        @NotNull(message = "Attendance status is required")
        AttendanceStatus status
) {}
