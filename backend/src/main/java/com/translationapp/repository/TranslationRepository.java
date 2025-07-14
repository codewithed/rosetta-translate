package com.translationapp.repository;

import com.translationapp.model.Translation;
import com.translationapp.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TranslationRepository extends JpaRepository<Translation, UUID> {
    // Find by user, ordered by creation date descending
    Page<Translation> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // For checking if a specific translation by text and languages already exists for a user (optional)
    // boolean existsByUserAndSourceTextAndTargetTextAndSourceLangAndTargetLang(User user, String sourceText, String targetText, String sourceLang, String targetLang);
} 