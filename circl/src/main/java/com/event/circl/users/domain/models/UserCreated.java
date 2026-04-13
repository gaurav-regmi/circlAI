package com.event.circl.users.domain.models;

import com.event.circl.shared.models.DomainEvent;

public record UserCreated(String email, String firstName, String lastName) implements DomainEvent {}
