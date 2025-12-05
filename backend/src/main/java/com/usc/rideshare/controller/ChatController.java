package com.usc.rideshare.controller;

import com.usc.rideshare.dto.ChatMessageRequest;
import com.usc.rideshare.dto.ChatMessageResponse;
import com.usc.rideshare.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Controller
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * WebSocket endpoint for sending messages
     * Client sends to: /app/chat.send
     * Message is broadcast to: /topic/match/{matchId}
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Valid @Payload ChatMessageRequest request) {
        try {
            // Save message to database
            ChatMessageResponse response = chatService.sendMessage(request);

            // Broadcast to all users subscribed to this match's topic
            messagingTemplate.convertAndSend(
                    "/topic/match/" + request.getMatchId(),
                    response
            );
        } catch (Exception e) {
            // Handle error - could send error message to user
            System.err.println("Error sending message: " + e.getMessage());
        }
    }

    /**
     * REST endpoint to get chat history for a match
     */
    @GetMapping("/api/chat/match/{matchId}")
    public ResponseEntity<List<ChatMessageResponse>> getMatchMessages(
            @PathVariable UUID matchId,
            @RequestParam UUID userId) {
        try {
            List<ChatMessageResponse> messages = chatService.getMatchMessages(matchId, userId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * REST endpoint to mark messages as read
     */
    @PutMapping("/api/chat/match/{matchId}/read")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable UUID matchId,
            @RequestParam UUID userId) {
        try {
            chatService.markMessagesAsRead(matchId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * REST endpoint to get unread message count for user
     */
    @GetMapping("/api/chat/unread")
    public ResponseEntity<Long> getUnreadCount(@RequestParam UUID userId) {
        try {
            Long count = chatService.getUnreadMessageCount(userId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * WebSocket endpoint for presence updates (online/offline status)
     * Client sends to: /app/chat.presence
     * Presence is broadcast to: /topic/match/{matchId}/presence
     */
    @MessageMapping("/chat.presence")
    public void handlePresence(@Payload java.util.Map<String, Object> presenceData) {
        try {
            String matchId = (String) presenceData.get("matchId");
            String userId = (String) presenceData.get("userId");
            Boolean online = (Boolean) presenceData.get("online");

            // Broadcast presence update to all users in this match
            messagingTemplate.convertAndSend(
                    "/topic/match/" + matchId + "/presence",
                    presenceData
            );
        } catch (Exception e) {
            System.err.println("Error handling presence: " + e.getMessage());
        }
    }
}
