package com.translationapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users") // Explicitly name the table
public class User {

    @Id
    @GeneratedValue // Let JPA handle generation, can be strategy = GenerationType.AUTO or specific
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt; // Or last_modified_at

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "preferred_source_lang")
    private String preferredSourceLang;

    @Column(name = "preferred_target_lang")
    private String preferredTargetLang;

    @Lob // For potentially larger JSON string
    @Column(name = "settings")
    private String settings; // To store JSON as String

    // Lombok's @Data was removed due to issues, ensure getters/setters exist or are added.

    public User() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Constructor for sign-up, adjust as needed
    public User(String username, String email, String password) {
        this(); // Call default constructor to set timestamps
        this.username = username;
        this.email = email;
        this.password = password;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public String getPreferredSourceLang() {
        return preferredSourceLang;
    }

    public void setPreferredSourceLang(String preferredSourceLang) {
        this.preferredSourceLang = preferredSourceLang;
    }

    public String getPreferredTargetLang() {
        return preferredTargetLang;
    }

    public void setPreferredTargetLang(String preferredTargetLang) {
        this.preferredTargetLang = preferredTargetLang;
    }

    public String getSettings() {
        return settings;
    }

    public void setSettings(String settings) {
        this.settings = settings;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
} 