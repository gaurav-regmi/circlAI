package com.event.circl.chat.domain;

import com.event.circl.chat.domain.models.DirectChatRequestAccepted;
import com.event.circl.chat.domain.models.DirectChatRequestSent;
import com.event.circl.chat.domain.models.DirectChatRequestStatus;
import com.event.circl.chat.domain.models.DirectChatRequestVM;
import com.event.circl.chat.domain.models.MemberRole;
import com.event.circl.shared.exceptions.DomainException;
import com.event.circl.shared.services.SpringEventPublisher;
import com.event.circl.users.UsersAPI;
import com.event.circl.users.domain.models.UserProfileVM;
import com.event.circl.users.domain.models.UserVM;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DirectChatRequestService {

    private final DirectChatRequestRepository requestRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UsersAPI usersAPI;
    private final SpringEventPublisher eventPublisher;

    DirectChatRequestService(DirectChatRequestRepository requestRepository,
                              ChatRoomRepository chatRoomRepository,
                              ChatMemberRepository chatMemberRepository,
                              UsersAPI usersAPI,
                              SpringEventPublisher eventPublisher) {
        this.requestRepository = requestRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.chatMemberRepository = chatMemberRepository;
        this.usersAPI = usersAPI;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public DirectChatRequestVM sendRequest(String senderId, String receiverId) {
        if (senderId.equals(receiverId)) {
            throw new DomainException("You cannot send a chat request to yourself");
        }
        if (requestRepository.existsBySenderIdAndReceiverIdAndStatus(senderId, receiverId, DirectChatRequestStatus.PENDING)) {
            throw new DomainException("You already have a pending chat request to this user");
        }
        if (requestRepository.existsBetweenWithStatus(senderId, receiverId, DirectChatRequestStatus.ACCEPTED)) {
            throw new DomainException("You are already connected with this user");
        }

        var request = DirectChatRequestEntity.create(senderId, receiverId);
        requestRepository.save(request);

        var sender = usersAPI.getById(senderId);
        var receiver = usersAPI.getById(receiverId);
        String senderName = sender.firstName() + " " + sender.lastName();
        eventPublisher.publish(new DirectChatRequestSent(request.getId().id(), senderId, senderName, receiverId));

        var senderProfile = safeGetProfile(senderId);
        var receiverProfile = safeGetProfile(receiverId);
        return toVM(request, sender, senderProfile, receiver, receiverProfile);
    }

    @Transactional
    public DirectChatRequestVM acceptRequest(String requestId, String currentUserId) {
        var request = requestRepository.getById(requestId);
        if (!request.getReceiverId().equals(currentUserId)) {
            throw new DomainException("Not authorized to accept this request");
        }
        if (request.getStatus() != DirectChatRequestStatus.PENDING) {
            throw new DomainException("This request is no longer pending");
        }

        var sender = usersAPI.getById(request.getSenderId());
        var receiver = usersAPI.getById(request.getReceiverId());

        String roomName = sender.firstName() + " " + sender.lastName()
                + ", " + receiver.firstName() + " " + receiver.lastName();
        var room = ChatRoomEntity.createDirect(roomName, request.getSenderId());
        chatRoomRepository.save(room);

        chatMemberRepository.save(ChatMemberEntity.create(room.getId().id(), request.getSenderId(), MemberRole.ADMIN));
        chatMemberRepository.save(ChatMemberEntity.create(room.getId().id(), request.getReceiverId(), MemberRole.ADMIN));

        request.accept(room.getId().id());
        requestRepository.save(request);

        String receiverName = receiver.firstName() + " " + receiver.lastName();
        eventPublisher.publish(new DirectChatRequestAccepted(
                request.getId().id(), request.getSenderId(), request.getReceiverId(), receiverName, room.getId().id()));

        var senderProfile = safeGetProfile(request.getSenderId());
        var receiverProfile = safeGetProfile(request.getReceiverId());
        return toVM(request, sender, senderProfile, receiver, receiverProfile);
    }

    @Transactional
    public void cancelRequest(String requestId, String currentUserId) {
        var request = requestRepository.getById(requestId);
        if (!request.getSenderId().equals(currentUserId)) {
            throw new DomainException("Not authorized to cancel this request");
        }
        if (request.getStatus() != DirectChatRequestStatus.PENDING) {
            throw new DomainException("Only pending requests can be cancelled");
        }
        requestRepository.delete(request);
    }

    @Transactional
    public DirectChatRequestVM declineRequest(String requestId, String currentUserId) {
        var request = requestRepository.getById(requestId);
        if (!request.getReceiverId().equals(currentUserId)) {
            throw new DomainException("Not authorized to decline this request");
        }
        if (request.getStatus() != DirectChatRequestStatus.PENDING) {
            throw new DomainException("This request is no longer pending");
        }
        request.decline();
        requestRepository.save(request);

        var sender = usersAPI.getById(request.getSenderId());
        var receiver = usersAPI.getById(request.getReceiverId());
        var senderProfile = safeGetProfile(request.getSenderId());
        var receiverProfile = safeGetProfile(request.getReceiverId());
        return toVM(request, sender, senderProfile, receiver, receiverProfile);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<DirectChatRequestVM> getConnectionStatus(String userId, String targetUserId) {
        return requestRepository.findBetweenWithStatus(userId, targetUserId, DirectChatRequestStatus.ACCEPTED)
                .map(r -> {
                    var sender = safeGetUser(r.getSenderId());
                    var receiver = safeGetUser(r.getReceiverId());
                    var senderProfile = safeGetProfile(r.getSenderId());
                    var receiverProfile = safeGetProfile(r.getReceiverId());
                    return toVM(r, sender, senderProfile, receiver, receiverProfile);
                });
    }

    @Transactional(readOnly = true)
    public List<DirectChatRequestVM> getIncomingRequests(String userId) {
        var requests = requestRepository.findByReceiverIdAndStatus(userId, DirectChatRequestStatus.PENDING);
        if (requests.isEmpty()) return List.of();

        var senderIds = requests.stream().map(DirectChatRequestEntity::getSenderId).distinct().toList();
        Map<String, UserVM> userMap = usersAPI.getUsersByIds(senderIds).stream()
                .collect(Collectors.toMap(UserVM::id, u -> u));
        Map<String, UserProfileVM> profileMap = usersAPI.getProfilesByUserIds(senderIds).stream()
                .collect(Collectors.toMap(UserProfileVM::userId, p -> p));

        var receiver = usersAPI.getById(userId);
        var receiverProfile = safeGetProfile(userId);

        return requests.stream().map(r -> {
            var sender = userMap.get(r.getSenderId());
            var senderProfile = profileMap.get(r.getSenderId());
            return toVM(r,
                    sender != null ? sender : unknownUser(r.getSenderId()),
                    senderProfile,
                    receiver,
                    receiverProfile);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<DirectChatRequestVM> getOutgoingRequests(String userId) {
        var requests = requestRepository.findBySenderId(userId);
        if (requests.isEmpty()) return List.of();

        var receiverIds = requests.stream().map(DirectChatRequestEntity::getReceiverId).distinct().toList();
        Map<String, UserVM> userMap = usersAPI.getUsersByIds(receiverIds).stream()
                .collect(Collectors.toMap(UserVM::id, u -> u));
        Map<String, UserProfileVM> profileMap = usersAPI.getProfilesByUserIds(receiverIds).stream()
                .collect(Collectors.toMap(UserProfileVM::userId, p -> p));

        var sender = usersAPI.getById(userId);
        var senderProfile = safeGetProfile(userId);

        return requests.stream().map(r -> {
            var receiver = userMap.get(r.getReceiverId());
            var receiverProfile = profileMap.get(r.getReceiverId());
            return toVM(r,
                    sender,
                    senderProfile,
                    receiver != null ? receiver : unknownUser(r.getReceiverId()),
                    receiverProfile);
        }).toList();
    }

    private DirectChatRequestVM toVM(DirectChatRequestEntity r,
                                     UserVM sender, UserProfileVM senderProfile,
                                     UserVM receiver, UserProfileVM receiverProfile) {
        return new DirectChatRequestVM(
                r.getId().id(),
                r.getSenderId(),
                sender.firstName(),
                sender.lastName(),
                senderProfile != null && senderProfile.hasPicture(),
                r.getReceiverId(),
                receiver.firstName(),
                receiver.lastName(),
                receiverProfile != null && receiverProfile.hasPicture(),
                r.getStatus().name(),
                r.getChatRoomId()
        );
    }

    private UserProfileVM safeGetProfile(String userId) {
        try { return usersAPI.getProfile(userId); } catch (Exception e) { return null; }
    }

    private UserVM safeGetUser(String userId) {
        try { return usersAPI.getById(userId); } catch (Exception e) { return unknownUser(userId); }
    }

    private UserVM unknownUser(String id) {
        return new UserVM(id, "Unknown", "User", "", "USER");
    }
}
