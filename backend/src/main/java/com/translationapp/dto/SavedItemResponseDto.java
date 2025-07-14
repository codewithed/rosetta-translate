package com.translationapp.dto;

import com.translationapp.model.SavedItem;
import com.translationapp.model.SavedItemCategory;

import java.time.LocalDateTime;
import java.util.UUID;

public class SavedItemResponseDto {
    private String id;
    private TranslationResponseDto translation; // Nested DTO for translation details
    private SavedItemCategory category;
    private String folderId; // String for nullable UUID
    private String folderName; // Convenient for display
    private String name;
    private String notes;
    private LocalDateTime createdAt;

    public SavedItemResponseDto(UUID id, TranslationResponseDto translation, SavedItemCategory category,
                                String folderId, String folderName, String name, String notes, LocalDateTime createdAt) {
        this.id = id.toString();
        this.translation = translation;
        this.category = category;
        this.folderId = folderId;
        this.folderName = folderName;
        this.name = name;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public static SavedItemResponseDto fromEntity(SavedItem savedItem) {
        return new SavedItemResponseDto(
                savedItem.getId(),
                TranslationResponseDto.fromEntity(savedItem.getTranslation()), // Convert embedded Translation entity
                savedItem.getCategory(),
                savedItem.getFolder() != null ? savedItem.getFolder().getId().toString() : null,
                savedItem.getFolder() != null ? savedItem.getFolder().getName() : null,
                savedItem.getName(),
                savedItem.getNotes(),
                savedItem.getCreatedAt()
        );
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public TranslationResponseDto getTranslation() { return translation; }
    public void setTranslation(TranslationResponseDto translation) { this.translation = translation; }
    public SavedItemCategory getCategory() { return category; }
    public void setCategory(SavedItemCategory category) { this.category = category; }
    public String getFolderId() { return folderId; }
    public void setFolderId(String folderId) { this.folderId = folderId; }
    public String getFolderName() { return folderName; }
    public void setFolderName(String folderName) { this.folderName = folderName; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
} 