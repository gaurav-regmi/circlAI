package com.event.circl.discovery.domain.models;

import java.util.List;

public record PersonSuggestionVM(
        String userId,
        String firstName,
        String lastName,
        String bio,
        String location,
        List<String> interests,
        int sharedEventsCount,
        int sharedInterestsCount,
        boolean hasPicture
) {}
