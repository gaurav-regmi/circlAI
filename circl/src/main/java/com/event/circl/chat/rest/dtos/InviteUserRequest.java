package com.event.circl.chat.rest.dtos;

import jakarta.validation.constraints.NotBlank;

public record InviteUserRequest(
        @NotBlank(message = "User ID is required")
        String userId
) {}
