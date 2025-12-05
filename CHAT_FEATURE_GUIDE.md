# Chat Feature Implementation Guide

## Overview

A real-time chat feature has been implemented for USC RideShare using **WebSockets with STOMP protocol**. This enables matched users to communicate in real-time with full multithreading and networking capabilities.

## Architecture

### Backend Components

#### 1. WebSocket Configuration
- **File**: [backend/src/main/java/com/usc/rideshare/config/WebSocketConfig.java](backend/src/main/java/com/usc/rideshare/config/WebSocketConfig.java)
- **WebSocket Endpoint**: `ws://localhost:8080/ws`
- **STOMP Protocol**: Enabled for pub/sub messaging
- **Message Prefixes**:
  - `/app/*` - Messages FROM client TO server
  - `/topic/*` - Messages FROM server TO client

#### 2. Database Schema
- **Entity**: [Message.java](backend/src/main/java/com/usc/rideshare/entity/Message.java)
- **Table**: `messages`
- **Columns**:
  - `message_id` (UUID, primary key)
  - `match_id` (UUID, foreign key to matches)
  - `sender_id` (UUID, foreign key to users)
  - `content` (TEXT)
  - `sent_at` (TIMESTAMP)
  - `is_read` (BOOLEAN)

#### 3. Service Layer
- **File**: [ChatService.java](backend/src/main/java/com/usc/rideshare/service/ChatService.java)
- **Features**:
  - Send messages (only in CONFIRMED matches)
  - Retrieve chat history
  - Mark messages as read
  - Get unread message count
  - Validate user permissions

#### 4. Controller
- **File**: [ChatController.java](backend/src/main/java/com/usc/rideshare/controller/ChatController.java)
- **WebSocket Endpoint**: `/app/chat.send` (send messages)
- **REST Endpoints**:
  - `GET /api/chat/match/{matchId}?userId={userId}` - Get chat history
  - `PUT /api/chat/match/{matchId}/read?userId={userId}` - Mark as read
  - `GET /api/chat/unread?userId={userId}` - Get unread count

### Frontend Components

#### 1. WebSocket Service
- **File**: [frontend/src/services/chatService.js](frontend/src/services/chatService.js)
- **Features**:
  - Establish WebSocket connection with auto-reconnect
  - Subscribe to match-specific topics
  - Send/receive real-time messages
  - Connection status tracking

#### 2. Chat UI Component
- **File**: [frontend/src/components/ChatWindow.jsx](frontend/src/components/ChatWindow.jsx)
- **Features**:
  - Real-time message display
  - Auto-scroll to latest message
  - Connection status indicator
  - Message read receipts
  - Responsive design

#### 3. Pages
- **Chat Page**: [frontend/src/pages/Chat.jsx](frontend/src/pages/Chat.jsx) - Dedicated chat interface
- **My Matches**: [frontend/src/pages/MyMatches.jsx](frontend/src/pages/MyMatches.jsx) - View all matches with chat buttons

## Setup Instructions

### Step 1: Database Migration

Run the SQL migration script in your Supabase SQL editor:

```bash
# File location
backend/sql/create-messages-table.sql
```

This creates:
- `messages` table
- Required indexes for performance
- Foreign key constraints

### Step 2: Backend Setup

1. **Install Dependencies** (already added to pom.xml):
   ```bash
   cd backend
   mvn clean install
   ```

2. **No additional configuration needed** - WebSocket auto-configures on startup

3. **Start the backend**:
   ```bash
   mvn spring-boot:run
   ```

### Step 3: Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

   This installs:
   - `@stomp/stompjs` v7.0.0 - STOMP client library
   - `sockjs-client` v1.6.1 - WebSocket fallback

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

## How to Use

### For Users

1. **Create or Find a Match**:
   - Go to "Find Match" and create a ride
   - When matched with another user, the match status becomes "CONFIRMED"

2. **Access Chat**:
   - Click "My Matches" in the header
   - Find your confirmed match
   - Click "💬 Open Chat" button

3. **Send Messages**:
   - Type your message in the input field
   - Press "Send" or hit Enter
   - Messages appear instantly for both users

### For Developers

#### Sending Messages via WebSocket

```javascript
import chatService from '../services/chatService';

// Connect to WebSocket
chatService.connect(
  () => console.log('Connected'),
  (error) => console.error('Error', error)
);

// Subscribe to a match
chatService.subscribeToMatch(matchId, (message) => {
  console.log('New message:', message);
});

// Send a message
chatService.sendMessage({
  matchId: 'uuid-here',
  senderId: 'user-uuid',
  content: 'Hello!'
});
```

#### Fetching Chat History via REST

```javascript
import api from '../services/api';

const messages = await api.get(`/chat/match/${matchId}`, {
  params: { userId: currentUserId }
});
```

## Multithreading & Networking Features

### Multithreading

1. **Spring WebSocket Thread Pool**:
   - Spring Boot automatically manages thread pools for WebSocket connections
   - Each client connection runs on a separate thread
   - Message handling is asynchronous and non-blocking

2. **Message Broadcasting**:
   - Uses `SimpMessagingTemplate` for concurrent message delivery
   - Multiple users can send/receive messages simultaneously
   - Thread-safe message queue management

### Networking

