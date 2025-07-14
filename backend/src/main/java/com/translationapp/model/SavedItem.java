package com.translationapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_items")
public class SavedItem {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "translation_id", nullable = false)
    private Translation translation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SavedItemCategory category;

    @ManyToOne(fetch = FetchType.LAZY) // Nullable
    @JoinColumn(name = "folder_id")
    private Folder folder;

    @Column // Nullable, user might not always name it explicitly
    private String name;

    @Lob // For potentially longer notes
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public SavedItem() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructor
    public SavedItem(User user, Translation translation, SavedItemCategory category, Folder folder, String name, String notes) {
        this();
        this.user = user;
        this.translation = translation;
        this.category = category;
        this.folder = folder;
        this.name = name;
        this.notes = notes;
    }

    // Getters and Setters
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

    public Translation getTranslation() {
        return translation;
    }

    public void setTranslation(Translation translation) {
        this.translation = translation;
    }

    public SavedItemCategory getCategory() {
        return category;
    }

    public void setCategory(SavedItemCategory category) {
        this.category = category;
    }

    public Folder getFolder() {
        return folder;
    }

    public void setFolder(Folder folder) {
        this.folder = folder;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 