import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMessageSchema, insertConversationSchema, insertSubscriptionGiftSchema, insertUserSchema, users as usersTable, mobileSubscriptions } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { randomUUID } from "crypto";
import { OAuth2Client } from "google-auth-library";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { setupWebSocket } from "./websocket";
import { testSendGridSetup, sendEmail } from "./email";
import { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail, isTokenExpired } from "./email-verification";
import { generatePasswordResetToken, sendPasswordResetEmail, isTokenExpired as isResetTokenExpired } from "./password-reset";
import { hashPassword } from "./auth";
import {
  validateGooglePlayPurchase,
  validateAppleAppStorePurchase,
  upsertMobileSubscription,
  getActiveMobileSubscription,
  syncUserSubscriptionStatus,
  cancelMobileSubscription,
} from "./mobile-subscriptions";

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
      console.log("Received numeric password request - length:", req.body?.numericPassword?.length);
      
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
        
        console.log("✅ Session created successfully - user authenticated:", req.isAuthenticated());
        
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
      console.log(`[DEBUG] Checking conversation between user ${req.user!.id} and ${otherUser.id}`);
      let conversation = await storage.getConversation(req.user!.id, otherUser.id);
      
      if (!conversation) {
        console.log(`[DEBUG] No existing conversation found, creating new one`);
        conversation = await storage.createConversation({
          user1Id: req.user!.id,
          user2Id: otherUser.id,
        });
        console.log(`[DEBUG] Created conversation ${conversation.id}`);
      } else {
        console.log(`[DEBUG] Found existing conversation ${conversation.id}`);
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

      // Broadcast new message via WebSocket
      const wsManager = app.get("wsManager");
      if (wsManager) {
        wsManager.broadcastMessage(messageData.conversationId, message);
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

  // Mobile subscription routes
  app.post("/api/mobile-subscription/validate-android", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const schema = z.object({
        packageName: z.string(),
        productId: z.string(),
        purchaseToken: z.string(),
      });
      
      const { packageName, productId, purchaseToken } = schema.parse(req.body);

      // Validate purchase with Google Play
      const validation = await validateGooglePlayPurchase(packageName, productId, purchaseToken);

      if (!validation.isValid) {
        return res.status(400).json({ error: "Invalid purchase token" });
      }

      // Create/update subscription in database
      const subscription = await upsertMobileSubscription(req.user!.id, "android", {
        productId,
        purchaseToken,
        purchaseDate: validation.purchaseDate || new Date(),
        expiryDate: validation.expiryDate || new Date(),
        autoRenewing: validation.autoRenewing || false,
      });

      // Sync user's subscription status
      await syncUserSubscriptionStatus(req.user!.id);

      res.json({ success: true, subscription });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error validating Android purchase:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/mobile-subscription/validate-ios", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const schema = z.object({
        receiptData: z.string(),
        transactionId: z.string(),
        productId: z.string(),
      });
      
      const { receiptData, transactionId, productId } = schema.parse(req.body);

      // Validate receipt with App Store
      const validation = await validateAppleAppStorePurchase(receiptData, transactionId);

      if (!validation.isValid) {
        return res.status(400).json({ error: "Invalid receipt" });
      }

      // Create/update subscription in database
      const subscription = await upsertMobileSubscription(req.user!.id, "ios", {
        productId,
        originalTransactionId: transactionId,
        latestReceiptInfo: validation.latestReceiptInfo,
        purchaseDate: validation.purchaseDate || new Date(),
        expiryDate: validation.expiryDate || new Date(),
        autoRenewing: validation.autoRenewing || false,
      });

      // Sync user's subscription status
      await syncUserSubscriptionStatus(req.user!.id);

      res.json({ success: true, subscription });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error validating iOS purchase:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/mobile-subscription/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const subscription = await getActiveMobileSubscription(req.user!.id);
      res.json({ subscription });
    } catch (error) {
      console.error("Error getting subscription status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Promo code redemption endpoints
  app.post("/api/promo-code/log-redemption", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const schema = z.object({
        platform: z.enum(["ios", "android"]),
        promoCode: z.string().min(1),
      });
      
      const { platform, promoCode } = schema.parse(req.body);
      
      const { logPromoCodeRedemption } = await import("./promo-code");
      const redemptionId = await logPromoCodeRedemption(req.user!.id, platform, promoCode);
      
      res.json({ success: true, redemptionId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error logging promo code redemption:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/promo-code/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { getUserRedemptions } = await import("./promo-code");
      const redemptions = await getUserRedemptions(req.user!.id);
      res.json({ redemptions });
    } catch (error) {
      console.error("Error getting redemption history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/promo-code/generate-url", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const schema = z.object({
        platform: z.enum(["ios", "android"]),
        promoCode: z.string().min(1),
        appId: z.string().optional(), // Required for iOS
      });
      
      const { platform, promoCode, appId } = schema.parse(req.body);
      const { generateGooglePlayRedeemUrl, generateAppleRedeemUrl } = await import("./promo-code");
      
      let url: string;
      if (platform === "android") {
        url = generateGooglePlayRedeemUrl(promoCode);
      } else {
        if (!appId) {
          return res.status(400).json({ error: "appId is required for iOS" });
        }
        url = generateAppleRedeemUrl(promoCode, appId);
      }
      
      res.json({ url });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error generating redemption URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Webhook for Google Play Real-time Developer Notifications
  app.post("/api/mobile-subscription/webhook/google", async (req, res) => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`\n${"=".repeat(80)}`);
      console.log(`🔔 Google Play webhook received at ${timestamp}`);
      console.log(`${"=".repeat(80)}`);
      
      // Log raw request body for debugging
      console.log("📥 Raw request body:", JSON.stringify(req.body, null, 2));
      
      // Google sends notifications as base64-encoded JSON in message.data
      const message = req.body.message;
      if (!message || !message.data) {
        console.log("❌ Invalid webhook payload - missing message.data");
        console.log(`${"=".repeat(80)}\n`);
        return res.sendStatus(400);
      }

      const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
      const notification = JSON.parse(decodedData);
      
      console.log("📦 Decoded notification:", JSON.stringify(notification, null, 2));

      // Handle different notification types
      const notificationType = notification.subscriptionNotification?.notificationType;
      const purchaseToken = notification.subscriptionNotification?.purchaseToken;
      
      if (!purchaseToken) {
        console.log("⚠️ No purchase token in notification");
        return res.sendStatus(200);
      }
      
      // Notification type reference:
      // 1 = SUBSCRIPTION_RECOVERED
      // 2 = SUBSCRIPTION_RENEWED
      // 3 = SUBSCRIPTION_CANCELED
      // 4 = SUBSCRIPTION_PURCHASED
      // 5 = SUBSCRIPTION_ON_HOLD
      // 6 = SUBSCRIPTION_IN_GRACE_PERIOD
      // 7 = SUBSCRIPTION_RESTARTED
      // 12 = SUBSCRIPTION_REVOKED
      // 13 = SUBSCRIPTION_EXPIRED
      
      if (notificationType === 3) {
        // SUBSCRIPTION_CANCELED - User canceled, but keeps access until expiry
        console.log(`🚫 Subscription canceled: ${purchaseToken.substring(0, 20)}...`);
        
        // Find subscription by purchase token
        const subscriptions = await db
          .select()
          .from(mobileSubscriptions)
          .where(eq(mobileSubscriptions.purchaseToken, purchaseToken))
          .limit(1);
        
        if (subscriptions.length > 0) {
          const subscription = subscriptions[0];
          console.log(`   Found subscription: ${subscription.id} for user ${subscription.userId}`);
          
          // Mark as canceled BUT keep active until expiry
          // DO NOT set isActive = false yet - user keeps access until expiry date
          await db
            .update(mobileSubscriptions)
            .set({
              autoRenewing: false,  // Will not renew
              cancellationDate: new Date(),  // Record when canceled
              updatedAt: new Date()
              // NOTE: isActive stays true, user keeps premium until expiryDate
            })
            .where(eq(mobileSubscriptions.id, subscription.id));
          
          console.log(`✅ Subscription marked as canceled - user keeps access until ${subscription.expiryDate}`);
          console.log(`   autoRenewing: false, isActive: true (until expiry)`);
        } else {
          console.log(`⚠️ Subscription not found for purchase token: ${purchaseToken.substring(0, 20)}...`);
        }
      } 
      else if (notificationType === 13) {
        // SUBSCRIPTION_EXPIRED - Subscription expired, remove access
        console.log(`⏰ Subscription expired: ${purchaseToken.substring(0, 20)}...`);
        
        // Find subscription by purchase token
        const subscriptions = await db
          .select()
          .from(mobileSubscriptions)
          .where(eq(mobileSubscriptions.purchaseToken, purchaseToken))
          .limit(1);
        
        if (subscriptions.length > 0) {
          const subscription = subscriptions[0];
          console.log(`   Found subscription: ${subscription.id} for user ${subscription.userId}`);
          
          // Mark as inactive
          await db
            .update(mobileSubscriptions)
            .set({ 
              isActive: false,
              updatedAt: new Date()
            })
            .where(eq(mobileSubscriptions.id, subscription.id));
          
          // Downgrade user to free plan
          await syncUserSubscriptionStatus(subscription.userId);
          
          console.log(`✅ Subscription expired and user downgraded to free plan`);
        } else {
          console.log(`⚠️ Subscription not found for purchase token: ${purchaseToken.substring(0, 20)}...`);
        }
      }
      else if (notificationType === 2) {
        // SUBSCRIPTION_RENEWED - Update expiry date
        console.log(`🔄 Subscription renewed: ${purchaseToken.substring(0, 20)}...`);
        
        // Find subscription and re-validate with Google Play API to get new expiry
        const subscriptions = await db
          .select()
          .from(mobileSubscriptions)
          .where(eq(mobileSubscriptions.purchaseToken, purchaseToken))
          .limit(1);
        
        if (subscriptions.length > 0) {
          const subscription = subscriptions[0];
          console.log(`   Subscription renewed for user ${subscription.userId} - re-validating with Google Play API`);
          
          // Re-validate to get updated expiry date
          const validation = await validateGooglePlayPurchase(
            notification.packageName || "com.newhomepage.privychat",
            subscription.productId,
            purchaseToken
          );
          
          if (validation.isValid && validation.expiryDate) {
            await db
              .update(mobileSubscriptions)
              .set({
                expiryDate: validation.expiryDate,
                autoRenewing: validation.autoRenewing || false,
                isActive: true,
                lastVerifiedAt: new Date(),
                updatedAt: new Date()
              })
              .where(eq(mobileSubscriptions.id, subscription.id));
            
            await syncUserSubscriptionStatus(subscription.userId);
            console.log(`✅ Subscription renewed - new expiry: ${validation.expiryDate}`);
          }
        }
      }
      else if (notificationType === 12) {
        // SUBSCRIPTION_REVOKED - Immediate access removal (refund/chargeback)
        console.log(`⛔ Subscription revoked: ${purchaseToken.substring(0, 20)}...`);
        
        const subscriptions = await db
          .select()
          .from(mobileSubscriptions)
          .where(eq(mobileSubscriptions.purchaseToken, purchaseToken))
          .limit(1);
        
        if (subscriptions.length > 0) {
          const subscription = subscriptions[0];
          
          // Immediately revoke access
          await db
            .update(mobileSubscriptions)
            .set({ 
              isActive: false,
              autoRenewing: false,
              cancellationDate: new Date(),
              updatedAt: new Date()
            })
            .where(eq(mobileSubscriptions.id, subscription.id));
          
          // Immediately downgrade user
          await syncUserSubscriptionStatus(subscription.userId);
          
          console.log(`✅ Subscription revoked - user immediately downgraded`);
        }
      }
      else {
        console.log(`ℹ️ Notification type ${notificationType} - no action required`);
        console.log("   This might be a new notification type we haven't implemented yet");
        console.log("   Full notification data logged above for investigation");
      }

      console.log(`✅ Webhook processed successfully`);
      console.log(`${"=".repeat(80)}\n`);
      res.sendStatus(200);
    } catch (error) {
      console.error("❌ Error processing Google webhook:", error);
      res.sendStatus(500);
    }
  });

  // Webhook for Apple App Store Server Notifications
  app.post("/api/mobile-subscription/webhook/apple", async (req, res) => {
    try {
      const notification = req.body;
      const notificationType = notification.notification_type;

      // Handle different notification types
      if (notificationType === 'DID_RENEW' || notificationType === 'DID_CHANGE_RENEWAL_STATUS') {
        // Update subscription status
        const transactionId = notification.unified_receipt?.latest_receipt_info?.[0]?.original_transaction_id;
        // TODO: Implement subscription update logic
        console.log("Subscription updated:", transactionId);
      } else if (notificationType === 'CANCEL') {
        // Handle cancellation
        const transactionId = notification.unified_receipt?.latest_receipt_info?.[0]?.original_transaction_id;
        // TODO: Implement cancellation logic
        console.log("Subscription cancelled:", transactionId);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("Error processing Apple webhook:", error);
      res.sendStatus(500);
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

  // Send email verification
  app.post("/api/email/send-verification", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const user = req.user!;
      
      // Check if email is already verified
      if (user.isEmailVerified) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      // Generate verification token
      const { token, expiry } = generateVerificationToken();
      
      // Save token to database
      await storage.setEmailVerificationToken(user.id, token, expiry);
      
      // Send verification email
      await sendVerificationEmail(user.email, user.fullName, token);
      
      res.json({ 
        success: true, 
        message: "Verification email sent successfully" 
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ error: "Failed to send verification email" });
    }
  });

  // Verify email with token
  app.post("/api/email/verify", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
      }

      // Find user by verification token
      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      // Check if token is expired
      if (isTokenExpired(user.emailVerificationExpiry)) {
        return res.status(400).json({ error: "Verification token has expired. Please request a new one." });
      }

      // Verify email
      await storage.verifyEmail(user.id);
      
      // Send welcome email
      await sendWelcomeEmail(user.email, user.fullName, user.username);
      
      res.json({ 
        success: true, 
        message: "Email verified successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isEmailVerified: true,
        }
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // Resend verification email
  app.post("/api/email/resend-verification", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const user = req.user!;
      
      // Check if email is already verified
      if (user.isEmailVerified) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      // Generate new verification token
      const { token, expiry } = generateVerificationToken();
      
      // Update token in database
      await storage.setEmailVerificationToken(user.id, token, expiry);
      
      // Send verification email
      await sendVerificationEmail(user.email, user.fullName, token);
      
      res.json({ 
        success: true, 
        message: "Verification email resent successfully" 
      });
    } catch (error) {
      console.error("Error resending verification email:", error);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });

  // Request password reset
  app.post("/api/password/request-reset", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Don't reveal if user exists or not (security best practice)
      if (!user) {
        return res.json({ 
          success: true, 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }

      // Generate reset token
      const { token, expiry } = generatePasswordResetToken();
      
      // Save token to database
      await storage.setPasswordResetToken(user.id, token, expiry);
      
      // Send reset email
      await sendPasswordResetEmail(user.email, user.fullName, token);
      
      res.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Complete password reset
  app.post("/api/password/reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      // Validate password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Find user by reset token
      const user = await storage.getUserByPasswordResetToken(token);
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (isResetTokenExpired(user.passwordResetExpiry)) {
        return res.status(400).json({ error: "Reset token has expired. Please request a new one." });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password and clear reset token
      await storage.resetPassword(user.id, hashedPassword);
      
      res.json({ 
        success: true, 
        message: "Password has been reset successfully. You can now log in with your new password." 
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Admin route to view all users and their data
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    try {
      // Get all users from database
      const allUsers = await db.select().from(usersTable);
      
      // For each user, get their conversations
      const usersWithConversations = await Promise.all(
        allUsers.map(async (user) => {
          const userConversations = await storage.getUserConversations(user.id);
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            userCode: user.userCode,
            phone: user.phone,
            fullName: user.fullName,
            subscriptionType: user.subscriptionType,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            isPhoneVerified: user.isPhoneVerified,
            isSetupComplete: user.isSetupComplete,
            dailyMessageCount: user.dailyMessageCount,
            lastMessageDate: user.lastMessageDate,
            createdAt: user.createdAt,
            conversations: userConversations.map(conv => ({
              id: conv.id,
              otherUser: {
                id: conv.otherUser.id,
                username: conv.otherUser.username,
                userCode: conv.otherUser.userCode,
              },
              lastMessageAt: conv.lastMessageAt,
            })),
          };
        })
      );

      res.json(usersWithConversations);
    } catch (error) {
      console.error("Error fetching admin users data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SendGrid test endpoint
  app.get("/api/sendgrid/test", async (req, res) => {
    try {
      const isConfigured = await testSendGridSetup();
      res.json({ 
        configured: isConfigured,
        message: isConfigured ? "SendGrid is properly configured" : "SendGrid credentials are missing"
      });
    } catch (error: any) {
      console.error("SendGrid test error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test email send endpoint (for admins only)
  app.post("/api/sendgrid/send-test", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user is admin
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    try {
      const { to } = req.body;
      if (!to) {
        return res.status(400).json({ error: "Email address required" });
      }

      await sendEmail({
        to,
        subject: "SendGrid Test Email from SecureCalc",
        text: "This is a test email from your SecureCalc application to verify SendGrid integration.",
        html: "<p>This is a <strong>test email</strong> from your SecureCalc application to verify SendGrid integration.</p>"
      });

      res.json({ success: true, message: `Test email sent to ${to}` });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wsManager = setupWebSocket(httpServer);
  
  // Store wsManager on app for access in routes
  app.set("wsManager", wsManager);
  
  return httpServer;
}
