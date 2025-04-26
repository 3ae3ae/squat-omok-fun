
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface RoomInfo {
  roomId: string;
  roomName: string;
  masterId: string;
  playerCount: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (
  url: string | null, 
  guestId: string | null,
  onMessage?: (msg: WebSocketMessage) => void
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Connect to WebSocket
  useEffect(() => {
    if (!url || !guestId) return;

    const connectWebSocket = () => {
      const ws = new WebSocket(`${url}?guestId=${guestId}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        
        // Try to reconnect if connection was lost unexpectedly
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, 2000 * (reconnectAttempts + 1)); // Exponential backoff
        } else {
          toast.error("Failed to connect to server. Please refresh the page.");
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error("Connection error. Trying to reconnect...");
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      setSocket(ws);
    };

    connectWebSocket();

    // Cleanup
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [url, guestId, reconnectAttempts, onMessage]);

  // Send message through WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    sendMessage,
  };
};
