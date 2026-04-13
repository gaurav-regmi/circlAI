package com.event.circl.chat.rest.controllers;

import com.event.circl.chat.domain.ChatService;
import com.event.circl.chat.domain.models.*;
import com.event.circl.chat.rest.dtos.AddMemberRequest;
import com.event.circl.chat.rest.dtos.CreateSubGroupRequest;
import com.event.circl.chat.rest.dtos.InviteUserRequest;
import com.event.circl.chat.rest.dtos.SendMessageRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // ── Rooms ───────────────────────────────────────────────────────────────

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomVM>> getMyChatRooms(@AuthenticationPrincipal Jwt jwt) {
        if (isOrganizerOrAdmin(jwt)) {
            return ResponseEntity.ok(chatService.getAllChatRooms());
        }
        return ResponseEntity.ok(chatService.getMyChatRooms(userId(jwt)));
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ChatRoomVM> getChatRoom(
            @PathVariable String roomId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(chatService.getChatRoom(roomId, userId(jwt)));
    }

    @GetMapping("/rooms/{roomId}/members")
    public ResponseEntity<List<ChatMemberVM>> getChatRoomMembers(
            @PathVariable String roomId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(chatService.getChatRoomMembers(roomId, userId(jwt), isOrganizerOrAdmin(jwt)));
    }

    @PostMapping("/rooms/{roomId}/members")
    public ResponseEntity<ChatMemberVM> addMember(
            @PathVariable String roomId,
            @Valid @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new AddMemberCmd(roomId, userId(jwt), request.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.addMember(cmd));
    }

    @DeleteMapping("/rooms/{roomId}/members/me")
    public ResponseEntity<Void> leaveChatRoom(
            @PathVariable String roomId,
            @AuthenticationPrincipal Jwt jwt) {
        chatService.leaveChatRoom(roomId, userId(jwt));
        return ResponseEntity.noContent().build();
    }

    // ── Sub-groups ──────────────────────────────────────────────────────────

    @PostMapping("/rooms/{roomId}/sub-groups")
    public ResponseEntity<ChatRoomVM> createSubGroup(
            @PathVariable String roomId,
            @Valid @RequestBody CreateSubGroupRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new CreateSubGroupCmd(roomId, request.name(), userId(jwt));
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.createSubGroup(cmd));
    }

    // ── Invitations ─────────────────────────────────────────────────────────

    @PostMapping("/rooms/{roomId}/invitations")
    public ResponseEntity<ChatInvitationVM> inviteUser(
            @PathVariable String roomId,
            @Valid @RequestBody InviteUserRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new InviteUserCmd(roomId, request.userId(), userId(jwt));
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.inviteUser(cmd));
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<ChatInvitationVM>> getPendingInvitations(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(chatService.getMyPendingInvitations(userId(jwt)));
    }

    @PostMapping("/invitations/{invitationId}/accept")
    public ResponseEntity<ChatInvitationVM> acceptInvitation(
            @PathVariable String invitationId,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new RespondToInvitationCmd(invitationId, userId(jwt), true);
        return ResponseEntity.ok(chatService.respondToInvitation(cmd));
    }

    @PostMapping("/invitations/{invitationId}/decline")
    public ResponseEntity<ChatInvitationVM> declineInvitation(
            @PathVariable String invitationId,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new RespondToInvitationCmd(invitationId, userId(jwt), false);
        return ResponseEntity.ok(chatService.respondToInvitation(cmd));
    }

    // ── Messages ────────────────────────────────────────────────────────────

    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<MessageVM> sendMessage(
            @PathVariable String roomId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        var cmd = new SendMessageCmd(roomId, userId(jwt), request.content(), isOrganizerOrAdmin(jwt));
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.sendMessage(cmd));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<Page<MessageVM>> getMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(
                chatService.getMessages(roomId, userId(jwt), isOrganizerOrAdmin(jwt), PageRequest.of(page, size)));
    }

    @PostMapping("/rooms/{roomId}/files")
    public ResponseEntity<MessageVM> uploadFile(
            @PathVariable String roomId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) throws IOException {
        var cmd = new UploadFileCmd(roomId, userId(jwt),
                file.getOriginalFilename(), file.getBytes(), file.getContentType(), isOrganizerOrAdmin(jwt));
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.uploadFile(cmd));
    }

    @GetMapping("/rooms/{roomId}/messages/{messageId}/file-url")
    public ResponseEntity<Map<String, String>> getFileUrl(
            @PathVariable String roomId,
            @PathVariable String messageId,
            @AuthenticationPrincipal Jwt jwt) {
        String url = chatService.getFileUrl(roomId, messageId, userId(jwt));
        return ResponseEntity.ok(Map.of("url", url));
    }

    private String userId(Jwt jwt) {
        return jwt.getClaimAsString("userId");
    }

    private boolean isOrganizerOrAdmin(Jwt jwt) {
        String role = jwt.getClaimAsString("role");
        return "ADMIN".equals(role) || "EVENT_ORGANIZER".equals(role) || "EVENT_ORGANIZER_MEMBER".equals(role);
    }
}
