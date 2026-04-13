package com.event.circl.ai.domain;

import com.event.circl.ai.rest.dtos.AiChatRequest.ConversationTurn;
import com.event.circl.events.EventsAPI;
import com.event.circl.events.domain.models.EventVM;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class EventChatService {

    private static final DateTimeFormatter FMT = DateTimeFormatter
            .ofPattern("MMM d, yyyy 'at' h:mm a")
            .withZone(ZoneId.systemDefault());

    private final ChatClient chatClient;
    private final EventsAPI eventsAPI;

    EventChatService(ChatClient.Builder builder, EventsAPI eventsAPI) {
        this.chatClient = builder.build();
        this.eventsAPI = eventsAPI;
    }

    public String chat(String eventId, String userMessage, List<ConversationTurn> history) {
        var event = eventsAPI.getEventById(eventId);

        List<Message> historyMessages = new ArrayList<>();
        for (ConversationTurn turn : history) {
            if ("user".equals(turn.role())) {
                historyMessages.add(new UserMessage(turn.content()));
            } else {
                historyMessages.add(new AssistantMessage(turn.content()));
            }
        }

        return chatClient.prompt()
                .system(buildSystemPrompt(event))
                .messages(historyMessages)
                .user(userMessage)
                .call()
                .content();
    }

    private String buildSystemPrompt(EventVM event) {
        var sb = new StringBuilder();
        sb.append("You are a helpful event assistant for \"").append(event.title()).append("\".");
        sb.append(" Answer questions about this event concisely and helpfully.\n\n");
        sb.append("Event details:\n");
        sb.append("- Title: ").append(event.title()).append("\n");
        sb.append("- Status: ").append(event.status()).append("\n");
        sb.append("- Type: ").append(event.type()).append("\n");
        sb.append("- Location: ").append(event.location()).append("\n");
        sb.append("- Starts: ").append(FMT.format(event.startDateTime())).append("\n");
        sb.append("- Ends: ").append(FMT.format(event.endDateTime())).append("\n");
        if (event.maxCapacity() != null) {
            sb.append("- Capacity: ").append(event.maxCapacity()).append(" spots\n");
        }
        if (event.description() != null && !event.description().isBlank()) {
            sb.append("- Description: ").append(event.description()).append("\n");
        }
        sb.append("\nOnly answer questions relevant to this event. ")
          .append("If asked about unrelated topics, politely redirect to event-related questions. ")
          .append("Keep responses short and to the point.");
        return sb.toString();
    }
}
