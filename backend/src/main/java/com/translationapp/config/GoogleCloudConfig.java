package com.translationapp.config;

import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.speech.v1.SpeechClient;
import com.google.cloud.speech.v1.SpeechSettings;
import com.google.cloud.texttospeech.v1.TextToSpeechClient;
import com.google.cloud.texttospeech.v1.TextToSpeechSettings;
import com.google.cloud.translate.Translate;
import com.google.cloud.translate.TranslateOptions;
import com.google.cloud.translate.v3.TranslationServiceClient;
import com.google.cloud.translate.v3.TranslationServiceSettings;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.FileSystemResource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;

@Configuration
public class GoogleCloudConfig {

    @Value("${google.cloud.credentials}")
    private String gcpCredentialsPath;

    private GoogleCredentials getCredentials() throws IOException {
        // Construct the absolute path to the credentials file
        String projectBaseDir = System.getProperty("user.dir"); 
        String absoluteCredentialsPath = Paths.get(projectBaseDir, gcpCredentialsPath).toString();

        // For debugging, you can print this path:
        // System.out.println("Attempting to load credentials from absolute path: " + absoluteCredentialsPath);

        InputStream credentialsStream = new FileSystemResource(absoluteCredentialsPath).getInputStream();
        return GoogleCredentials.fromStream(credentialsStream);
    }

    @Bean
    public TranslationServiceClient translationServiceClient() throws IOException {
        TranslationServiceSettings settings = TranslationServiceSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(getCredentials()))
                .build();
        return TranslationServiceClient.create(settings);
    }

    @Bean
    public ImageAnnotatorClient imageAnnotatorClient() throws IOException {
        ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(getCredentials()))
                .build();
        return ImageAnnotatorClient.create(settings);
    }

    // Speech-to-Text Client
    @Bean
    public SpeechClient speechClient() throws IOException {
        SpeechSettings speechSettings = SpeechSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(getCredentials()))
                .build();
        return SpeechClient.create(speechSettings);
    }

    // Text-to-Speech Client
    @Bean
    public TextToSpeechClient textToSpeechClient() throws IOException {
        TextToSpeechSettings settings = TextToSpeechSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(getCredentials()))
                .build();
        return TextToSpeechClient.create(settings);
    }

    // Keep the old Translate bean if it's used elsewhere, but ensure it also uses credentials
    // If it's not used, it can be removed.
    @Bean
    public Translate translate() throws IOException {
        return TranslateOptions.newBuilder()
                .setCredentials(getCredentials())
                .build()
                .getService();
    }
}