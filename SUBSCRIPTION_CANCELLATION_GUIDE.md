# How Users Can Unsubscribe from PrivyCalc Premium

## Overview

For mobile in-app subscriptions (Google Play / Apple App Store), users **must cancel through the app store**, not through your app. This is required by both Google and Apple's policies.

---

## For Android Users (Google Play)

### Method 1: Through Google Play Store App
1. Open the **Google Play Store** app on their Android device
2. Tap the **profile icon** (top right)
3. Tap **Payments & subscriptions** → **Subscriptions**
4. Find **PrivyCalc** in the list
5. Tap **PrivyCalc**
6. Tap **Cancel subscription**
7. Follow the on-screen instructions
8. Confirm cancellation

### Method 2: Through Web Browser
1. Go to https://play.google.com/store/account/subscriptions
2. Sign in with their Google account
3. Find **PrivyCalc** in the list
4. Click **Manage**
5. Click **Cancel subscription**
6. Confirm cancellation

**Important Notes:**
- Users keep premium access until the current billing period ends
- They won't be charged again after cancellation
- They can resubscribe anytime

---

## For iOS Users (Apple App Store)

### Method 1: Through iPhone Settings
1. Open **Settings** on their iPhone
2. Tap their **name** at the top
3. Tap **Subscriptions**
4. Find **PrivyCalc** in the list
5. Tap **PrivyCalc**
6. Tap **Cancel Subscription**
7. Confirm cancellation

### Method 2: Through App Store App
1. Open the **App Store** app
2. Tap the **profile icon** (top right)
3. Tap **Subscriptions**
4. Find **PrivyCalc** in the list
5. Tap **PrivyCalc**
6. Tap **Cancel Subscription**
7. Confirm cancellation

**Important Notes:**
- Users keep premium access until the current billing period ends
- They won't be charged again after cancellation
- They can resubscribe anytime

---

## What Happens After Cancellation?

### User Experience
1. **Immediate**: Subscription marked as "will not renew"
2. **Until expiry**: User keeps premium access
3. **After expiry**: User downgraded to Free plan automatically
4. **Messages**: Daily message limits apply again

### Backend Behavior (Your Server)
1. Google/Apple sends webhook notification about cancellation
2. Backend receives webhook at `/api/mobile-subscription/webhook/google` or `/webhook/apple`
3. Backend marks subscription as `autoRenewing: false`
4. On expiry date, backend automatically:
   - Sets `isActive: false`
   - Downgrades user to `subscriptionType: "free"`
   - User loses premium benefits

---

## Current Implementation Status

### ✅ What's Already Built

**Backend Functions:**
- ✅ `cancelMobileSubscription()` - Marks subscription as canceled
- ✅ `syncUserSubscriptionStatus()` - Auto-downgrades expired users
- ✅ Webhook endpoints ready for Google/Apple notifications

**Webhook Endpoints:**
- ✅ `POST /api/mobile-subscription/webhook/google` - Receives Google Play notifications
- ✅ `POST /api/mobile-subscription/webhook/apple` - Receives Apple App Store notifications

**Auto-Downgrade Logic:**
- ✅ When subscription expires, user is automatically downgraded to Free
- ✅ Daily message limits re-apply
- ✅ Works for both platforms

### ⚠️ What Needs Completion

**Webhook Implementation:**
The webhook endpoints exist but need to be completed to fully handle cancellation events:

```javascript
// Currently TODO:
// 1. Parse cancellation notifications from Google/Apple
// 2. Look up subscription by purchase token
// 3. Call cancelMobileSubscription(subscriptionId)
// 4. Sync user subscription status
```

**In-App Information:**
- Could add a "Manage Subscription" section in Settings
- Could show link/instructions to app store subscription management
- Could display subscription expiry date

---

## Why Users Can't Cancel In-App

### Google Play & Apple App Store Policies Require:
1. **All subscription management through their platforms**
2. **Refunds handled by the app stores, not developers**
3. **Payment disputes managed by Google/Apple**
4. **Subscription status controlled by stores**

### Benefits of App Store Cancellation:
- ✅ Users can request refunds from Google/Apple
- ✅ Centralized subscription management (all apps in one place)
- ✅ Protection against fraudulent cancellation requests
- ✅ Automatic handling of payment failures
- ✅ Clear billing history

---

## Recommended: Add "Manage Subscription" Section

You can improve UX by adding a section in your Settings page that:

1. **Shows current subscription status**:
   - "Premium (Active)"
   - "Expires on: October 26, 2026"
   - "Auto-renews: Yes/No"

2. **Provides instructions**:
   ```
   To manage or cancel your subscription:
   
   Android: Open Google Play Store → Profile → Subscriptions
   iOS: Open Settings → [Your Name] → Subscriptions
   ```

3. **Links to subscription management**:
   - Android: Link to `https://play.google.com/store/account/subscriptions`
   - iOS: Link to `https://apps.apple.com/account/subscriptions`

---

## Summary

**Current Flow:**
1. ✅ Users subscribe through Google Play or App Store
2. ✅ Backend validates and activates subscription
3. ⚠️ Users cancel through app store (webhook needs completion)
4. ✅ On expiry, backend auto-downgrades to Free

**Action Required:**
- Complete webhook handlers to process cancellation events
- (Optional) Add "Manage Subscription" UI in Settings
- (Optional) Add instructions for canceling in Help/FAQ section

---

**Bottom Line**: Users cancel through Google Play Store or Apple App Store, not through your app. This is standard for all mobile apps with in-app subscriptions.
