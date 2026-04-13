package com.event.circl.users.rest.dtos;

public record UserLookupResponse(
        String id,
        String firstName,
        String lastName,
        String email
) {}
