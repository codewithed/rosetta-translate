package com.translationapp.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class FolderCreateRequest {

    @NotBlank
    private String name;

    private UUID parentFolderId; // Nullable for root folders

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public UUID getParentFolderId() {
        return parentFolderId;
    }

    public void setParentFolderId(UUID parentFolderId) {
        this.parentFolderId = parentFolderId;
    }
} 