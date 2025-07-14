package com.translationapp.dto;

import jakarta.validation.constraints.NotBlank;

public class TranslateRequest {
    @NotBlank
    private String sourceLang;
    @NotBlank
    private String targetLang;
    @NotBlank
    private String text;
    // Add other fields if necessary, e.g., inputType based on the spec
    // private String inputType; // ENUM('text','speech','image','handwriting')

    // No-argument constructor
    public TranslateRequest() {
    }

    // Constructor with all fields
    public TranslateRequest(String sourceLang, String targetLang, String text) {
        this.sourceLang = sourceLang;
        this.targetLang = targetLang;
        this.text = text;
    }

    // Explicit getters - adding them proactively to avoid Lombok issues
    public String getSourceLang() {
        return sourceLang;
    }
    public String getTargetLang() {
        return targetLang;
    }
    public String getText() {
        return text;
    }
    // public String getInputType() { return inputType; }

    // Setters
    public void setSourceLang(String sourceLang) {
        this.sourceLang = sourceLang;
    }

    public void setTargetLang(String targetLang) {
        this.targetLang = targetLang;
    }

    public void setText(String text) {
        this.text = text;
    }
} 