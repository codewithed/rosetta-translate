package com.translationapp.dto;

public class ApiResponse {
    private Boolean success;
    private String message;
    private Object data;

    // No-argument constructor
    public ApiResponse() {
    }

    // Explicit constructor
    public ApiResponse(Boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // Constructor with data
    public ApiResponse(Boolean success, String message, Object data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    // Getters and Setters
    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
} 