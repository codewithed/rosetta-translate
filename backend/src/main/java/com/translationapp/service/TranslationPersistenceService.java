package com.translationapp.service;

import com.translationapp.model.InputType;
import com.translationapp.model.Translation;
import com.translationapp.model.User;
import com.translationapp.repository.TranslationRepository;
import com.translationapp.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class TranslationPersistenceService {

    private final TranslationRepository translationRepository;
    private final UserRepository userRepository; // To fetch User entity

    public TranslationPersistenceService(TranslationRepository translationRepository, UserRepository userRepository) {
        this.translationRepository = translationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Translation saveTranslation(UUID userId, String sourceText, String targetText, String sourceLang, String targetLang, InputType inputType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        Translation translation = new Translation(user, sourceText, targetText, sourceLang, targetLang, inputType);
        // isFavorite and tags can be set later if needed, default isFavorite is false.
        return translationRepository.save(translation);
    }

    @Transactional(readOnly = true)
    public Page<Translation> getTranslationHistory(UUID userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return translationRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }
    
    @Transactional
    public void deleteTranslation(UUID translationId, UUID userId) {
        Translation translation = translationRepository.findById(translationId)
            .orElseThrow(() -> new RuntimeException("Translation not found")); // Or a custom exception
        if (!translation.getUser().getId().equals(userId)) {
            throw new SecurityException("User not authorized to delete this translation"); // Or a custom access denied exception
        }
        translationRepository.delete(translation);
    }

    @Transactional
    public Translation toggleFavorite(UUID translationId, UUID userId) {
        Translation translation = translationRepository.findById(translationId)
            .orElseThrow(() -> new RuntimeException("Translation not found"));
        if (!translation.getUser().getId().equals(userId)) {
            throw new SecurityException("User not authorized to modify this translation");
        }
        translation.setFavorite(!translation.isFavorite());
        return translationRepository.save(translation);
    }
} 