import { useState, useEffect, useRef } from 'react';
import chatService from '../services/chatService';
import api from '../services/api';

function ChatWindow({ matchId, currentUserId, otherUserName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const presenceCheckInterval = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let isSubscribed = true;

    const loadChatHistory = async () => {
      try {
        const response = await api.get(`/api/chat/match/${matchId}`, {
          params: { userId: currentUserId }
        });
        if (isSubscribed) {
          setMessages(response.data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setLoading(false);
      }
    };

    const initializeWebSocket = () => {
      console.log('[ChatWindow] Initializing WebSocket connection...');
      chatService.connect(
        () => {
          console.log('[ChatWindow] WebSocket connected successfully!');
          setIsConnected(true);

          chatService.subscribeToMatch(matchId, (message) => {
            if (isSubscribed) {
              setMessages(prev => [...prev, message]);

              if (message.senderId !== currentUserId) {
                api.put(`/api/chat/match/${matchId}/read`, null, {
                  params: { userId: currentUserId }
                }).catch(err => console.error('Error marking as read:', err));
              }
            }
          });

          // Subscribe to presence updates for this match
          chatService.subscribeToPresence(matchId, (presenceUpdate) => {
            if (isSubscribed && presenceUpdate.userId !== currentUserId) {
              setOtherUserOnline(presenceUpdate.online);
            }
          });

          // Send presence notification that we're online
          chatService.sendPresence(matchId, currentUserId, true);

          // Periodically send heartbeat more frequently
          presenceCheckInterval.current = setInterval(() => {
            chatService.sendPresence(matchId, currentUserId, true);
          }, 10000); // Every 10 seconds for more responsive updates
        },
        (error) => {
          console.error('[ChatWindow] WebSocket connection error:', error);
          console.error('[ChatWindow] Error details:', {
            message: error?.message,
            type: error?.type,
            error
          });
          setIsConnected(false);
        }
      );
    };

    loadChatHistory();
    initializeWebSocket();

    return () => {
      isSubscribed = false;
      // Send offline presence before disconnecting
      if (isConnected) {
        chatService.sendPresence(matchId, currentUserId, false);
      }
      chatService.unsubscribeFromMatch(matchId);
      if (presenceCheckInterval.current) {
        clearInterval(presenceCheckInterval.current);
      }
    };
  }, [matchId, currentUserId]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    // Allow sending even if not connected - messages will queue
    if (isConnected) {
      const chatMessage = {
        matchId: matchId,
        senderId: currentUserId,
        content: newMessage.trim()
      };

      chatService.sendMessage(chatMessage);
      setNewMessage('');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="bg-red-600 text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold">Chat with {otherUserName}</h3>
        <div className="text-sm flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${otherUserOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
            {otherUserOnline ? 'Online' : 'Offline'}
          </span>
          {!isConnected && (
            <span className="text-yellow-200 text-xs">
              (Reconnecting...)
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.senderId === currentUserId;
            return (
              <div
                key={msg.messageId}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className="text-sm break-words">{msg.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-red-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(msg.sentAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Reconnecting..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
        {!otherUserOnline && isConnected && (
          <p className="text-xs text-gray-500 mt-2">
            {otherUserName} is offline. They'll see your message when they come back.
          </p>
        )}
      </form>
    </div>
  );
}

export default ChatWindow;
