package com.event.circl.chat;

import com.event.circl.chat.domain.ChatService;
import com.event.circl.chat.domain.models.ChatRoomVM;
import com.event.circl.chat.domain.models.MessageVM;
import com.event.circl.chat.domain.models.SendMessageCmd;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatAPI {
    private final ChatService chatService;

    public ChatAPI(ChatService chatService) {
        this.chatService = chatService;
    }

    public List<ChatRoomVM> getMyChatRooms(String userId) {
        return chatService.getMyChatRooms(userId);
    }

    public MessageVM sendMessage(SendMessageCmd cmd) {
        return chatService.sendMessage(cmd);
    }
}
