package com.event.circl.notifications.domain;

import com.event.circl.notifications.domain.models.NotificationVM;
import org.springframework.stereotype.Component;

@Component
class NotificationMapper {

    NotificationVM toVM(NotificationEntity entity) {
        return new NotificationVM(
                entity.getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getReferenceId(),
                entity.isSeen(),
                entity.getCreatedAt()
        );
    }
}
