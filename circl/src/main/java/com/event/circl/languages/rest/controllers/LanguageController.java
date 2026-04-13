package com.event.circl.languages.rest.controllers;

import com.event.circl.languages.domain.LanguageService;
import com.event.circl.languages.domain.models.LanguageVM;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/languages")
public class LanguageController {

    private final LanguageService languageService;

    LanguageController(LanguageService languageService) {
        this.languageService = languageService;
    }

    @GetMapping
    public ResponseEntity<List<LanguageVM>> getAll() {
        return ResponseEntity.ok(languageService.getAll());
    }
}
