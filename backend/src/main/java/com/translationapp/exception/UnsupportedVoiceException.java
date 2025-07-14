package com.translationapp.exception;

public class UnsupportedVoiceException extends Exception {
    public UnsupportedVoiceException(String message) {
        super(message);
    }

    public UnsupportedVoiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
