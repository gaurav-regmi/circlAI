package com.event.circl.languages.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "languages", indexes = {
        @Index(name = "idx_language_name", columnList = "name")
})
class LanguageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    protected LanguageEntity() {}

    Long getId() { return id; }
    String getName() { return name; }
}
