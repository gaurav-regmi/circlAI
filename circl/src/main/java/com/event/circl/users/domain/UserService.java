package com.event.circl.users.domain;

import com.event.circl.shared.exceptions.DomainException;
import com.event.circl.shared.services.S3StorageService;
import com.event.circl.shared.services.SpringEventPublisher;
import com.event.circl.users.domain.models.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private static final String PICTURE_KEY_PREFIX = "profile-pictures/";

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileMapper userProfileMapper;
    private final SpringEventPublisher eventPublisher;
    private final PasswordEncoder passwordEncoder;
    private final S3StorageService s3StorageService;

    UserService(UserRepository userRepository,
                UserMapper userMapper,
                UserProfileRepository userProfileRepository,
                UserProfileMapper userProfileMapper,
                SpringEventPublisher eventPublisher,
                PasswordEncoder passwordEncoder,
                S3StorageService s3StorageService) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.userProfileRepository = userProfileRepository;
        this.userProfileMapper = userProfileMapper;
        this.eventPublisher = eventPublisher;
        this.passwordEncoder = passwordEncoder;
        this.s3StorageService = s3StorageService;
    }

    @Transactional
    public UserId registerUser(RegisterUserCmd cmd) {
        if (userRepository.existsByEmail(cmd.email())) {
            throw new DomainException("User with email " + cmd.email() + " already exists");
        }
        var user = UserEntity.create(
                cmd.firstName(),
                cmd.lastName(),
                cmd.email(),
                passwordEncoder.encode(cmd.password()),
                cmd.role()
        );
        userRepository.save(user);
        eventPublisher.publish(new UserCreated(user.getEmail(), user.getFirstName(), user.getLastName()));

        boolean hasProfileData = (cmd.bio() != null && !cmd.bio().isBlank())
                || (cmd.location() != null && !cmd.location().isBlank())
                || (cmd.interests() != null && !cmd.interests().isEmpty());
        if (hasProfileData) {
            var profile = new UserProfileEntity(user.getId().id());
            String interestsStr = (cmd.interests() != null && !cmd.interests().isEmpty())
                    ? String.join(",", cmd.interests()) : null;
            profile.update(cmd.bio(), cmd.location(), null, null, null, interestsStr);
            userProfileRepository.save(profile);
        }

        return user.getId();
    }

    @Transactional(readOnly = true)
    public UserVM getByEmail(String email) {
        return userMapper.toUserVM(userRepository.getByEmail(email));
    }

    @Transactional(readOnly = true)
    public UserVM getById(String id) {
        return userMapper.toUserVM(userRepository.getById(id));
    }

    @Transactional(readOnly = true)
    public List<String> getAllUserIdsExcept(String excludeUserId) {
        return userRepository.findAllUserIdsExcept(excludeUserId);
    }

    @Transactional(readOnly = true)
    public UserProfileVM getProfile(String userId) {
        return userProfileMapper.toProfileVM(
                userProfileRepository.findById(userId)
                        .orElseGet(() -> new UserProfileEntity(userId))
        );
    }

    @Transactional
    public UserProfileVM updateProfile(UpdateProfileCmd cmd) {
        var profile = userProfileRepository.findById(cmd.userId())
                .orElse(new UserProfileEntity(cmd.userId()));
        String keywordsStr  = toCommaString(cmd.keywords());
        String languagesStr = toCommaString(cmd.languages());
        String interestsStr = toCommaString(cmd.interests());
        profile.update(cmd.bio(), cmd.preferredLocation(), cmd.preferredEventType(),
                keywordsStr, languagesStr, interestsStr);
        userProfileRepository.save(profile);
        return userProfileMapper.toProfileVM(profile);
    }

    private String toCommaString(List<String> list) {
        return (list == null || list.isEmpty()) ? null : String.join(",", list);
    }

    @Transactional
    public void updateProfilePicture(String userId, byte[] bytes, String contentType) {
        String key = PICTURE_KEY_PREFIX + userId;
        s3StorageService.upload(key, bytes, contentType);
        var profile = userProfileRepository.findById(userId)
                .orElse(new UserProfileEntity(userId));
        profile.updatePictureKey(key);
        userProfileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public Optional<String> getProfilePictureUrl(String userId) {
        return userProfileRepository.findById(userId)
                .filter(p -> p.getPictureKey() != null)
                .map(p -> s3StorageService.presignedGetUrl(p.getPictureKey()));
    }

    @Transactional(readOnly = true)
    public UserPublicProfileVM getPublicProfile(String userId) {
        var user = userRepository.getById(userId);
        var profile = userProfileRepository.findById(userId).orElseGet(() -> new UserProfileEntity(userId));
        List<String> interests = profile.getInterests() != null && !profile.getInterests().isBlank()
                ? List.of(profile.getInterests().split(","))
                : List.of();
        return new UserPublicProfileVM(
                user.getId().id(),
                user.getFirstName(),
                user.getLastName(),
                profile.getBio(),
                profile.getPreferredLocation(),
                interests,
                profile.getPictureKey() != null
        );
    }

    @Transactional(readOnly = true)
    public List<UserVM> getUsersByIds(List<String> userIds) {
        if (userIds.isEmpty()) return List.of();
        return userRepository.findAllByIdIn(userIds).stream()
                .map(userMapper::toUserVM).toList();
    }

    @Transactional(readOnly = true)
    public List<UserProfileVM> getProfilesByUserIds(List<String> userIds) {
        if (userIds.isEmpty()) return List.of();
        return userProfileRepository.findAllByUserIdIn(userIds).stream()
                .map(userProfileMapper::toProfileVM).toList();
    }
}
