package com.event.circl.users.domain.models;

public record UserVM(
        String id,
        String firstName,
        String lastName,
        String email,
        String role
) {}
