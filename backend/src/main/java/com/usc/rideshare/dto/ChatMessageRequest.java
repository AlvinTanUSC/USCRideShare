package com.usc.rideshare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class ChatMessageRequest {

    @NotNull(message = "Match ID is required")
    private UUID matchId;

    @NotNull(message = "Sender ID is required")
    private UUID senderId;

    @NotBlank(message = "Message content cannot be empty")
    private String content;

    public ChatMessageRequest() {
    }

    public ChatMessageRequest(UUID matchId, UUID senderId, String content) {
        this.matchId = matchId;
        this.senderId = senderId;
        this.content = content;
    }

    public UUID getMatchId() {
        return matchId;
    }

    public void setMatchId(UUID matchId) {
        this.matchId = matchId;
    }

    public UUID getSenderId() {
        return senderId;
    }

    public void setSenderId(UUID senderId) {
        this.senderId = senderId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
