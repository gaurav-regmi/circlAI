package com.event.circl.users.domain;

import com.event.circl.shared.domain.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "user_profiles")
class UserProfileEntity extends BaseEntity {

    @Id
    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "preferred_location")
    private String preferredLocation;

    @Column(name = "preferred_event_type", length = 10)
    private String preferredEventType;

    @Column(name = "keywords", columnDefinition = "TEXT")
    private String keywords;  // comma-separated

    @Column(name = "languages", columnDefinition = "TEXT")
    private String languages;  // comma-separated

    @Column(name = "interests", columnDefinition = "TEXT")
    private String interests;  // comma-separated, max 3

    @Column(name = "picture_key")
    private String pictureKey;   // S3 object key, e.g. "profile-pictures/{userId}"

    protected UserProfileEntity() {}

    UserProfileEntity(String userId) {
        this.userId = userId;
    }

    void update(String bio, String preferredLocation, String preferredEventType,
                String keywords, String languages, String interests) {
        this.bio = bio;
        this.preferredLocation = preferredLocation;
        this.preferredEventType = preferredEventType;
        this.keywords = keywords;
        this.languages = languages;
        this.interests = interests;
    }

    void updatePictureKey(String pictureKey) {
        this.pictureKey = pictureKey;
    }

    String getUserId() { return userId; }
    String getBio() { return bio; }
    String getPreferredLocation() { return preferredLocation; }
    String getPreferredEventType() { return preferredEventType; }
    String getKeywords() { return keywords; }
    String getLanguages() { return languages; }
    String getInterests() { return interests; }
    String getPictureKey() { return pictureKey; }
}
