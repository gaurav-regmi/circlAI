package com.event.circl.languages.domain;

import com.event.circl.languages.domain.models.LanguageVM;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LanguageService {

    private final LanguageRepository repository;

    LanguageService(LanguageRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<LanguageVM> getAll() {
        return repository.findAllByOrderByNameAsc()
                .stream()
                .map(l -> new LanguageVM(l.getId(), l.getName()))
                .toList();
    }
}
