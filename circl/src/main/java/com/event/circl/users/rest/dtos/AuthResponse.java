package com.event.circl.users.rest.dtos;

public record AuthResponse(
        String token,
        String email,
        String firstName,
        String lastName,
        String role
) {}
