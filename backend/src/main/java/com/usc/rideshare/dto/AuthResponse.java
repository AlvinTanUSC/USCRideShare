package com.usc.rideshare.dto;

import java.util.UUID;

public class AuthResponse {

    private UUID userId;
    private String email;
    private String token;
    private String error;

    public AuthResponse() {}

    public AuthResponse(UUID userId, String email, String token) {
        this.userId = userId;
        this.email = email;
        this.token = token;
    }

    public AuthResponse(String error) {
        this.error = error;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
