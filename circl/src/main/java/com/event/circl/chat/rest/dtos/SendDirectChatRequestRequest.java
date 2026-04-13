package com.event.circl.chat.rest.dtos;

import jakarta.validation.constraints.NotBlank;

public record SendDirectChatRequestRequest(@NotBlank String targetUserId) {}
