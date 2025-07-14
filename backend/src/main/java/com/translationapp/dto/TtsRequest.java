package com.translationapp.dto;

import jakarta.validation.constraints.NotBlank;

public class TtsRequest {
    @NotBlank
    private String text;
    @NotBlank
    private String languageCode; // e.g., "en-US"

    // No-argument constructor
    public TtsRequest() {
    }

    // Constructor with all fields
    public TtsRequest(String text, String languageCode) {
        this.text = text;
        this.languageCode = languageCode;
    }

    // Explicit Getters
    public String getText() {
        return text;
    }
    public String getLanguageCode() {
        return languageCode;
    }

    // Setters
    public void setText(String text) {
        this.text = text;
    }

    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }
} 