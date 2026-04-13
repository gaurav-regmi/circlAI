package com.event.circl.discovery.domain;

import com.event.circl.discovery.domain.models.PersonSuggestionVM;
import com.event.circl.events.EventsAPI;
import com.event.circl.users.UsersAPI;
import com.event.circl.users.domain.models.UserProfileVM;
import com.event.circl.users.domain.models.UserVM;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PeopleDiscoveryService {

    private final EventsAPI eventsAPI;
    private final UsersAPI usersAPI;

    public PeopleDiscoveryService(EventsAPI eventsAPI, UsersAPI usersAPI) {
        this.eventsAPI = eventsAPI;
        this.usersAPI = usersAPI;
    }

    private record ScoredSuggestion(PersonSuggestionVM vm, int score) {}

    @Transactional(readOnly = true)
    public List<PersonSuggestionVM> findSuggestedPeople(String currentUserId, int page, int size) {
        List<String> myEventIds = eventsAPI.getRegisteredEventIds(currentUserId);

        UserProfileVM myProfile = safeGetProfile(currentUserId);
        List<String> myInterests = myProfile != null ? myProfile.interests() : Collections.emptyList();
        String myLocation = myProfile != null ? myProfile.preferredLocation() : null;
        String myEventType = myProfile != null ? myProfile.preferredEventType() : null;

        Set<String> candidateIds = new LinkedHashSet<>();
        if (!myEventIds.isEmpty()) {
            candidateIds.addAll(eventsAPI.getCoAttendeeUserIds(myEventIds, currentUserId));
        }
        if (candidateIds.size() < 50) {
            usersAPI.getAllUserIdsExcept(currentUserId).stream().limit(100).forEach(candidateIds::add);
        }
        candidateIds.remove(currentUserId);

        if (candidateIds.isEmpty()) return Collections.emptyList();

        List<String> candidateList = new ArrayList<>(candidateIds);
        List<UserVM> users = usersAPI.getUsersByIds(candidateList);
        List<UserProfileVM> profiles = usersAPI.getProfilesByUserIds(candidateList);

        Map<String, UserVM> userMap = users.stream().collect(Collectors.toMap(UserVM::id, u -> u));
        Map<String, UserProfileVM> profileMap = profiles.stream().collect(Collectors.toMap(UserProfileVM::userId, p -> p));

        Map<String, Long> sharedEventCounts = myEventIds.isEmpty()
                ? Collections.emptyMap()
                : eventsAPI.getSharedEventCounts(myEventIds, candidateList);

        Set<String> myInterestSet = new HashSet<>(myInterests);

        return candidateList.stream()
                .filter(userMap::containsKey)
                .map(id -> {
                    UserVM user = userMap.get(id);
                    UserProfileVM profile = profileMap.getOrDefault(id,
                            new UserProfileVM(id, null, null, null, List.of(), List.of(), List.of(), false));

                    int sharedEvents = sharedEventCounts.getOrDefault(id, 0L).intValue();
                    List<String> theirInterests = profile.interests();
                    int sharedInterests = (int) theirInterests.stream().filter(myInterestSet::contains).count();

                    int score = sharedEvents * 3 + sharedInterests * 2;
                    if (myLocation != null && !myLocation.isBlank() && profile.preferredLocation() != null) {
                        String theirLoc = profile.preferredLocation().toLowerCase();
                        String myLoc = myLocation.toLowerCase();
                        if (theirLoc.contains(myLoc) || myLoc.contains(theirLoc)) score += 2;
                    }
                    if (myEventType != null && !"ANY".equals(myEventType)
                            && myEventType.equals(profile.preferredEventType())) {
                        score += 1;
                    }

                    return new ScoredSuggestion(new PersonSuggestionVM(
                            id, user.firstName(), user.lastName(),
                            profile.bio(), profile.preferredLocation(),
                            theirInterests, sharedEvents, sharedInterests, profile.hasPicture()
                    ), score);
                })
                .filter(s -> s.score() > 0)
                .sorted(Comparator.comparingInt(ScoredSuggestion::score).reversed())
                .map(ScoredSuggestion::vm)
                .skip((long) page * size)
                .limit(size)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PersonSuggestionVM> findEventAttendees(String eventId, String currentUserId) {
        List<String> attendeeIds = eventsAPI.getAttendeeUserIds(eventId, currentUserId);
        if (attendeeIds.isEmpty()) return Collections.emptyList();

        List<UserVM> users = usersAPI.getUsersByIds(attendeeIds);
        List<UserProfileVM> profiles = usersAPI.getProfilesByUserIds(attendeeIds);
        Map<String, UserProfileVM> profileMap = profiles.stream()
                .collect(Collectors.toMap(UserProfileVM::userId, p -> p));

        return users.stream().map(user -> {
            UserProfileVM profile = profileMap.getOrDefault(user.id(),
                    new UserProfileVM(user.id(), null, null, null, List.of(), List.of(), List.of(), false));
            return new PersonSuggestionVM(
                    user.id(), user.firstName(), user.lastName(),
                    profile.bio(), profile.preferredLocation(),
                    profile.interests(), 0, 0, profile.hasPicture()
            );
        }).toList();
    }

    private UserProfileVM safeGetProfile(String userId) {
        try {
            return usersAPI.getProfile(userId);
        } catch (Exception e) {
            return null;
        }
    }
}
