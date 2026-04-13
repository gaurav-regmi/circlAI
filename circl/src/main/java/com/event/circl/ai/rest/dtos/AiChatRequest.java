package com.event.circl.ai.rest.dtos;

import java.util.List;

public record AiChatRequest(
        String eventId,
        String message,
        List<ConversationTurn> history
) {
    public record ConversationTurn(String role, String content) {}
}
