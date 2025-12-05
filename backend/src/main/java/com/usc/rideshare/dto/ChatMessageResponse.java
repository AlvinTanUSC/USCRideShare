package com.usc.rideshare.dto;

import com.usc.rideshare.entity.Message;

import java.time.Instant;
import java.util.UUID;

public class ChatMessageResponse {

    private UUID messageId;
    private UUID matchId;
    private UUID senderId;
    private String senderName;
    private String content;
    private Instant sentAt;
    private Boolean isRead;

    public ChatMessageResponse() {
    }

    public ChatMessageResponse(Message message) {
        this.messageId = message.getMessageId();
        this.matchId = message.getMatch().getMatchId();
        this.senderId = message.getSender().getUserId();
        this.senderName = message.getSender().getFirstName() + " " + message.getSender().getLastName();
        this.content = message.getContent();
        this.sentAt = message.getSentAt();
        this.isRead = message.getIsRead();
    }

    public UUID getMessageId() {
        return messageId;
    }

    public void setMessageId(UUID messageId) {
        this.messageId = messageId;
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

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
}
