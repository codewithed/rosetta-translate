package com.translationapp.dto;

import com.translationapp.model.InputType;
import com.translationapp.model.Translation;

import java.time.LocalDateTime;
import java.util.UUID;

public class TranslationResponseDto {
    private String id;
    private String sourceText;
    private String targetText;
    private String sourceLang;
    private String targetLang;
    private InputType inputType;
    private boolean isFavorite;
    private String tags; // JSON string
    private LocalDateTime createdAt;
    // user_id is not typically exposed directly in list views, assumed to be current user

    public TranslationResponseDto(UUID id, String sourceText, String targetText, String sourceLang, String targetLang, 
                                  InputType inputType, boolean isFavorite, String tags, LocalDateTime createdAt) {
        this.id = id.toString();
        this.sourceText = sourceText;
        this.targetText = targetText;
        this.sourceLang = sourceLang;
        this.targetLang = targetLang;
        this.inputType = inputType;
        this.isFavorite = isFavorite;
        this.tags = tags;
        this.createdAt = createdAt;
    }

    public static TranslationResponseDto fromEntity(Translation translation) {
        return new TranslationResponseDto(
            translation.getId(),
            translation.getSourceText(),
            translation.getTargetText(),
            translation.getSourceLang(),
            translation.getTargetLang(),
            translation.getInputType(),
            translation.isFavorite(),
            translation.getTags(),
            translation.getCreatedAt()
        );
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSourceText() { return sourceText; }
    public void setSourceText(String sourceText) { this.sourceText = sourceText; }
    public String getTargetText() { return targetText; }
    public void setTargetText(String targetText) { this.targetText = targetText; }
    public String getSourceLang() { return sourceLang; }
    public void setSourceLang(String sourceLang) { this.sourceLang = sourceLang; }
    public String getTargetLang() { return targetLang; }
    public void setTargetLang(String targetLang) { this.targetLang = targetLang; }
    public InputType getInputType() { return inputType; }
    public void setInputType(InputType inputType) { this.inputType = inputType; }
    public boolean isFavorite() { return isFavorite; }
    public void setFavorite(boolean favorite) { isFavorite = favorite; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
} 