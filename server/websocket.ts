import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { parse } from "url";
import { storage } from "./storage";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  conversationId?: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: "/ws",
      verifyClient: async (info, callback) => {
        try {
          const { query } = parse(info.req.url || "", true);
          const userId = query.userId as string;
          const conversationId = query.conversationId as string;

          if (!userId || !conversationId) {
            callback(false, 400, "Missing userId or conversationId");
            return;
          }

          // Verify user exists
          const user = await storage.getUser(userId);
          if (!user) {
            callback(false, 401, "Invalid user");
            return;
          }

          // Verify conversation exists and user is a member
          const conversation = await storage.getConversationById(conversationId);
          if (!conversation) {
            callback(false, 404, "Conversation not found");
            return;
          }

          if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
            callback(false, 403, "Not authorized for this conversation");
            return;
          }

          callback(true);
        } catch (error) {
          console.error("WebSocket verification error:", error);
          callback(false, 500, "Internal server error");
        }
      }
    });

    this.wss.on("connection", (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      const { query } = parse(req.url || "", true);
      const userId = query.userId as string;
      const conversationId = query.conversationId as string;

      ws.userId = userId;
      ws.conversationId = conversationId;

      // Add client to conversation room
      if (!this.clients.has(conversationId)) {
        this.clients.set(conversationId, new Set());
      }
      this.clients.get(conversationId)!.add(ws);

      console.log(`WebSocket connected: User ${userId} joined conversation ${conversationId}`);

      ws.on("close", () => {
        this.removeClient(ws);
        console.log(`WebSocket disconnected: User ${userId} left conversation ${conversationId}`);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.removeClient(ws);
      });
    });
  }

  private removeClient(ws: AuthenticatedWebSocket) {
    if (ws.conversationId && this.clients.has(ws.conversationId)) {
      this.clients.get(ws.conversationId)!.delete(ws);
      if (this.clients.get(ws.conversationId)!.size === 0) {
        this.clients.delete(ws.conversationId);
      }
    }
  }

  // Broadcast a new message to all clients in a conversation
  broadcastMessage(conversationId: string, message: any) {
    const clients = this.clients.get(conversationId);
    if (!clients) return;

    const messageData = JSON.stringify({
      type: "new_message",
      data: message,
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageData);
      }
    });
  }

  // Notify conversation update (e.g., last message timestamp change)
  notifyConversationUpdate(conversationId: string, update: any) {
    const clients = this.clients.get(conversationId);
    if (!clients) return;

    const updateData = JSON.stringify({
      type: "conversation_update",
      data: update,
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(updateData);
      }
    });
  }
}

let wsManager: WebSocketManager | null = null;

export function setupWebSocket(server: Server): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(server);
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}
