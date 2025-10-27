import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  fullName: text("full_name"),
  userCode: text("user_code").notNull().unique(),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  numericPassword: text("numeric_password"),
  isSetupComplete: boolean("is_setup_complete").default(false),
  isAdmin: boolean("is_admin").default(false),
  subscriptionType: text("subscription_type").default("free"), // free, premium
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  dailyMessageCount: integer("daily_message_count").default(0),
  lastMessageDate: timestamp("last_message_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content"),
  messageType: text("message_type").default("text"), // text, image, video, voice
  mediaUrl: text("media_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const subscriptionGifts = pgTable("subscription_gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  recipientEmail: text("recipient_email").notNull(),
  upgradeCode: text("upgrade_code").notNull().unique(),
  isRedeemed: boolean("is_redeemed").default(false),
  redeemedBy: varchar("redeemed_by").references(() => users.id),
  giftMessage: text("gift_message"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const mobileSubscriptions = pgTable("mobile_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // 'ios' or 'android'
  productId: text("product_id").notNull(), // SKU from app store
  purchaseToken: text("purchase_token"), // Android purchase token
  originalTransactionId: text("original_transaction_id"), // iOS transaction ID
  latestReceiptInfo: jsonb("latest_receipt_info"), // Full receipt data
  purchaseDate: timestamp("purchase_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  isActive: boolean("is_active").default(true),
  autoRenewing: boolean("auto_renewing").default(true),
  cancellationDate: timestamp("cancellation_date"),
  lastVerifiedAt: timestamp("last_verified_at").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const promoCodeRedemptions = pgTable("promo_code_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // 'ios' or 'android'
  promoCode: text("promo_code").notNull(), // The code value for analytics
  status: text("status").notNull().default("pending"), // pending, success, failed
  errorMessage: text("error_message"), // Error details if redemption failed
  subscriptionId: varchar("subscription_id").references(() => mobileSubscriptions.id), // Link to created subscription if successful
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "senderMessages" }),
  conversations1: many(conversations, { relationName: "user1Conversations" }),
  conversations2: many(conversations, { relationName: "user2Conversations" }),
  purchasedGifts: many(subscriptionGifts, { relationName: "giftPurchases" }),
  mobileSubscriptions: many(mobileSubscriptions),
  promoCodeRedemptions: many(promoCodeRedemptions),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user1: one(users, {
    fields: [conversations.user1Id],
    references: [users.id],
    relationName: "user1Conversations",
  }),
  user2: one(users, {
    fields: [conversations.user2Id],
    references: [users.id],
    relationName: "user2Conversations",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "senderMessages",
  }),
}));

export const subscriptionGiftsRelations = relations(subscriptionGifts, ({ one }) => ({
  buyer: one(users, {
    fields: [subscriptionGifts.buyerId],
    references: [users.id],
    relationName: "giftPurchases",
  }),
  redeemedByUser: one(users, {
    fields: [subscriptionGifts.redeemedBy],
    references: [users.id],
  }),
}));

export const mobileSubscriptionsRelations = relations(mobileSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [mobileSubscriptions.userId],
    references: [users.id],
  }),
  promoCodeRedemptions: many(promoCodeRedemptions),
}));

export const promoCodeRedemptionsRelations = relations(promoCodeRedemptions, ({ one }) => ({
  user: one(users, {
    fields: [promoCodeRedemptions.userId],
    references: [users.id],
  }),
  subscription: one(mobileSubscriptions, {
    fields: [promoCodeRedemptions.subscriptionId],
    references: [mobileSubscriptions.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  phone: true,
  fullName: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
  messageType: true,
  mediaUrl: true,
}).extend({
  messageType: z.enum(["text", "image", "video", "voice"]).default("text"),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  user2Id: true,
});

export const insertSubscriptionGiftSchema = createInsertSchema(subscriptionGifts).pick({
  recipientEmail: true,
  giftMessage: true,
});

export const insertMobileSubscriptionSchema = createInsertSchema(mobileSubscriptions).pick({
  userId: true,
  platform: true,
  productId: true,
  purchaseToken: true,
  originalTransactionId: true,
  latestReceiptInfo: true,
  purchaseDate: true,
  expiryDate: true,
  autoRenewing: true,
}).extend({
  platform: z.enum(["ios", "android"]),
});

export const insertPromoCodeRedemptionSchema = createInsertSchema(promoCodeRedemptions).pick({
  userId: true,
  platform: true,
  promoCode: true,
  status: true,
  errorMessage: true,
  subscriptionId: true,
}).extend({
  platform: z.enum(["ios", "android"]),
  status: z.enum(["pending", "success", "failed"]).default("pending"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertSubscriptionGift = z.infer<typeof insertSubscriptionGiftSchema>;
export type SubscriptionGift = typeof subscriptionGifts.$inferSelect;
export type InsertMobileSubscription = z.infer<typeof insertMobileSubscriptionSchema>;
export type MobileSubscription = typeof mobileSubscriptions.$inferSelect;
export type InsertPromoCodeRedemption = z.infer<typeof insertPromoCodeRedemptionSchema>;
export type PromoCodeRedemption = typeof promoCodeRedemptions.$inferSelect;
