package com.translationapp.dto;

public class UserPreferenceDto {
    private String preferredSourceLang;
    private String preferredTargetLang;
    // Potentially other user-specific settings could go here in the future

    public UserPreferenceDto() {
    }

    public UserPreferenceDto(String preferredSourceLang, String preferredTargetLang) {
        this.preferredSourceLang = preferredSourceLang;
        this.preferredTargetLang = preferredTargetLang;
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
} 