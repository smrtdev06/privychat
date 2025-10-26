# How to Detect Subscription Cancellations

When a user unsubscribes on the Play Store, your app/backend can detect it through **two mechanisms**:

---

## Method 1: Google Play Real-time Developer Notifications (Webhooks) ⚡

### How It Works
1. User cancels subscription in Google Play Store
2. **Google automatically sends notification to your server** (within seconds)
3. Your webhook endpoint receives the notification
4. Backend updates subscription status in database
5. User is marked for downgrade when subscription expires

### Advantages
- ✅ **Real-time** - Know immediately when users cancel
- ✅ **Automatic** - No user action required
- ✅ **Reliable** - Google guarantees delivery
- ✅ **Comprehensive** - Covers all subscription events (cancel, renew, expire, etc.)

### Current Implementation Status

**Webhook Endpoint**: ✅ EXISTS  
**Location**: `POST /api/mobile-subscription/webhook/google`  
**Status**: ⚠️ **NEEDS COMPLETION**

**Current Code** (server/routes.ts):
```javascript
app.post("/api/mobile-subscription/webhook/google", async (req, res) => {
  try {
    const message = req.body.message;
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(decodedData);

    const notificationType = notification.subscriptionNotification?.notificationType;
    
    if (notificationType === 3 || notificationType === 13) {
      // SUBSCRIPTION_CANCELED (3) or SUBSCRIPTION_EXPIRED (13)
      const purchaseToken = notification.subscriptionNotification?.purchaseToken;
      // TODO: Implement subscription lookup and cancellation ⚠️
      console.log("Subscription cancelled/expired:", purchaseToken);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing Google webhook:", error);
    res.sendStatus(500);
  }
});
```

**What Needs to be Implemented:**
```javascript
// Inside the webhook handler:
if (notificationType === 3) {  // SUBSCRIPTION_CANCELED
  const purchaseToken = notification.subscriptionNotification?.purchaseToken;
  const packageName = notification.packageName;
  
  // 1. Find subscription by purchase token
  const subscription = await db
    .select()
    .from(mobileSubscriptions)
    .where(eq(mobileSubscriptions.purchaseToken, purchaseToken))
    .limit(1);
  
  if (subscription.length > 0) {
    // 2. Mark as canceled (but keep active until expiry)
    await cancelMobileSubscription(subscription[0].id);
    
    // 3. Log the event
    console.log(`✅ Subscription canceled: ${subscription[0].id} for user ${subscription[0].userId}`);
  }
}

if (notificationType === 13) {  // SUBSCRIPTION_EXPIRED
  const purchaseToken = notification.subscriptionNotification?.purchaseToken;
  
  // 1. Find subscription
  const subscription = await db
    .select()
    .from(mobileSubscriptions)
    .where(eq(mobileSubscriptions.purchaseToken, purchaseToken))
    .limit(1);
  
  if (subscription.length > 0) {
    // 2. Deactivate and downgrade user
    await db
      .update(mobileSubscriptions)
      .set({ isActive: false })
      .where(eq(mobileSubscriptions.id, subscription[0].id));
    
    await syncUserSubscriptionStatus(subscription[0].userId);
    
    console.log(`✅ Subscription expired and user downgraded: ${subscription[0].userId}`);
  }
}
```

### Google Play Notification Types

| Code | Event | Action Required |
|------|-------|-----------------|
| 1 | SUBSCRIPTION_RECOVERED | Reactivate subscription |
| 2 | SUBSCRIPTION_RENEWED | Update expiry date |
| 3 | **SUBSCRIPTION_CANCELED** | **Mark autoRenewing = false** |
| 4 | SUBSCRIPTION_PURCHASED | Create new subscription |
| 5 | SUBSCRIPTION_ON_HOLD | Mark subscription on hold |
| 6 | SUBSCRIPTION_IN_GRACE_PERIOD | Payment issue - grace period |
| 7 | SUBSCRIPTION_RESTARTED | Reactivate subscription |
| 8 | SUBSCRIPTION_PRICE_CHANGE_CONFIRMED | Update price |
| 9 | SUBSCRIPTION_DEFERRED | Renewal deferred |
| 10 | SUBSCRIPTION_PAUSED | Mark subscription paused |
| 11 | SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED | Update pause schedule |
| 12 | SUBSCRIPTION_REVOKED | Revoke access immediately |
| 13 | **SUBSCRIPTION_EXPIRED** | **Deactivate and downgrade user** |

### Setup Required (Google Play Console)

1. **Enable Real-time Developer Notifications**:
   - Go to Google Play Console
   - Navigate to **Monetization setup** → **Google Cloud Pub/Sub**
   - Create a Cloud Pub/Sub topic
   - Set up a push subscription pointing to your webhook URL

2. **Configure Webhook URL**:
   ```
   https://your-replit-domain.repl.co/api/mobile-subscription/webhook/google
   ```

3. **Test the Webhook**:
   - Google Play Console has a "Send test notification" feature
   - Verify your endpoint receives and processes notifications correctly

---

## Method 2: Manual Validation / "Restore Purchases" 🔄

### How It Works
1. User opens the app
2. App calls "Restore Purchases" (or happens automatically on launch)
3. App retrieves purchase token from device
4. **Backend validates token with Google Play API**
5. Backend checks current subscription status from Google
6. Backend updates local database

### Advantages
- ✅ **Works without webhooks** - No setup required
- ✅ **User-initiated** - Happens when user opens app
- ✅ **Catches missed events** - Backup if webhooks fail

### Disadvantages
- ❌ **Not real-time** - Only updates when user opens app
- ❌ **Requires user action** - User must open app to sync
- ❌ **More API calls** - Queries Google Play API on every restore

### Current Implementation Status

