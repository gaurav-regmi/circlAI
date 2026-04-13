package com.event.circl.users.domain.models;

import java.util.List;

public record UpdateProfileCmd(
        String userId,
        String bio,
        String preferredLocation,
        String preferredEventType,
        List<String> keywords,
        List<String> languages,
        List<String> interests
) {}
