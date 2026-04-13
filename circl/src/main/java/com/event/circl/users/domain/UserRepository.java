package com.event.circl.users.domain;

import com.event.circl.shared.exceptions.ResourceNotFoundException;
import com.event.circl.users.domain.models.UserId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

interface UserRepository extends JpaRepository<UserEntity, UserId> {

    Optional<UserEntity> findByEmail(@Param("email") String email);

    default UserEntity getByEmail(String email) {
        return findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    default boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    default UserEntity getById(String id) {
        return findById(UserId.of(id))
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    @Query("SELECT u.id.id FROM UserEntity u WHERE u.id.id <> :excludeUserId")
    List<String> findAllUserIdsExcept(@Param("excludeUserId") String excludeUserId);

    @Query("SELECT u FROM UserEntity u WHERE u.id.id IN :ids")
    List<UserEntity> findAllByIdIn(@Param("ids") List<String> ids);
}