**Frontend**: ✅ IMPLEMENTED  
**Location**: `client/src/components/mobile-subscription.tsx`  
**Function**: `handleRestorePurchases()`

**How It Works**:
```javascript
// User clicks "Restore Purchases" button
const handleRestorePurchases = async () => {
  // 1. Get all purchases from device
  const restored = await inAppPurchases.restorePurchases();
  
  // 2. For each purchase, validate with backend
  for (const purchase of restored) {
    await apiRequest("POST", "/api/mobile-subscription/validate-android", {
      packageName: "com.newhomepage.privychat",
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken,
    });
  }
  
  // 3. Backend validates with Google Play API
  //    - If canceled: autoRenewing = false
  //    - If expired: isActive = false
  //    - Updates database accordingly
  
  // 4. Refresh user data in app
  queryClient.invalidateQueries({ queryKey: ["/api/user"] });
};
```

**Backend Validation** (server/mobile-subscriptions.ts):
```javascript
// When validating purchase token with Google Play API
const response = await androidpublisher.purchases.subscriptions.get({
  packageName,
  subscriptionId: productId,
  token: purchaseToken,
});

const purchaseData = response.data;

// Check subscription status from Google's response
const expiryDate = new Date(parseInt(purchaseData.expiryTimeMillis));
const isExpired = expiryDate < new Date();
const autoRenewing = purchaseData.autoRenewing;  // ✅ This is false if user canceled
const paymentReceived = purchaseData.paymentState === 1;

// Update database with current status
await upsertMobileSubscription(userId, "android", {
  productId,
  purchaseToken,
  purchaseDate,
  expiryDate,
  autoRenewing,  // ✅ Synced from Google
});
```

### When Restore Happens
- ✅ User clicks "Restore Purchases" button in Settings
- ✅ App launches (could auto-restore on startup)
- ✅ User navigates to subscription settings

---

## How Subscription Status is Stored

### Database Table: `mobile_subscriptions`

```sql
CREATE TABLE mobile_subscriptions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  platform VARCHAR NOT NULL,  -- 'ios' or 'android'
  product_id VARCHAR NOT NULL,
  purchase_token VARCHAR,  -- Android only
  original_transaction_id VARCHAR,  -- iOS only
  purchase_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  auto_renewing BOOLEAN NOT NULL,  -- ✅ False if user canceled
  is_active BOOLEAN NOT NULL,      -- ✅ False if expired
  cancellation_date TIMESTAMP,      -- ✅ Set when canceled
  last_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Key Fields for Cancellation Detection

| Field | Meaning |
|-------|---------|
| `auto_renewing` | **false** = User canceled (but still has access until expiry) |
| `is_active` | **false** = Subscription expired (user lost access) |
| `cancellation_date` | Timestamp when user canceled |
| `expiry_date` | When subscription ends |

### User Status Flow

```
Active Premium
  ↓ (User cancels in Play Store)
autoRenewing = false, isActive = true
  ↓ (Expiry date passes)
autoRenewing = false, isActive = false
  ↓ (Backend runs syncUserSubscriptionStatus)
User downgraded to Free plan
```

---

## Recommended Implementation Strategy

### Phase 1: Complete Webhook Handler (High Priority)
**Time**: 30 minutes  
**Impact**: Real-time cancellation detection

1. Implement subscription lookup by `purchaseToken`
2. Call `cancelMobileSubscription()` on SUBSCRIPTION_CANCELED event
3. Call `syncUserSubscriptionStatus()` on SUBSCRIPTION_EXPIRED event
4. Test with Google Play Console test notifications

### Phase 2: Set Up Google Cloud Pub/Sub (Medium Priority)
**Time**: 1 hour  
**Impact**: Enables webhook delivery

1. Create Cloud Pub/Sub topic in Google Cloud Console
2. Create push subscription pointing to webhook URL
3. Configure in Google Play Console
4. Test end-to-end flow

### Phase 3: Auto-Restore on App Launch (Optional)
**Time**: 15 minutes  
**Impact**: Keeps status fresh without user action

1. Add `useEffect` in Settings page to auto-restore on mount
2. Show loading indicator during restore
3. Silent restore (no toast unless error)

---

## Testing Subscription Cancellation

### Test Flow
1. **Make a test purchase** (use test account in Google Play)
2. **Cancel in Google Play Console** (Subscriptions → Test)
3. **Verify webhook receives notification** (check server logs)
4. **Check database**: `autoRenewing` should be `false`
5. **Wait for expiry or manually advance time**
6. **Verify user downgraded to Free**

### Testing Without Real Purchases
- Use Google Play's "Send test notification" feature
- Manually call webhook endpoint with test payload
- Use test purchase tokens

---

## Current Detection Methods Summary

| Method | Status | Real-time? | Requires Setup |
|--------|--------|------------|----------------|
| **Webhooks** | ⚠️ Partial | ✅ Yes | ✅ Cloud Pub/Sub |
| **Restore Purchases** | ✅ Working | ❌ No | ❌ None |
| **Auto-Restore on Launch** | ❌ Not implemented | ❌ No | ❌ None |

---

## Bottom Line

**Right Now**:
- ✅ Users can restore purchases to sync status
- ✅ Backend validates with Google Play API
- ✅ Database updates with current `autoRenewing` status
- ⚠️ Webhooks receive notifications but don't process them

**To Get Real-time Detection**:
1. Complete webhook handler (30 min)
2. Set up Cloud Pub/Sub (1 hour)
3. Test with Google Play Console

**Without Webhooks**:
- Status updates when user clicks "Restore Purchases"
- Works fine, just not automatic
- User sees outdated status until they restore

---

**Recommendation**: Complete the webhook handler ASAP for professional, real-time subscription management! 🚀
