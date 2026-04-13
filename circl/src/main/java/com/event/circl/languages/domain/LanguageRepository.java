package com.event.circl.languages.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface LanguageRepository extends JpaRepository<LanguageEntity, Long> {

    List<LanguageEntity> findAllByOrderByNameAsc();
}
