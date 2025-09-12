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
  phone: text("phone").notNull(),
  fullName: text("full_name").notNull(),
  userCode: text("user_code").notNull().unique(),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  numericPassword: text("numeric_password"),
  isSetupComplete: boolean("is_setup_complete").default(false),
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
  messageType: text("message_type").default("text"), // text, image, video
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

export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "senderMessages" }),
  conversations1: many(conversations, { relationName: "user1Conversations" }),
  conversations2: many(conversations, { relationName: "user2Conversations" }),
  purchasedGifts: many(subscriptionGifts, { relationName: "giftPurchases" }),
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
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  user2Id: true,
});

export const insertSubscriptionGiftSchema = createInsertSchema(subscriptionGifts).pick({
  recipientEmail: true,
  giftMessage: true,
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
