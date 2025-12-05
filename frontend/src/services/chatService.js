import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class ChatService {
  constructor() {
    this.stompClient = null;
    this.subscriptions = new Map();
  }

  connect(onConnected, onError) {
    // Don't reconnect if already connected
    if (this.stompClient && this.stompClient.connected) {
      console.log('Already connected');
      if (onConnected) onConnected();
      return;
    }

    const wsUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    console.log('Connecting to WebSocket at:', `${wsUrl}/ws`);

    const socket = new SockJS(`${wsUrl}/ws`);

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected successfully');
        if (onConnected) onConnected();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        if (onError) onError(frame);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      }
    });

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.clear();
      this.stompClient.deactivate();
      console.log('WebSocket disconnected');
    }
  }

  subscribeToMatch(matchId, onMessageReceived) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const subscription = this.stompClient.subscribe(
      `/topic/match/${matchId}`,
      (message) => {
        const chatMessage = JSON.parse(message.body);
        onMessageReceived(chatMessage);
      }
    );

    this.subscriptions.set(matchId, subscription);
    return subscription;
  }

  unsubscribeFromMatch(matchId) {
    const subscription = this.subscriptions.get(matchId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(matchId);
    }
  }

  sendMessage(chatMessage) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(chatMessage)
    });
  }

  subscribeToPresence(matchId, onPresenceUpdate) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const subscription = this.stompClient.subscribe(
      `/topic/match/${matchId}/presence`,
      (message) => {
        const presenceUpdate = JSON.parse(message.body);
        onPresenceUpdate(presenceUpdate);
      }
    );

    this.subscriptions.set(`${matchId}-presence`, subscription);
    return subscription;
  }

  sendPresence(matchId, userId, online) {
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    this.stompClient.publish({
      destination: '/app/chat.presence',
      body: JSON.stringify({
        matchId,
        userId,
        online
      })
    });
  }

  isConnected() {
    return this.stompClient && this.stompClient.connected;
  }
}

const chatService = new ChatService();
export default chatService;
