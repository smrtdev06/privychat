import { db } from "./db";
import { users, mobileSubscriptions } from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";
import type { MobileSubscription } from "@shared/schema";
import { google } from 'googleapis';

/**
 * Validate Google Play purchase using Google Play Developer API
 * You'll need to set up Google Play Developer API credentials
 */
export async function validateGooglePlayPurchase(
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<{
  isValid: boolean;
  expiryDate?: Date;
  autoRenewing?: boolean;
  purchaseDate?: Date;
}> {
  try {
    console.log("🔐 Validating Google Play purchase with API");
    console.log("   Package:", packageName);
    console.log("   Product:", productId);
    console.log("   Token:", purchaseToken ? purchaseToken.substring(0, 20) + "..." : "missing");
    
    // Basic validation - ensure required fields are present
    if (!packageName || !productId || !purchaseToken) {
      console.log("❌ Missing required fields");
      return { isValid: false };
    }
    
    // Check if service account credentials are configured
    const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      console.log("❌ GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not configured");
      console.log("   Production validation REQUIRES service account credentials");
      console.log("   Setup instructions: See GOOGLE_PLAY_API_SETUP.md");
      
      // FAIL CLOSED - Do not allow validation without credentials
      throw new Error("Google Play API credentials not configured. Cannot validate purchase.");
    }
    
    // PRODUCTION MODE: Validate with Google Play Developer API
    console.log("✅ Service account configured - using PRODUCTION validation");
    
    // Parse service account credentials
    const credentials = JSON.parse(serviceAccountJson);
    
    // Set up authentication
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    
    // Create Android Publisher API client with auth
    const androidpublisher = google.androidpublisher({
      version: 'v3',
      auth,
    });
    
    // Validate subscription purchase
    console.log("📞 Calling Google Play API...");
    const response = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId: productId,
      token: purchaseToken,
    });
    
    const purchaseData = response.data;
    console.log("✅ API Response received");
    console.log("   Order ID:", purchaseData.orderId);
    console.log("   Payment State:", purchaseData.paymentState);
    console.log("   Auto-Renewing:", purchaseData.autoRenewing);
    
    // Parse dates from milliseconds
    const expiryDate = new Date(parseInt(purchaseData.expiryTimeMillis || "0"));
    const purchaseDate = new Date(parseInt(purchaseData.startTimeMillis || "0"));
    
    // Check if subscription is valid (not expired and payment received)
    const isExpired = expiryDate < new Date();
    const paymentReceived = purchaseData.paymentState === 1; // 1 = payment received
    const isValid = !isExpired && paymentReceived;
    
    console.log("📊 Validation result:");
    console.log("   Valid:", isValid);
    console.log("   Expiry:", expiryDate.toISOString());
    console.log("   Purchase Date:", purchaseDate.toISOString());
    console.log("   Payment State:", paymentReceived ? "Received" : "Pending/Failed");
    
    return {
      isValid,
      expiryDate,
      autoRenewing: purchaseData.autoRenewing || false,
      purchaseDate,
    };
  } catch (error: any) {
    console.error("❌ Error validating Google Play purchase:", error.message);
    
    // Handle specific API errors
    if (error.code === 401) {
      console.error("   Authentication failed - check service account permissions");
    } else if (error.code === 404) {
      console.error("   Purchase not found - token may be invalid or expired");
    } else if (error.code === 410) {
      console.error("   Subscription expired >60 days ago");
    }
    
    return {
      isValid: false,
    };
  }
}

/**
 * Validate Apple App Store receipt using App Store Server API
 * You'll need to set up App Store Connect API credentials
 */
export async function validateAppleAppStorePurchase(
  receiptData: string,
  transactionId: string
): Promise<{
  isValid: boolean;
  expiryDate?: Date;
  autoRenewing?: boolean;
  purchaseDate?: Date;
  latestReceiptInfo?: any;
}> {
  try {
    // Note: You need to set up App Store Connect API
    // For now, this is a placeholder implementation
    
    // TODO: Implement App Store Server API validation
    // 1. Get App Store Connect API key from Apple
    // 2. Use verifyReceipt endpoint or new App Store Server API
    // 3. Validate the receipt and parse response
    
    // For production, use: https://buy.itunes.apple.com/verifyReceipt
    // For sandbox, use: https://sandbox.itunes.apple.com/verifyReceipt
    
    // Example implementation:
    // const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     'receipt-data': receiptData,
    //     'password': process.env.APP_STORE_SHARED_SECRET,
    //   }),
    // });
    // const data = await response.json();
    
    console.log("❌ App Store validation not implemented");
    console.log("   This endpoint cannot validate iOS purchases");
    console.log("   Implementation required before iOS production use");
    console.log("   See: https://developer.apple.com/documentation/appstoreserverapi");
    
    // FAIL CLOSED - Do not allow validation without implementation
    throw new Error("Apple App Store validation not implemented. Cannot validate iOS purchase.");
  } catch (error) {
    console.error("Error validating Apple purchase:", error);
    return {
      isValid: false,
    };
  }
}

