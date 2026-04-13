package com.event.circl.users.domain;

import com.event.circl.users.domain.models.UserVM;
import org.springframework.stereotype.Component;

@Component
class UserMapper {

    UserVM toUserVM(UserEntity user) {
        return new UserVM(
                user.getId().id(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}
