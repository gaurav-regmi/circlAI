package com.event.circl.users.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface UserProfileRepository extends JpaRepository<UserProfileEntity, String> {

    List<UserProfileEntity> findAllByUserIdIn(List<String> userIds);
}