/**
 * Create or update a mobile subscription in the database
 */
export async function upsertMobileSubscription(
  userId: string,
  platform: "ios" | "android",
  subscriptionData: {
    productId: string;
    purchaseToken?: string;
    originalTransactionId?: string;
    latestReceiptInfo?: any;
    purchaseDate: Date;
    expiryDate: Date;
    autoRenewing: boolean;
  }
): Promise<MobileSubscription> {
  // Check if subscription already exists
  const existingSubscription = await db
    .select()
    .from(mobileSubscriptions)
    .where(
      and(
        eq(mobileSubscriptions.userId, userId),
        eq(mobileSubscriptions.platform, platform),
        platform === "android"
          ? eq(mobileSubscriptions.purchaseToken, subscriptionData.purchaseToken || "")
          : eq(mobileSubscriptions.originalTransactionId, subscriptionData.originalTransactionId || "")
      )
    )
    .limit(1);

  if (existingSubscription.length > 0) {
    // Update existing subscription
    const updated = await db
      .update(mobileSubscriptions)
      .set({
        expiryDate: subscriptionData.expiryDate,
        autoRenewing: subscriptionData.autoRenewing,
        isActive: subscriptionData.expiryDate > new Date(),
        latestReceiptInfo: subscriptionData.latestReceiptInfo,
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mobileSubscriptions.id, existingSubscription[0].id))
      .returning();
    
    return updated[0];
  } else {
    // Create new subscription
    const created = await db
      .insert(mobileSubscriptions)
      .values({
        userId,
        platform,
        productId: subscriptionData.productId,
        purchaseToken: subscriptionData.purchaseToken,
        originalTransactionId: subscriptionData.originalTransactionId,
        latestReceiptInfo: subscriptionData.latestReceiptInfo,
        purchaseDate: subscriptionData.purchaseDate,
        expiryDate: subscriptionData.expiryDate,
        autoRenewing: subscriptionData.autoRenewing,
        isActive: subscriptionData.expiryDate > new Date(),
      })
      .returning();
    
    return created[0];
  }
}

/**
 * Get active mobile subscription for a user
 */
export async function getActiveMobileSubscription(
  userId: string
): Promise<MobileSubscription | null> {
  const subscriptions = await db
    .select()
    .from(mobileSubscriptions)
    .where(
      and(
        eq(mobileSubscriptions.userId, userId),
        eq(mobileSubscriptions.isActive, true),
        gte(mobileSubscriptions.expiryDate, new Date())
      )
    )
    .orderBy(mobileSubscriptions.expiryDate)
    .limit(1);

  return subscriptions[0] || null;
}

/**
 * Update user's subscription status based on mobile subscription
 * IMPORTANT: This should only update if there's an active mobile subscription
 * It should NOT downgrade users who have web-based premium (from upgrade codes/gifts)
 */
export async function syncUserSubscriptionStatus(userId: string): Promise<void> {
  // First, check current user status
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user) {
    console.warn(`⚠️ syncUserSubscriptionStatus: User ${userId} not found`);
    return;
  }

  // EARLY RETURN: If user has a valid future-dated subscription (from any source),
  // do NOT overwrite it! This preserves web-based premium grants.
  if (user.subscriptionType === "premium" && 
      user.subscriptionExpiresAt && 
      user.subscriptionExpiresAt > new Date()) {
    console.log(`✅ User ${userId} has valid premium until ${user.subscriptionExpiresAt.toISOString()} - skipping sync`);
    return;
  }

  // Check for active mobile subscription
  const activeSub = await getActiveMobileSubscription(userId);
  
  if (activeSub && activeSub.expiryDate > new Date()) {
    // User has active mobile subscription - update to premium
    console.log(`📱 Upgrading user ${userId} to premium via mobile subscription until ${activeSub.expiryDate.toISOString()}`);
    await db
      .update(users)
      .set({
        subscriptionType: "premium",
        subscriptionExpiresAt: activeSub.expiryDate,
      })
      .where(eq(users.id, userId));
  } else if (user.subscriptionType === "premium" && 
             user.subscriptionExpiresAt && 
             user.subscriptionExpiresAt < new Date()) {
    // User's subscription has expired - downgrade to free
    console.log(`📉 Downgrading user ${userId} to free (subscription expired: ${user.subscriptionExpiresAt.toISOString()})`);
    await db
      .update(users)
      .set({
        subscriptionType: "free",
      })
      .where(eq(users.id, userId));
  }
  // If user is free and has no mobile subscription, do nothing
}

/**
 * Handle subscription cancellation
 */
export async function cancelMobileSubscription(
  subscriptionId: string
): Promise<void> {
  await db
    .update(mobileSubscriptions)
    .set({
      isActive: false,
      autoRenewing: false,
      cancellationDate: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(mobileSubscriptions.id, subscriptionId));
}
