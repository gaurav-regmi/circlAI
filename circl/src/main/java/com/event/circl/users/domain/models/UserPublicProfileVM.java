package com.event.circl.users.domain.models;

import java.util.List;

public record UserPublicProfileVM(
        String userId,
        String firstName,
        String lastName,
        String bio,
        String location,
        List<String> interests,
        boolean hasPicture
) {}
