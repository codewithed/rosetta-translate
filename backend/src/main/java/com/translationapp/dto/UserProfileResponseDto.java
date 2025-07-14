package com.translationapp.dto;

import com.translationapp.model.User;
import java.time.LocalDateTime;

public class UserProfileResponseDto {
    private String id;
    private String username;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private UserPreferenceDto preferences;
    private String settings; // Raw JSON string for other settings

    public UserProfileResponseDto(String id, String username, String email, LocalDateTime createdAt, LocalDateTime lastLogin, UserPreferenceDto preferences, String settings) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.createdAt = createdAt;
        this.lastLogin = lastLogin;
        this.preferences = preferences;
        this.settings = settings;
    }

    public static UserProfileResponseDto fromEntity(User user) {
        UserPreferenceDto prefs = new UserPreferenceDto(
            user.getPreferredSourceLang(),
            user.getPreferredTargetLang()
        );
        return new UserProfileResponseDto(
            user.getId().toString(),
            user.getUsername(),
            user.getEmail(),
            user.getCreatedAt(),
            user.getLastLogin(),
            prefs,
            user.getSettings()
        );
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public UserPreferenceDto getPreferences() {
        return preferences;
    }

    public void setPreferences(UserPreferenceDto preferences) {
        this.preferences = preferences;
    }

    public String getSettings() {
        return settings;
    }

    public void setSettings(String settings) {
        this.settings = settings;
    }
} 