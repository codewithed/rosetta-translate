package com.translationapp.dto;

import com.translationapp.model.SavedItemCategory;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class SavedItemCreateRequest {

    @NotNull
    private UUID translationId;

    @NotNull
    private SavedItemCategory category;

    private UUID folderId; // Optional
    private String name;   // Optional, can be derived from translation if not provided
    private String notes;  // Optional

    // Getters and Setters
    public UUID getTranslationId() {
        return translationId;
    }

    public void setTranslationId(UUID translationId) {
        this.translationId = translationId;
    }

    public SavedItemCategory getCategory() {
        return category;
    }

    public void setCategory(SavedItemCategory category) {
        this.category = category;
    }

    public UUID getFolderId() {
        return folderId;
    }

    public void setFolderId(UUID folderId) {
        this.folderId = folderId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
} 