package com.usc.rideshare.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private final String jwtSecret;
    private final long jwtExpirationMs;

    public JwtUtil(
            @Value("${jwt.secret:your-secret-key-change-in-production-at-least-256-bits}") String jwtSecret,
            @Value("${jwt.expiration.ms:86400000}") long jwtExpirationMs) {
        this.jwtSecret = jwtSecret;
        this.jwtExpirationMs = jwtExpirationMs;
    }

    private SecretKey getSigningKey() {
        byte[] decodedKey = jwtSecret.getBytes();
        return Keys.hmacShaKeyFor(decodedKey);
    }

    public String generateToken(UUID userId, String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public UUID getUserIdFromToken(String token) {
        return UUID.fromString(Jwts.parser()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject());
    }

    public String getEmailFromToken(String token) {
        return (String) Jwts.parser()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody()
            .get("email");
    }

    public boolean isTokenValid(String token) {
        try {
                Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
