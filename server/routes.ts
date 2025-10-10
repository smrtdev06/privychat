import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMessageSchema, insertConversationSchema, insertSubscriptionGiftSchema, insertUserSchema, users as usersTable } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { randomUUID } from "crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// Rate limiting store for brute-force protection
interface AttemptsStore {
  [key: string]: {
    attempts: number;
    lastAttempt: number;
    lockedUntil?: number;
  };
}

const bruteForceStore: AttemptsStore = {};

// Validation schemas
const numericPasswordSchema = z.object({
  numericPassword: z.string().regex(/^\d+$/, "Must be numeric")
});

const userCodeSchema = z.object({
  userCode: z.string().min(1, "User code is required")
});

const mediaUrlSchema = z.object({
  mediaUrl: z.string().url("Valid URL required")
});

const upgradeCodeSchema = z.object({
  upgradeCode: z.string().min(1, "Upgrade code is required")
});

const phoneSchema = z.object({
  phone: z.string().min(1, "Phone number is required")
});

const smsCodeSchema = z.object({
  code: z.string().min(1, "Verification code is required")
});

// Brute-force protection functions
function checkBruteForceProtection(userId: string): { allowed: boolean; delayMs?: number } {
  const key = `brute-force:${userId}`;
  const record = bruteForceStore[key];
  
  if (!record) {
    return { allowed: true };
  }
  
  const now = Date.now();
  
  // Check if user is currently locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    return { 
      allowed: false, 
      delayMs: record.lockedUntil - now 
    };
  }
  
  // Reset if enough time has passed (1 hour)
  if (now - record.lastAttempt > 60 * 60 * 1000) {
    delete bruteForceStore[key];
    return { allowed: true };
  }
  
  return { allowed: true };
}

function recordFailedAttempt(userId: string): void {
  const key = `brute-force:${userId}`;
  const now = Date.now();
  const record = bruteForceStore[key] || { attempts: 0, lastAttempt: 0 };
  
  record.attempts += 1;
  record.lastAttempt = now;
  
  // Progressive lockout: 3 attempts = 1 min, 6 attempts = 5 min, 10+ attempts = 30 min
  if (record.attempts >= 10) {
    record.lockedUntil = now + (30 * 60 * 1000); // 30 minutes
  } else if (record.attempts >= 6) {
    record.lockedUntil = now + (5 * 60 * 1000); // 5 minutes
  } else if (record.attempts >= 3) {
    record.lockedUntil = now + (1 * 60 * 1000); // 1 minute
  }
  
  bruteForceStore[key] = record;
}

function recordSuccessfulAttempt(userId: string): void {
  const key = `brute-force:${userId}`;
  delete bruteForceStore[key];
}

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
      const validatedData = numericPasswordSchema.parse(req.body);
      const { numericPassword } = validatedData;

      await storage.updateUser(req.user!.id, { 
        numericPassword,
        isSetupComplete: true 
      });

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error setting numeric password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/verify-numeric-password", async (req, res) => {
    try {
      console.log("Received numeric password request:", {
        body: req.body,
        numericPassword: req.body?.numericPassword,
        type: typeof req.body?.numericPassword,
        length: req.body?.numericPassword?.length
      });
      
      const validatedData = numericPasswordSchema.parse(req.body);
      const { numericPassword } = validatedData;
      
      // Find user by numeric password (for calculator disguise access)
      const users = await db.select().from(usersTable).where(eq(usersTable.numericPassword, numericPassword));
      const user = users[0];
      
      if (!user) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Check brute-force protection for this user
      const bruteForceCheck = checkBruteForceProtection(user.id);
      if (!bruteForceCheck.allowed) {
        const delaySeconds = Math.ceil((bruteForceCheck.delayMs || 0) / 1000);
        return res.status(429).json({ 
          error: "Too many failed attempts. Please try again later.",
          retryAfter: delaySeconds
        });
      }

      // Authenticate the user (create session)
      req.login(user, (err) => {
        if (err) {
          console.error("Error creating session:", err);
          recordFailedAttempt(user.id);
          return res.status(500).json({ error: "Internal server error" });
        }
        
        recordSuccessfulAttempt(user.id);
        res.json({ success: true });
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
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
      const validatedData = userCodeSchema.parse(req.body);
      const { userCode } = validatedData;
      
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

      // Return conversation with otherUser info (same format as GET /api/conversations)
      res.json({
        ...conversation,
        otherUser: otherUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
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

      // Verify conversation access first
      const conversation = await storage.getConversationById(messageData.conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (conversation.user1Id !== req.user!.id && conversation.user2Id !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if user can send message (rate limiting - checks if either user has premium)
      const canSend = await storage.canUserSendMessage(req.user!.id, messageData.conversationId);
      if (!canSend) {
        return res.status(429).json({ error: "Daily message limit reached. Upgrade to premium for unlimited messages." });
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
      const validatedData = mediaUrlSchema.parse(req.body);
      const { mediaUrl } = validatedData;

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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
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
      const validatedData = upgradeCodeSchema.parse(req.body);
      const { upgradeCode } = validatedData;

      const success = await storage.redeemSubscriptionGift(upgradeCode, req.user!.id);
      if (!success) {
        return res.status(400).json({ error: "Invalid or expired upgrade code" });
      }

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error redeeming upgrade code:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SMS verification (mock endpoint)
  app.post("/api/sms/send-verification", async (req, res) => {
    try {
      const validatedData = phoneSchema.parse(req.body);
      const { phone } = validatedData;
      // Mock SMS sending - in real app would integrate with Twilio/similar
      console.log(`Mock SMS verification code sent to ${phone}: 123456`);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error sending SMS verification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/sms/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = smsCodeSchema.parse(req.body);
      const { code } = validatedData;
      // Mock verification - in real app would verify against sent code
      if (code === "123456") {
        await storage.updateUser(req.user!.id, { isPhoneVerified: true });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid verification code" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error verifying SMS code:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
