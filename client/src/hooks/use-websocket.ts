import { useEffect, useRef, useCallback } from "react";

interface WebSocketMessage {
  type: "new_message" | "conversation_update";
  data: any;
}

export function useWebSocket(
  conversationId: string | undefined,
  userId: string | undefined,
  onMessage: (message: any) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(true);

  const connect = useCallback(() => {
    if (!conversationId || !userId || !isActiveRef.current) return;

    // Determine WebSocket protocol based on current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}&conversationId=${conversationId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === "new_message") {
            onMessage(message.data);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        // Only attempt to reconnect if component is still active
        if (isActiveRef.current) {
          console.log("Reconnecting...");
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }, [conversationId, userId, onMessage]);

  useEffect(() => {
    isActiveRef.current = true;
    connect();

    return () => {
      // Mark as inactive to prevent reconnections
      isActiveRef.current = false;
      
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return wsRef.current;
}
