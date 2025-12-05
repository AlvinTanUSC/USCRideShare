package com.usc.rideshare.service;

import com.usc.rideshare.entity.User;
import com.usc.rideshare.repository.UserRepository;
import com.usc.rideshare.util.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RestTemplate restTemplate, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Verify Google ID token using Google's tokeninfo endpoint.
     * On success, returns an existing or newly-created User and issues a JWT.
     */
    public String verifyGoogleIdTokenAndIssueJwt(String idToken) {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
        Map<String, Object> resp;
        try {
            resp = restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid ID token");
        }

        if (resp == null || resp.get("email") == null) {
            throw new IllegalArgumentException("Invalid token response");
        }

        String email = String.valueOf(resp.get("email"));
        String emailVerified = String.valueOf(resp.getOrDefault("email_verified", "false"));

        if (!"true".equalsIgnoreCase(emailVerified)) {
            throw new IllegalArgumentException("Email not verified by Google");
        }
        // - ENABLE/DISABLE usc email check
        if (!email.endsWith("@usc.edu")) {
            throw new IllegalArgumentException("Only @usc.edu emails are allowed");
        }

        Optional<User> existing = userRepository.findByEmail(email);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            user = new User();
            user.setEmail(email);
            Object nameObj = resp.get("name");
            if (nameObj != null) {
                String name = String.valueOf(nameObj);
                if (name.contains(" ")) {
                    int idx = name.indexOf(' ');
                    user.setFirstName(name.substring(0, idx));
                    user.setLastName(name.substring(idx + 1));
                } else {
                    user.setFirstName(name);
                }
            }
            user.setEmailVerified(true);
            user.setCreatedAt(Instant.now());
            user = userRepository.save(user);
        }

        // Issue JWT
        return jwtUtil.generateToken(user.getUserId(), user.getEmail());
    }
}

