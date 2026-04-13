package com.event.circl.users.domain.models;

import java.util.List;

public record RegisterUserCmd(
        String firstName,
        String lastName,
        String email,
        String password,
        UserRole role,
        String bio,
        String location,
        List<String> interests
) {}
