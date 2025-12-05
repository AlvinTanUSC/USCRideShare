package com.usc.rideshare.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOriginPatterns(
                "http://localhost:5173",  // Vite default
                "http://localhost:5174",  // alternate Vite port
                "http://127.0.0.1:5173",  // loopback variants
                "http://127.0.0.1:5174",
                "http://localhost:3000",  // React default
                "https://usc-ride-share.vercel.app",
                "https://*.vercel.app"    // Vercel deployments
            )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
