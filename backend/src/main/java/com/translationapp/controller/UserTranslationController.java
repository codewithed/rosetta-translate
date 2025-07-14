package com.translationapp.controller;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.translationapp.dto.ApiResponse;
import com.translationapp.dto.CreateTranslationRequest;
import com.translationapp.dto.TranslationResponseDto;
import com.translationapp.model.Translation;
import com.translationapp.security.UserPrincipal;
import com.translationapp.service.TranslationPersistenceService;

@RestController
@RequestMapping("/api/translations")
public class UserTranslationController {

    private final TranslationPersistenceService translationPersistenceService;

    public UserTranslationController(TranslationPersistenceService translationPersistenceService) {
        this.translationPersistenceService = translationPersistenceService;
    }

    @PostMapping
    public ResponseEntity<TranslationResponseDto> createTranslation(@AuthenticationPrincipal UserPrincipal currentUser,
                                                                    @Valid @RequestBody CreateTranslationRequest request) {
        Translation translation = translationPersistenceService.saveTranslation(
                currentUser.getId(),
                request.getSourceText(),
                request.getTargetText(),
                request.getSourceLang(),
                request.getTargetLang(),
                request.getInputType()
        );
        return new ResponseEntity<>(TranslationResponseDto.fromEntity(translation), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<TranslationResponseDto>> getTranslations(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Translation> translationPage = translationPersistenceService.getTranslationHistory(currentUser.getId(), page, size);
        Page<TranslationResponseDto> dtoPage = translationPage.map(TranslationResponseDto::fromEntity);
        return ResponseEntity.ok(dtoPage);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteTranslation(@AuthenticationPrincipal UserPrincipal currentUser,
                                                       @PathVariable UUID id) {
        try {
            translationPersistenceService.deleteTranslation(id, currentUser.getId());
            return ResponseEntity.ok(new ApiResponse(true, "Translation deleted successfully."));
        } catch (SecurityException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (RuntimeException e) { // Catch other specific exceptions like EntityNotFound
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@AuthenticationPrincipal UserPrincipal currentUser,
                                               @PathVariable UUID id) {
        try {
            Translation updatedTranslation = translationPersistenceService.toggleFavorite(id, currentUser.getId());
            return ResponseEntity.ok(TranslationResponseDto.fromEntity(updatedTranslation));
        } catch (SecurityException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }
} 