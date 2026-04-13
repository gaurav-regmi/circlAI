package com.event.circl.users.domain.models;

import java.util.List;

public record UserProfileVM(
        String userId,
        String bio,
        String preferredLocation,
        String preferredEventType,   // "PUBLIC", "PRIVATE", "ANY", or null (not set)
        List<String> keywords,
        List<String> languages,
        List<String> interests,
        boolean hasPicture
) {}
