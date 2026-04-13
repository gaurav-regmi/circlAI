package com.event.circl.ai.rest.controllers;

import com.event.circl.ai.domain.EventChatService;
import com.event.circl.ai.domain.EventDescriptionService;
import com.event.circl.ai.rest.dtos.AiChatRequest;
import com.event.circl.ai.rest.dtos.AiChatResponse;
import com.event.circl.ai.rest.dtos.DescriptionRequest;
import com.event.circl.ai.rest.dtos.DescriptionResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final EventChatService eventChatService;
    private final EventDescriptionService eventDescriptionService;

    AiChatController(EventChatService eventChatService, EventDescriptionService eventDescriptionService) {
        this.eventChatService = eventChatService;
        this.eventDescriptionService = eventDescriptionService;
    }

    @PostMapping("/chat")
    public AiChatResponse chat(
            @RequestBody AiChatRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        List<AiChatRequest.ConversationTurn> history = request.history() != null ? request.history() : List.of();
        var reply = eventChatService.chat(request.eventId(), request.message(), history);
        return new AiChatResponse(reply);
    }

    @PostMapping("/description")
    public DescriptionResponse generateDescription(
            @RequestBody DescriptionRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return new DescriptionResponse(eventDescriptionService.generate(request));
    }
}
