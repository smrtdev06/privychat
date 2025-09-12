import { users, conversations, messages, subscriptionGifts, type User, type InsertUser, type Conversation, type Message, type InsertMessage, type InsertConversation, type SubscriptionGift, type InsertSubscriptionGift } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import session, { Store } from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUserCode(userCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  getConversation(user1Id: string, user2Id: string): Promise<Conversation | undefined>;
  getConversationById(id: string): Promise<Conversation | undefined>;
  getUserConversations(userId: string): Promise<(Conversation & { otherUser: User, lastMessage?: Message })[]>;
  createConversation(conversation: InsertConversation & { user1Id: string }): Promise<Conversation>;
  
  getConversationMessages(conversationId: string): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  
  canUserSendMessage(userId: string): Promise<boolean>;
  incrementDailyMessageCount(userId: string): Promise<void>;
  resetDailyMessageCount(userId: string): Promise<void>;
  
  createSubscriptionGift(gift: InsertSubscriptionGift & { buyerId: string, upgradeCode: string }): Promise<SubscriptionGift>;
  getSubscriptionGiftByCode(upgradeCode: string): Promise<SubscriptionGift | undefined>;
  redeemSubscriptionGift(upgradeCode: string, userId: string): Promise<boolean>;
  
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUserCode(userCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.userCode, userCode));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate unique user code
    const userCode = this.generateUserCode();
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        userCode,
        isPhoneVerified: false,
        isSetupComplete: false,
        subscriptionType: "free",
        dailyMessageCount: 0,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getConversation(user1Id: string, user2Id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, user1Id), eq(conversations.user2Id, user2Id)),
          and(eq(conversations.user1Id, user2Id), eq(conversations.user2Id, user1Id))
        )
      );
    return conversation || undefined;
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getUserConversations(userId: string): Promise<(Conversation & { otherUser: User, lastMessage?: Message })[]> {
    const userConversations = await db
      .select({
        conversation: conversations,
        otherUser: users,
        lastMessage: messages,
      })
      .from(conversations)
      .leftJoin(
        users,
        or(
          and(eq(conversations.user1Id, userId), eq(conversations.user2Id, users.id)),
          and(eq(conversations.user2Id, userId), eq(conversations.user1Id, users.id))
        )
      )
      .leftJoin(
        messages,
        and(
          eq(messages.conversationId, conversations.id),
          eq(messages.id, 
            sql`(SELECT id FROM ${messages} WHERE conversation_id = ${conversations.id} ORDER BY created_at DESC LIMIT 1)`
          )
        )
      )
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    return userConversations.map(row => ({
      ...row.conversation,
      otherUser: row.otherUser!,
      lastMessage: row.lastMessage || undefined,
    }));
  }

  async createConversation(conversation: InsertConversation & { user1Id: string }): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversationMessages(conversationId: string): Promise<(Message & { sender: User })[]> {
    const conversationMessages = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    return conversationMessages.map(row => ({
      ...row.message,
      sender: row.sender,
    }));
  }

  async createMessage(message: InsertMessage & { senderId: string }): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();

    // Update conversation's last message time
    await db
      .update(conversations)
      .set({ lastMessageAt: sql`now()` })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, userId)
        )
      );
  }

  async canUserSendMessage(userId: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return false;

    // Premium users can always send messages
    if (user.subscriptionType === "premium" && 
        user.subscriptionExpiresAt && 
        user.subscriptionExpiresAt > new Date()) {
      return true;
    }

    // Free users get 1 message per day
    const today = new Date().toDateString();
    const lastMessageDate = user.lastMessageDate?.toDateString();
    
    if (lastMessageDate !== today) {
      // Reset daily count for new day
      await this.resetDailyMessageCount(userId);
      return true;
    }

    return (user.dailyMessageCount || 0) < 1;
  }

  async incrementDailyMessageCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        dailyMessageCount: sql`${users.dailyMessageCount} + 1`,
        lastMessageDate: sql`now()`
      })
      .where(eq(users.id, userId));
  }

  async resetDailyMessageCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        dailyMessageCount: 0,
        lastMessageDate: sql`now()`
      })
      .where(eq(users.id, userId));
  }

  async createSubscriptionGift(gift: InsertSubscriptionGift & { buyerId: string, upgradeCode: string }): Promise<SubscriptionGift> {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

    const [newGift] = await db
      .insert(subscriptionGifts)
      .values({
        ...gift,
        expiresAt,
        isRedeemed: false,
      })
      .returning();
    return newGift;
  }

  async getSubscriptionGiftByCode(upgradeCode: string): Promise<SubscriptionGift | undefined> {
    const [gift] = await db.select().from(subscriptionGifts).where(eq(subscriptionGifts.upgradeCode, upgradeCode));
    return gift || undefined;
  }

  async redeemSubscriptionGift(upgradeCode: string, userId: string): Promise<boolean> {
    const gift = await this.getSubscriptionGiftByCode(upgradeCode);
    if (!gift || gift.isRedeemed || (gift.expiresAt && gift.expiresAt < new Date())) {
      return false;
    }

    // Mark gift as redeemed
    await db
      .update(subscriptionGifts)
      .set({ 
        isRedeemed: true,
        redeemedBy: userId 
      })
      .where(eq(subscriptionGifts.upgradeCode, upgradeCode));

    // Update user to premium
    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1);

    await db
      .update(users)
      .set({ 
        subscriptionType: "premium",
        subscriptionExpiresAt 
      })
      .where(eq(users.id, userId));

    return true;
  }

  private generateUserCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return segments.join('-');
  }
}

export const storage = new DatabaseStorage();