1. **WebSocket Protocol**:
   - Full-duplex communication channel
   - Persistent TCP connection (HTTP upgrade)
   - Low latency real-time messaging

2. **STOMP Protocol**:
   - Simple Text Oriented Messaging Protocol
   - Pub/Sub pattern for scalable messaging
   - Topic-based routing (`/topic/match/{matchId}`)

3. **Connection Features**:
   - Auto-reconnect on connection loss (5-second delay)
   - Heartbeat mechanism (4-second intervals)
   - SockJS fallback for environments blocking WebSocket

## Security

1. **Authorization**:
   - Only users in a match can send/receive messages
   - Backend validates user permissions on every message
   - Only CONFIRMED matches can chat

2. **Data Validation**:
   - Message content cannot be empty
   - Match ID and Sender ID required
   - User must be part of the match

3. **JWT Authentication**:
   - All REST endpoints require valid JWT token
   - Token validated via existing authentication filter

## Message Flow

### Sending a Message

```
User A (Frontend)
  ↓
1. ChatWindow.jsx - User types message
  ↓
2. chatService.js - Send via WebSocket: /app/chat.send
  ↓
3. ChatController.java - @MessageMapping handles message
  ↓
4. ChatService.java - Validates user, saves to database
  ↓
5. SimpMessagingTemplate - Broadcasts to: /topic/match/{matchId}
  ↓
6. chatService.js (both users) - Receives message
  ↓
7. ChatWindow.jsx - Updates UI in real-time
```

### Loading Chat History

```
User (Frontend)
  ↓
1. Chat.jsx - Page loads
  ↓
2. api.get() - REST: GET /api/chat/match/{matchId}
  ↓
3. ChatController.java - Validates user access
  ↓
4. ChatService.java - Fetches from database
  ↓
5. MessageRepository.java - Query with ordering
  ↓
6. Returns ChatMessageResponse[] - All messages ordered by time
```

## Testing the Feature

### Manual Testing Steps

1. **Create Two User Accounts**:
   - Sign in with two different @usc.edu accounts
   - Use two different browsers or incognito mode

2. **Create a Match**:
   - User A: Post a ride to LAX at 3:00 PM
   - User B: Post a ride to LAX at 3:05 PM
   - Both users should see each other in potential matches
   - User B joins User A's ride
   - Match status becomes CONFIRMED

3. **Open Chat**:
   - Both users navigate to "My Matches"
   - Click "Open Chat" on the confirmed match

4. **Test Real-time Messaging**:
   - User A sends: "Hi, where should we meet?"
   - User B sees message instantly
   - User B replies: "Let's meet at Tommy Trojan"
   - User A sees reply instantly

5. **Verify Persistence**:
   - Refresh the page
   - Chat history should load automatically
   - All messages preserved in correct order

## Troubleshooting

### WebSocket Connection Issues

**Problem**: "WebSocket not connected" error

**Solutions**:
1. Check backend is running: `http://localhost:8080/ws`
2. Verify CORS settings allow WebSocket upgrade
3. Check browser console for connection errors
4. Ensure no firewall blocking WebSocket

### Messages Not Appearing

**Problem**: Messages sent but not received

**Solutions**:
1. Verify match status is CONFIRMED
2. Check both users are subscribed to same matchId
3. Inspect network tab for WebSocket frames
4. Check backend logs for errors

### Database Errors

**Problem**: "Match not found" or permission errors

**Solutions**:
1. Verify messages table exists: `SELECT * FROM messages LIMIT 1;`
2. Check foreign key constraints on match_id and sender_id
3. Ensure user is part of the match in database

## Performance Considerations

1. **Message Pagination**: Consider implementing pagination for long chat histories
2. **Image Support**: Currently text-only, can extend to support images
3. **Typing Indicators**: Can add real-time typing status
4. **Message Delivery Status**: Can implement delivered/read receipts
5. **Push Notifications**: Can integrate with browser notifications API

## Future Enhancements

- [ ] File/image sharing in chat
- [ ] Typing indicators
- [ ] Message delivery confirmations
- [ ] Push notifications for new messages
- [ ] Chat search functionality
- [ ] Message reactions (emoji)
- [ ] Voice messages
- [ ] Video call integration

## API Reference

### WebSocket Endpoints

| Destination | Type | Description |
|------------|------|-------------|
| `/ws` | Connect | Initial WebSocket connection endpoint |
| `/app/chat.send` | Send | Send a message (client → server) |
| `/topic/match/{matchId}` | Subscribe | Receive messages for a match (server → client) |

### REST Endpoints

| Method | Endpoint | Parameters | Description |
|--------|----------|------------|-------------|
| GET | `/api/chat/match/{matchId}` | `userId` | Get all messages for a match |
| PUT | `/api/chat/match/{matchId}/read` | `userId` | Mark messages as read |
| GET | `/api/chat/unread` | `userId` | Get unread message count |

## Technical Stack Summary

**Backend**:
- Spring Boot WebSocket (`spring-boot-starter-websocket`)
- STOMP messaging protocol
- PostgreSQL for message persistence
- JPA/Hibernate for ORM

**Frontend**:
- React 19.2.0
- STOMP.js client (`@stomp/stompjs`)
- SockJS client (`sockjs-client`)
- Axios for REST API calls

---

**Implementation Date**: December 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
