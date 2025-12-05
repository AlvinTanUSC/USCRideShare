package com.usc.rideshare.service;

import com.usc.rideshare.dto.ChatMessageRequest;
import com.usc.rideshare.dto.ChatMessageResponse;
import com.usc.rideshare.entity.Match;
import com.usc.rideshare.entity.Message;
import com.usc.rideshare.entity.User;
import com.usc.rideshare.entity.enums.MatchStatus;
import com.usc.rideshare.repository.MatchRepository;
import com.usc.rideshare.repository.MessageRepository;
import com.usc.rideshare.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final MessageRepository messageRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    public ChatService(MessageRepository messageRepository,
                      MatchRepository matchRepository,
                      UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.matchRepository = matchRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        // Validate match exists and user is part of it
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));

        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify user is part of the match
        boolean isUserInMatch = match.getRide1().getUser().getUserId().equals(sender.getUserId()) ||
                               match.getRide2().getUser().getUserId().equals(sender.getUserId());

        if (!isUserInMatch) {
            throw new RuntimeException("User is not part of this match");
        }

        // TODO: Add status check once match_status enum values are confirmed
        // For now, allow messaging in any match

        // Create and save message
        Message message = new Message(match, sender, request.getContent());
        message = messageRepository.save(message);

        return new ChatMessageResponse(message);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMatchMessages(UUID matchId, UUID userId) {
        // Verify user is part of the match
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        boolean isUserInMatch = match.getRide1().getUser().getUserId().equals(userId) ||
                               match.getRide2().getUser().getUserId().equals(userId);

        if (!isUserInMatch) {
            throw new RuntimeException("User is not part of this match");
        }

        List<Message> messages = messageRepository.findByMatchIdOrderBySentAtAsc(matchId);
        return messages.stream()
                .map(ChatMessageResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markMessagesAsRead(UUID matchId, UUID userId) {
        List<Message> unreadMessages = messageRepository.findUnreadMessagesForUser(matchId, userId);

        for (Message message : unreadMessages) {
            message.setIsRead(true);
        }

        messageRepository.saveAll(unreadMessages);
    }

    @Transactional(readOnly = true)
    public Long getUnreadMessageCount(UUID userId) {
        return messageRepository.countUnreadMessagesForUser(userId);
    }

    @Transactional(readOnly = true)
    public UUID getOtherUserId(UUID matchId, UUID currentUserId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (match.getRide1().getUser().getUserId().equals(currentUserId)) {
            return match.getRide2().getUser().getUserId();
        } else if (match.getRide2().getUser().getUserId().equals(currentUserId)) {
            return match.getRide1().getUser().getUserId();
        } else {
            throw new RuntimeException("User is not part of this match");
        }
    }
}
