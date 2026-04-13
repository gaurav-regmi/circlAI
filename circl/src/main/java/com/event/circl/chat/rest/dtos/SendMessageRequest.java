package com.event.circl.chat.rest.dtos;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(
        @NotBlank(message = "Message content is required")
        String content
) {}
