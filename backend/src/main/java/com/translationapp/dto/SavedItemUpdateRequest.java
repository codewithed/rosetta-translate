package com.translationapp.dto;

import java.util.UUID;
// Not using @NotBlank for optional fields, validation handled in service if specific fields are required conditionally.

public class SavedItemUpdateRequest {

    private String name;       // Optional: new name for the saved item
    private String notes;      // Optional: new notes
    private UUID folderId;     // Optional: new folder ID (can be null to move to root)
    private boolean setFolderIdNull; // Explicit flag to set folderId to null

    // Getters and Setters
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

    public UUID getFolderId() {
        return folderId;
    }

    public void setFolderId(UUID folderId) {
        this.folderId = folderId;
    }

    public boolean isSetFolderIdNull() {
        return setFolderIdNull;
    }

    public void setSetFolderIdNull(boolean setFolderIdNull) {
        this.setFolderIdNull = setFolderIdNull;
    }
} 