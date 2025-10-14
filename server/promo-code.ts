import { db } from "./db";
import { promoCodeRedemptions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Log a promo code redemption attempt
 * This is for analytics and tracking purposes
 */
export async function logPromoCodeRedemption(
  userId: string,
  platform: "ios" | "android",
  promoCode: string
): Promise<string> {
  const [redemption] = await db
    .insert(promoCodeRedemptions)
    .values({
      userId,
      platform,
      promoCode,
      status: "pending",
    })
    .returning();
  
  return redemption.id;
}

/**
 * Update redemption status after purchase validation
 * Called from mobile subscription validation endpoints
 */
export async function updateRedemptionStatus(
  redemptionId: string,
  status: "success" | "failed",
  subscriptionId?: string,
  errorMessage?: string
): Promise<void> {
  await db
    .update(promoCodeRedemptions)
    .set({
      status,
      subscriptionId,
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(promoCodeRedemptions.id, redemptionId));
}

/**
 * Get user's promo code redemption history
 */
export async function getUserRedemptions(userId: string) {
  return await db
    .select()
    .from(promoCodeRedemptions)
    .where(eq(promoCodeRedemptions.userId, userId))
    .orderBy(desc(promoCodeRedemptions.createdAt));
}

/**
 * Generate deep link URL for Google Play promo code redemption
 */
export function generateGooglePlayRedeemUrl(promoCode: string): string {
  return `https://play.google.com/redeem?code=${encodeURIComponent(promoCode)}`;
}

/**
 * Generate deep link URL for Apple App Store offer code redemption
 * Requires the app ID to be configured
 */
export function generateAppleRedeemUrl(promoCode: string, appId: string): string {
  return `https://apps.apple.com/redeem?ctx=offercodes&id=${appId}&code=${encodeURIComponent(promoCode)}`;
}
