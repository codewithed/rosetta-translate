package com.translationapp.service;

import com.google.cloud.speech.v1.*;
import com.google.cloud.translate.Translate;
import com.google.cloud.translate.Translation;
import com.google.cloud.texttospeech.v1.*;
import com.google.cloud.translate.v3.LocationName;
import com.google.cloud.translate.v3.TranslateTextRequest;
import com.google.cloud.translate.v3.TranslateTextResponse;
import com.google.cloud.translate.v3.TranslationServiceClient;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import com.google.api.gax.rpc.InvalidArgumentException; // Added for specific exception handling
import com.translationapp.exception.UnsupportedVoiceException; // Added custom exception
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class GoogleCloudService {

    private final TranslationServiceClient translationServiceClient;
    private final ImageAnnotatorClient imageAnnotatorClient;
    private final SpeechClient speechClient;
    private final TextToSpeechClient textToSpeechClient;

    @Value("${google.cloud.project-id}")
    private String projectId;

    public GoogleCloudService(TranslationServiceClient translationServiceClient,
                              ImageAnnotatorClient imageAnnotatorClient,
                              SpeechClient speechClient,
                              TextToSpeechClient textToSpeechClient) {
        this.translationServiceClient = translationServiceClient;
        this.imageAnnotatorClient = imageAnnotatorClient;
        this.speechClient = speechClient;
        this.textToSpeechClient = textToSpeechClient;
    }

    public String translateText(String text, String targetLanguage) {
        LocationName parent = LocationName.of(projectId, "global");
        TranslateTextRequest request = TranslateTextRequest.newBuilder()
                .setParent(parent.toString())
                .setTargetLanguageCode(targetLanguage)
                .addContents(text)
                .build();
        TranslateTextResponse response = translationServiceClient.translateText(request);
        return response.getTranslations(0).getTranslatedText();
    }

    public String ocr(MultipartFile imageFile) throws IOException {
        ByteString imgBytes = ByteString.copyFrom(imageFile.getBytes());
        Image img = Image.newBuilder().setContent(imgBytes).build();
        Feature feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
        AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feat)
                .setImage(img)
                .build();

        List<AnnotateImageResponse> responses = imageAnnotatorClient.batchAnnotateImages(List.of(request)).getResponsesList();
        StringBuilder detectedText = new StringBuilder();
        for (AnnotateImageResponse res : responses) {
            if (res.hasError()) {
                // Log error or throw exception
                System.err.printf("Error: %s\n", res.getError().getMessage());
                return "Error during OCR processing.";
            }
            for (EntityAnnotation annotation : res.getTextAnnotationsList()) {
                detectedText.append(annotation.getDescription());
                break; // Process only the first annotation which usually contains the full text
            }
        }
        return detectedText.toString();
    }

    public byte[] textToSpeech(String text, String languageCode) throws UnsupportedVoiceException, Exception {
        SynthesisInput input = SynthesisInput.newBuilder().setText(text).build();
        VoiceSelectionParams voice = VoiceSelectionParams.newBuilder()
                .setLanguageCode(languageCode) // e.g., "en-US"
                .setSsmlGender(SsmlVoiceGender.NEUTRAL)
                .build();
        AudioConfig audioConfig = AudioConfig.newBuilder()
                .setAudioEncoding(AudioEncoding.MP3)
                .build();

        try {
            SynthesizeSpeechResponse response = textToSpeechClient.synthesizeSpeech(input, voice, audioConfig);
            return response.getAudioContent().toByteArray();
        } catch (InvalidArgumentException e) {
            String message = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            // Check for common messages indicating voice/language unavailability
            if ((message.contains("voice") && (message.contains("does not exist") || message.contains("is not supported for the input language_code"))) || 
                message.contains("unsupported language code") || 
                message.contains("language code") && message.contains("not supported")) {
                throw new UnsupportedVoiceException("Text-to-Speech is not available for the language: " + languageCode + ". Details: " + e.getMessage(), e);
            }
            // If the message doesn't match known patterns, rethrow the original exception
            throw e;
        }
    }

    public String speechToText(byte[] audioData, String languageCode, String contentType) throws Exception {
        RecognitionConfig.Builder configBuilder = RecognitionConfig.newBuilder()
            .setLanguageCode(languageCode); // e.g., "en-US"

        // Determine encoding and sample rate based on content type
        if ("audio/wav".equalsIgnoreCase(contentType) || "audio/l16".equalsIgnoreCase(contentType) || "audio/wave".equalsIgnoreCase(contentType) || "audio/vnd.wave".equalsIgnoreCase(contentType) || "audio/vnd.wav".equalsIgnoreCase(contentType)) {
            configBuilder.setEncoding(RecognitionConfig.AudioEncoding.LINEAR16);
            configBuilder.setSampleRateHertz(16000); // Common for WAV, adjust if known otherwise. 16000 is also common for STT.
        } else if ("audio/awb".equalsIgnoreCase(contentType) || "audio/amr_wb".equalsIgnoreCase(contentType)) {
           configBuilder.setEncoding(RecognitionConfig.AudioEncoding.AMR_WB);
           configBuilder.setSampleRateHertz(16000);
        } else {
            // Default to LINEAR16 if content type is unknown or not explicitly handled,
            // but this might lead to errors. Consider throwing an exception for unsupported types.
            // For now, retaining original behavior as a fallback but logging a warning.

            // Would need to convert to an encoding supported by the translate api
            System.err.println("Warning: Unknown or unhandled audio content type '" + contentType + "'. Defaulting to LINEAR16 and 16000Hz.");
            configBuilder.setEncoding(RecognitionConfig.AudioEncoding.LINEAR16);
            configBuilder.setSampleRateHertz(16000);
        }

        RecognitionConfig config = configBuilder.build();
        RecognitionAudio audio = RecognitionAudio.newBuilder().setContent(ByteString.copyFrom(audioData)).build();

        System.out.println("Google STT Request Config: " + config.toString()); // Log the config being sent
        RecognizeResponse response = this.speechClient.recognize(config, audio);
        System.out.println("Google STT Raw Response: " + response.toString()); // Log the full raw response
        StringBuilder transcript = new StringBuilder();
        if (response.getResultsList().isEmpty()) {
            System.out.println("Google STT Response contained no results.");
        }
        for (SpeechRecognitionResult result : response.getResultsList()) {
            transcript.append(result.getAlternativesList().get(0).getTranscript());
        }
        return transcript.toString();
    }
}