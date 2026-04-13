package com.event.circl.users.rest.dtos;

import java.util.List;

public record UpdateProfileRequest(
        String bio,
        String preferredLocation,
        String preferredEventType,
        List<String> keywords,
        List<String> languages,
        List<String> interests
) {}
