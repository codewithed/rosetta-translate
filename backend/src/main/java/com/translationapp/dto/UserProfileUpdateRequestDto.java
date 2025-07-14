package com.translationapp.dto;

import jakarta.validation.Valid;

public class UserProfileUpdateRequestDto {

    @Valid // Ensure nested DTO is validated
    private UserPreferenceDto preferences;

    private String settings; // For other JSON settings, client must ensure valid JSON

    // Username, email, password updates are typically handled by separate, more secure endpoints.

    public UserProfileUpdateRequestDto() {
    }

    public UserProfileUpdateRequestDto(UserPreferenceDto preferences, String settings) {
        this.preferences = preferences;
        this.settings = settings;
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