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

    // Detect if running in Capacitor mobile app
    const isCapacitor = window.location.protocol === "capacitor:" || 
                        window.location.protocol === "ionic:" ||
                        (window as any).Capacitor !== undefined;

    let wsUrl: string;
    
    if (isCapacitor) {
      // In Capacitor bridge mode, use the production server URL
      const serverUrl = import.meta.env.VITE_SERVER_URL || "https://622e822f-d1a1-4fd9-828a-42c12b885a85-00-1hd0vg3rilq4.worf.replit.dev";
      
      // Respect the original protocol: http→ws, https→wss
      let wsProtocol = 'wss';
      let cleanUrl = serverUrl;
      
      if (serverUrl.startsWith('ws://') || serverUrl.startsWith('wss://')) {
        // Already has WebSocket protocol
        wsUrl = `${serverUrl}/ws?userId=${userId}&conversationId=${conversationId}`;
      } else {
        // Convert HTTP to WebSocket protocol
        if (serverUrl.startsWith('http://')) {
          wsProtocol = 'ws';
          cleanUrl = serverUrl.replace(/^http:\/\//, '');
        } else if (serverUrl.startsWith('https://')) {
          wsProtocol = 'wss';
          cleanUrl = serverUrl.replace(/^https:\/\//, '');
        }
        
        wsUrl = `${wsProtocol}://${cleanUrl}/ws?userId=${userId}&conversationId=${conversationId}`;
      }
      
      console.log("[Capacitor] WebSocket URL:", wsUrl);
    } else {
      // In browser, use current location
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}&conversationId=${conversationId}`;
    }

    console.log("WebSocket connecting to:", wsUrl);

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
