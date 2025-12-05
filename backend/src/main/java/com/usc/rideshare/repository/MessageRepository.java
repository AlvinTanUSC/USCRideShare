package com.usc.rideshare.repository;

import com.usc.rideshare.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    /**
     * Find all messages for a specific match, ordered by sent time
     */
    @Query("SELECT m FROM Message m WHERE m.match.matchId = :matchId ORDER BY m.sentAt ASC")
    List<Message> findByMatchIdOrderBySentAtAsc(@Param("matchId") UUID matchId);

    /**
     * Find unread messages for a specific user in a match
     */
    @Query("SELECT m FROM Message m WHERE m.match.matchId = :matchId " +
           "AND m.sender.userId != :userId AND m.isRead = false ORDER BY m.sentAt ASC")
    List<Message> findUnreadMessagesForUser(@Param("matchId") UUID matchId, @Param("userId") UUID userId);

    /**
     * Count unread messages for a user across all their matches
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE " +
           "(m.match.ride1.user.userId = :userId OR m.match.ride2.user.userId = :userId) " +
           "AND m.sender.userId != :userId AND m.isRead = false")
    Long countUnreadMessagesForUser(@Param("userId") UUID userId);
}
