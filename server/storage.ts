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
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<void>;
  verifyEmail(userId: string): Promise<void>;
  setPasswordResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  resetPassword(userId: string, newPassword: string): Promise<void>;
  deleteUserAccount(userId: string): Promise<void>;
  
  getConversation(user1Id: string, user2Id: string): Promise<Conversation | undefined>;
  getConversationById(id: string): Promise<Conversation | undefined>;
  getUserConversations(userId: string): Promise<(Conversation & { otherUser: User, lastMessage?: Message })[]>;
  createConversation(conversation: InsertConversation & { user1Id: string }): Promise<Conversation>;
  
  getConversationMessages(conversationId: string): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  
  canUserSendMessage(userId: string, conversationId: string): Promise<boolean>;
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

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user || undefined;
  }

  async setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpiry: expiry,
      })
      .where(eq(users.id, userId));
  }

  async verifyEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      })
      .where(eq(users.id, userId));
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user || undefined;
  }

  async setPasswordResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      })
      .where(eq(users.id, userId));
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      })
      .where(eq(users.id, userId));
  }

  async deleteUserAccount(userId: string): Promise<void> {
    // Delete all user-related data in correct order (respecting foreign key constraints)
    
    // 1. Delete messages sent by the user
    await db.delete(messages).where(eq(messages.senderId, userId));
    
    // 2. Delete conversations where user is a participant
    await db.delete(conversations).where(
      or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      )
    );
    
    // 3. Delete subscription gifts purchased by user
    await db.delete(subscriptionGifts).where(eq(subscriptionGifts.buyerId, userId));
    
    // 4. Delete subscription gifts redeemed by user
    await db.delete(subscriptionGifts).where(eq(subscriptionGifts.redeemedBy, userId));
    
    // 5. Delete mobile subscriptions
    const { mobileSubscriptions } = await import("@shared/schema");
    await db.delete(mobileSubscriptions).where(eq(mobileSubscriptions.userId, userId));
    
    // 6. Delete promo code redemptions
    const { promoCodeRedemptions } = await import("@shared/schema");
    await db.delete(promoCodeRedemptions).where(eq(promoCodeRedemptions.userId, userId));
    
    // 7. Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    console.log(`✅ All data deleted for user ${userId}`);
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

  async canUserSendMessage(userId: string, conversationId: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return false;

    // Get the conversation to check the other user's subscription
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
    if (!conversation) return false;

    // Get the other user in the conversation
    const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
    const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));

    // If either user has active premium, both can send unlimited messages
    const senderIsPremium = user.subscriptionType === "premium" && 
        user.subscriptionExpiresAt && 
        user.subscriptionExpiresAt > new Date();
    
    const otherIsPremium = otherUser && 
        otherUser.subscriptionType === "premium" && 
        otherUser.subscriptionExpiresAt && 
        otherUser.subscriptionExpiresAt > new Date();

    if (senderIsPremium || otherIsPremium) {
      return true;
    }

    // Both users are free - apply daily message limit to sender
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
