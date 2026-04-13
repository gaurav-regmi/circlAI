package com.event.circl.users.domain;

import com.event.circl.users.domain.models.UserProfileVM;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
class UserProfileMapper {

    UserProfileVM toProfileVM(UserProfileEntity profile) {
        return new UserProfileVM(
                profile.getUserId(),
                profile.getBio(),
                profile.getPreferredLocation(),
                profile.getPreferredEventType(),
                parseList(profile.getKeywords()),
                parseList(profile.getLanguages()),
                parseList(profile.getInterests()),
                profile.getPictureKey() != null
        );
    }

    private List<String> parseList(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }
}
