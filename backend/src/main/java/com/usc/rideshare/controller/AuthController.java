package com.usc.rideshare.controller;

import com.usc.rideshare.dto.AuthResponse;
import com.usc.rideshare.dto.GoogleAuthRequest;
import com.usc.rideshare.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleAuthRequest request) {
        try {
            String jwtToken = authService.verifyGoogleIdTokenAndIssueJwt(request.getIdToken());
            AuthResponse resp = new AuthResponse();
            resp.setToken(jwtToken);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(e.getMessage()));
        }
    }
}

