package com.translationapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "translations")
public class Translation {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Lob
    @Column(name = "source_text", nullable = false)
    private String sourceText;

    @Lob
    @Column(name = "target_text", nullable = false)
    private String targetText;

    @Column(name = "source_lang", nullable = false)
    private String sourceLang;

    @Column(name = "target_lang", nullable = false)
    private String targetLang;

    @Enumerated(EnumType.STRING)
    @Column(name = "input_type", nullable = false)
    private InputType inputType;

    @Column(name = "is_favorite", nullable = false)
    private boolean isFavorite = false; // Default to not favorite

    @Lob // For potentially larger JSON string for tags
    @Column(name = "tags")
    private String tags; // JSON string

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Translation() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructor, Getters, and Setters

    public Translation(User user, String sourceText, String targetText, String sourceLang, String targetLang, InputType inputType) {
        this();
        this.user = user;
        this.sourceText = sourceText;
        this.targetText = targetText;
        this.sourceLang = sourceLang;
        this.targetLang = targetLang;
        this.inputType = inputType;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getSourceText() {
        return sourceText;
    }

    public void setSourceText(String sourceText) {
        this.sourceText = sourceText;
    }

    public String getTargetText() {
        return targetText;
    }

    public void setTargetText(String targetText) {
        this.targetText = targetText;
    }

    public String getSourceLang() {
        return sourceLang;
    }

    public void setSourceLang(String sourceLang) {
        this.sourceLang = sourceLang;
    }

    public String getTargetLang() {
        return targetLang;
    }

    public void setTargetLang(String targetLang) {
        this.targetLang = targetLang;
    }

    public InputType getInputType() {
        return inputType;
    }

    public void setInputType(InputType inputType) {
        this.inputType = inputType;
    }

    public boolean isFavorite() {
        return isFavorite;
    }

    public void setFavorite(boolean favorite) {
        isFavorite = favorite;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 