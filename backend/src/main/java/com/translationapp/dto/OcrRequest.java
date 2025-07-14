package com.translationapp.dto;

import jakarta.validation.constraints.NotBlank;

public class OcrRequest {
    @NotBlank
    private String imageBase64; // Assuming image is sent as a base64 string
    // Potentially add language hints if the OCR API supports it
    // private String languageHint;

    // No-argument constructor
    public OcrRequest() {
    }

    // Constructor with imageBase64
    public OcrRequest(String imageBase64) {
        this.imageBase64 = imageBase64;
    }

    // Explicit Getter
    public String getImageBase64() {
        return imageBase64;
    }

    // Setter
    public void setImageBase64(String imageBase64) {
        this.imageBase64 = imageBase64;
    }
} 