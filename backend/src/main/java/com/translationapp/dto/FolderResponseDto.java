package com.translationapp.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.translationapp.model.Folder;

public class FolderResponseDto {
    private String id;
    private String name;
    private String parentFolderId; // String to handle null UUIDs gracefully
    private LocalDateTime createdAt;
    // private List<FolderResponseDto> subFolders; // Optional: for nested responses
    // private int itemCount; // Optional: count of items in this folder

    public FolderResponseDto(UUID id, String name, UUID parentFolderId, LocalDateTime createdAt) {
        this.id = id.toString();
        this.name = name;
        this.parentFolderId = parentFolderId != null ? parentFolderId.toString() : null;
        this.createdAt = createdAt;
    }

    public static FolderResponseDto fromEntity(Folder folder) {
        return new FolderResponseDto(
                folder.getId(),
                folder.getName(),
                folder.getParentFolder() != null ? folder.getParentFolder().getId() : null,
                folder.getCreatedAt()
        );
    }

    // If including subfolders directly in DTO:
    // public static FolderResponseDto fromEntityWithSubfolders(Folder folder, List<Folder> subFolders) {
    //     FolderResponseDto dto = fromEntity(folder);
    //     dto.setSubFolders(subFolders.stream().map(FolderResponseDto::fromEntity).collect(Collectors.toList()));
    //     return dto;
    // }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getParentFolderId() {
        return parentFolderId;
    }

    public void setParentFolderId(String parentFolderId) {
        this.parentFolderId = parentFolderId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // public List<FolderResponseDto> getSubFolders() {
    //     return subFolders;
    // }

    // public void setSubFolders(List<FolderResponseDto> subFolders) {
    //     this.subFolders = subFolders;
    // }

    // public int getItemCount() {
    //     return itemCount;
    // }

    // public void setItemCount(int itemCount) {
    //     this.itemCount = itemCount;
    // }
} 