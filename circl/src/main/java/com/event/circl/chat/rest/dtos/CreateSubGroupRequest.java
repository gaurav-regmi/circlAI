package com.event.circl.chat.rest.dtos;

import jakarta.validation.constraints.NotBlank;

public record CreateSubGroupRequest(
        @NotBlank(message = "Sub-group name is required")
        String name
) {}
