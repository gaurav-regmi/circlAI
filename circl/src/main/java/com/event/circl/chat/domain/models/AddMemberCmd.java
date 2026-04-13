package com.event.circl.chat.domain.models;

public record AddMemberCmd(String chatRoomId, String addedByUserId, String userIdToAdd) {}
