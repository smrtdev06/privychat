import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMessageSchema, insertConversationSchema, insertSubscriptionGiftSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // User routes
  app.get("/api/user-by-code/:userCode", async (req, res) => {
    try {
      const user = await storage.getUserByUserCode(req.params.userCode);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return only public info
      res.json({
        id: user.id,
        userCode: user.userCode,
        username: user.username,
      });
    } catch (error) {
      console.error("Error finding user by code:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/setup-numeric-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { numericPassword } = req.body;
      if (!numericPassword || !/^\d+$/.test(numericPassword)) {
        return res.status(400).json({ error: "Numeric password required" });
      }

      await storage.updateUser(req.user!.id, { 
        numericPassword,
        isSetupComplete: true 
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error setting numeric password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/verify-numeric-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { numericPassword } = req.body;
      const user = await storage.getUser(req.user!.id);
      
      if (!user || user.numericPassword !== numericPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error verifying numeric password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Conversation routes
  app.get("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const conversations = await storage.getUserConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { userCode } = req.body;
      
      // Find user by code
      const otherUser = await storage.getUserByUserCode(userCode);
      if (!otherUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (otherUser.id === req.user!.id) {
        return res.status(400).json({ error: "Cannot start conversation with yourself" });
      }

      // Check if conversation already exists
      let conversation = await storage.getConversation(req.user!.id, otherUser.id);
      
      if (!conversation) {
        conversation = await storage.createConversation({
          user1Id: req.user!.id,
          user2Id: otherUser.id,
        });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const conversation = await storage.getConversationById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Check if user is part of conversation
      if (conversation.user1Id !== req.user!.id && conversation.user2Id !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getConversationMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Message routes
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const messageData = insertMessageSchema.parse(req.body);

      // Check if user can send message (rate limiting)
      const canSend = await storage.canUserSendMessage(req.user!.id);
      if (!canSend) {
        return res.status(429).json({ error: "Daily message limit reached. Upgrade to premium for unlimited messages." });
      }

      // Verify conversation access
      const conversation = await storage.getConversationById(messageData.conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (conversation.user1Id !== req.user!.id && conversation.user2Id !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Create message
      const message = await storage.createMessage({
        ...messageData,
        senderId: req.user!.id,
      });

      // Increment daily message count for free users
      const user = await storage.getUser(req.user!.id);
      if (user && user.subscriptionType === "free") {
        await storage.incrementDailyMessageCount(req.user!.id);
      }

      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage routes for media
  app.get("/objects/:objectPath(*)", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: req.user!.id,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/media", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { mediaUrl } = req.body;
      if (!mediaUrl) {
        return res.status(400).json({ error: "Media URL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        mediaUrl,
        {
          owner: req.user!.id,
          visibility: "private",
        }
      );

      res.json({ objectPath });
    } catch (error) {
      console.error("Error setting media ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Subscription and gift routes
  app.post("/api/subscription/upgrade", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      // Mock payment processing - in real app would integrate with Stripe
      const subscriptionExpiresAt = new Date();
      subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1);

      await storage.updateUser(req.user!.id, {
        subscriptionType: "premium",
        subscriptionExpiresAt,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/subscription/gift", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const giftData = insertSubscriptionGiftSchema.parse(req.body);
      const upgradeCode = randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12);
      
      const gift = await storage.createSubscriptionGift({
        ...giftData,
        buyerId: req.user!.id,
        upgradeCode,
      });

      // In real app, would send email to recipient
      console.log(`Gift subscription created with code: ${upgradeCode} for ${giftData.recipientEmail}`);

      res.json({ upgradeCode });
    } catch (error) {
      console.error("Error creating gift subscription:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/subscription/redeem", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { upgradeCode } = req.body;
      if (!upgradeCode) {
        return res.status(400).json({ error: "Upgrade code is required" });
      }

      const success = await storage.redeemSubscriptionGift(upgradeCode, req.user!.id);
      if (!success) {
        return res.status(400).json({ error: "Invalid or expired upgrade code" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error redeeming upgrade code:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SMS verification (mock endpoint)
  app.post("/api/sms/send-verification", async (req, res) => {
    try {
      const { phone } = req.body;
      // Mock SMS sending - in real app would integrate with Twilio/similar
      console.log(`Mock SMS verification code sent to ${phone}: 123456`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending SMS verification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/sms/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { code } = req.body;
      // Mock verification - in real app would verify against sent code
      if (code === "123456") {
        await storage.updateUser(req.user!.id, { isPhoneVerified: true });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid verification code" });
      }
    } catch (error) {
      console.error("Error verifying SMS code:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
