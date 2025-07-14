package com.translationapp.controller;

import com.translationapp.dto.*;
import com.translationapp.exception.UnsupportedVoiceException;
import com.translationapp.service.GoogleCloudService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Base64;

@RestController
@RequestMapping("/api") // Using /api prefix for protected endpoints
public class TranslationController {

    private static final Logger logger = LoggerFactory.getLogger(TranslationController.class);

    private final GoogleCloudService googleCloudService;

    public TranslationController(GoogleCloudService googleCloudService) {
        this.googleCloudService = googleCloudService;
    }

    @PostMapping("/translate")
    public ResponseEntity<?> translateText(@RequestBody TranslateRequest translateRequest) {
        try {
            String translatedText = googleCloudService.translateText(translateRequest.getText(), translateRequest.getTargetLang());
            return ResponseEntity.ok(new ApiResponse(true, translatedText));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error during translation: " + e.getMessage()));
        }
    }

    @PostMapping("/tts")
    public ResponseEntity<?> textToSpeech(@RequestBody TtsRequest ttsRequest) {
        try {
            byte[] audioBytes = googleCloudService.textToSpeech(ttsRequest.getText(), ttsRequest.getLanguageCode());
            String base64Audio = Base64.getEncoder().encodeToString(audioBytes);
            return ResponseEntity.ok(new ApiResponse(true, "TTS_AUDIO_GENERATED", base64Audio));
        } catch (UnsupportedVoiceException e) {
            logger.warn("TTS unavailable for language '{}': {}", ttsRequest.getLanguageCode(), e.getMessage());
            // Return 200 OK, but with a payload indicating TTS is not available
            return ResponseEntity.ok(new ApiResponse(false, "TTS_UNAVAILABLE", "Text-to-Speech is not available for the selected language."));
        } catch (Exception e) {
            logger.error("Error during text-to-speech processing for text: '{}', languageCode: {}", ttsRequest.getText(), ttsRequest.getLanguageCode(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "GENERAL_TTS_ERROR", "Error during text-to-speech: " + e.getMessage()));
        }
    }

    @PostMapping("/ocr")
    public ResponseEntity<?> ocr(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "File is empty"));
        }
        try {
            String detectedText = googleCloudService.ocr(file);
            return ResponseEntity.ok(new ApiResponse(true, detectedText));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error during OCR processing: " + e.getMessage()));
        }
    }

    @PostMapping("/speech")
    public ResponseEntity<?> speechToText(@RequestParam("file") MultipartFile file, @RequestParam("languageCode") String languageCode) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Audio file is empty"));
        }
        try {
            String contentType = file.getContentType();
            String transcript = googleCloudService.speechToText(file.getBytes(), languageCode, contentType);
            return ResponseEntity.ok(new ApiResponse(true, transcript));
        } catch (Exception e) {
            logger.error("Error during speech-to-text processing for languageCode: {}", languageCode, e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(false, "Error during speech-to-text processing: " + e.getMessage()));
        }
    }
}