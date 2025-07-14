package com.translationapp.dto;

import jakarta.validation.constraints.NotBlank;

public class SpeechToTextRequest {
    @NotBlank
    private String audioBase64; // Assuming audio is sent as a base64 string
    @NotBlank
    private String languageCode; // e.g., "en-US"

    // No-argument constructor
    public SpeechToTextRequest() {
    }

    // Constructor with all fields
    public SpeechToTextRequest(String audioBase64, String languageCode) {
        this.audioBase64 = audioBase64;
        this.languageCode = languageCode;
    }

    // Explicit Getters
    public String getAudioBase64() {
        return audioBase64;
    }
    public String getLanguageCode() {
        return languageCode;
    }

    // Setters
    public void setAudioBase64(String audioBase64) {
        this.audioBase64 = audioBase64;
    }

    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }
} 