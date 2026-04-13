package com.event.circl.chat.rest.dtos;

import jakarta.validation.constraints.NotBlank;

public record AddMemberRequest(@NotBlank String userId) {}
