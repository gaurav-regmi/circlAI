package com.event.circl.users;

import com.event.circl.users.domain.UserService;
import com.event.circl.users.domain.models.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsersAPI {
    private final UserService userService;

    public UsersAPI(UserService userService) {
        this.userService = userService;
    }

    public UserId registerUser(RegisterUserCmd cmd) {
        return userService.registerUser(cmd);
    }

    public UserVM getByEmail(String email) {
        return userService.getByEmail(email);
    }

    public UserVM getById(String id) {
        return userService.getById(id);
    }

    public UserProfileVM getProfile(String userId) {
        return userService.getProfile(userId);
    }

    public UserProfileVM updateProfile(UpdateProfileCmd cmd) {
        return userService.updateProfile(cmd);
    }

    public List<String> getAllUserIdsExcept(String excludeUserId) {
        return userService.getAllUserIdsExcept(excludeUserId);
    }

    public List<UserVM> getUsersByIds(List<String> userIds) {
        return userService.getUsersByIds(userIds);
    }

    public List<UserProfileVM> getProfilesByUserIds(List<String> userIds) {
        return userService.getProfilesByUserIds(userIds);
    }
}
