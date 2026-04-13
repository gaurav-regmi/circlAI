package com.event.circl.ai.domain;

import com.event.circl.ai.rest.dtos.DescriptionRequest;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class EventDescriptionService {

    private static final DateTimeFormatter FMT = DateTimeFormatter
            .ofPattern("MMM d, yyyy 'at' h:mm a")
            .withZone(ZoneId.systemDefault());

    private final ChatClient chatClient;

    EventDescriptionService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String generate(DescriptionRequest req) {
        return chatClient.prompt()
                .user(buildPrompt(req))
                .call()
                .content();
    }

    private String buildPrompt(DescriptionRequest req) {
        var sb = new StringBuilder();
        sb.append("Write a professional, engaging description for the following event.\n");
        sb.append("Use 2–3 short paragraphs. Be compelling and informative — cover what the event is about, ");
        sb.append("what attendees can expect, and why they should join.\n");
        sb.append("Return only the description text with no headings, labels, or extra commentary.\n\n");
        sb.append("Event Title: ").append(req.title()).append("\n");
        sb.append("Location: ").append(req.location()).append("\n");
        sb.append("Type: ").append("PUBLIC".equalsIgnoreCase(req.type()) ? "Public" : "Private (invite only)").append("\n");
        sb.append("Starts: ").append(FMT.format(req.startDateTime())).append("\n");
        sb.append("Ends: ").append(FMT.format(req.endDateTime())).append("\n");
        if (req.maxCapacity() != null) {
            sb.append("Capacity: ").append(req.maxCapacity()).append(" attendees\n");
        }
        return sb.toString();
    }
}
