# 📱 Google Play Subscription Setup Guide for PrivyCalc

This guide will walk you through creating the subscription products needed for your app.

---

## 📋 **Required Product IDs**

Your app is configured to use these exact product IDs:

| Product ID | Type | Recommended Duration | Recommended Price |
|------------|------|---------------------|-------------------|
| `premium_monthly` | Auto-renewing subscription | 1 month | $2.99 - $4.99/month |
| `premium_yearly` | Auto-renewing subscription | 1 year | $19.99 - $29.99/year |

⚠️ **IMPORTANT:** Use these exact IDs - they're hardcoded in your app!

---

## 🚀 **Prerequisites**

Before you start:
- [ ] Create a Google Play Developer account ($25 one-time fee)
- [ ] Upload your signed APK/AAB to Google Play Console (at least to Internal Testing)
- [ ] Set up Google Merchant Account (required for paid apps/subscriptions)
- [ ] Have your app created in Play Console

---

## 📝 **Step-by-Step Setup**

### **Step 1: Access Google Play Console**

1. Go to: [Google Play Console](https://play.google.com/console)
2. Sign in with your Google account
3. Select your app from the list (or create one if you haven't)

---

### **Step 2: Navigate to Subscriptions**

In the left sidebar, navigate to:
```
Monetize with Play → Products → Subscriptions
```

You should see a page that says "No subscriptions created yet"

---

### **Step 3: Create Monthly Subscription**

#### 3.1 - Create Subscription Product

1. Click **"Create subscription"** button
2. Fill in the form:

   **Product ID:**
   ```
   premium_monthly
   ```
   ⚠️ **CRITICAL:** Use exactly this ID - it cannot be changed later!

   **Name:**
   ```
   Premium Monthly
   ```
   This is what users see in emails and the subscription center.

   **Description (Optional):**
   ```
   Unlimited messaging, media sharing, and no ads
   ```

3. Click **"Create"**

#### 3.2 - Add Base Plan

Now you need to create a "base plan" (the actual subscription offering):

1. Click **"Add base plan"** button
2. Fill in the base plan details:

   **Base plan ID:**
   ```
   monthly-autorenewing
   ```

   **Type:**
   ```
   Auto-renewing ✓
   ```

   **Billing period:**
   ```
   1 Month
   ```

   **Grace period (Optional but Recommended):**
   ```
   3 days
   ```
   Gives users time to fix payment issues before losing access.

   **Tags (Optional):**
   ```
   premium, monthly
   ```

3. Click **"Continue"**

#### 3.3 - Set Pricing

1. Click **"Set prices"**
2. Choose pricing method:
   - **Option A:** Set a default price for all countries
   - **Option B:** Set custom prices per country

   **Recommended Default Price:**
   ```
   $2.99 USD (or your preferred price)
   ```

3. Google will auto-convert to other currencies
4. Click **"Apply prices"**

#### 3.4 - Add Free Trial (Optional but Recommended)

1. Click **"Add offer"**
2. Fill in offer details:

   **Offer ID:**
   ```
   free-trial-7days
   ```

   **Offer tags:**
   ```
   trial
   ```

   **Eligibility:**
   ```
   ☑ New customer acquisition
   ```

   **Developer-determined eligibility:**
   ```
   ☐ Not selected (leave unchecked)
   ```

3. Click **"Add phase"** to configure the trial:

   **Phase 1 - Free Trial:**
   - Type: `Free`
   - Duration: `7 days` (or 3 days, 14 days, etc.)
   - Recurrence: `1 billing period`

   **Phase 2 - Full Price:**
   - Type: `Regular price`
   - Duration: Automatically set to subscription duration
   - Price: Uses base plan price ($2.99)

4. Click **"Save"** then **"Activate"**

#### 3.5 - Activate Base Plan

1. Review all settings
2. Click **"Activate"** to make the base plan live
3. ✅ Monthly subscription is now ready!

---

### **Step 4: Create Yearly Subscription**

Repeat the same process for the yearly subscription:

#### 4.1 - Create Subscription Product

1. Click **"Create subscription"** button
2. Fill in:

   **Product ID:**
   ```
   premium_yearly
   ```

   **Name:**
   ```
   Premium Yearly
   ```

   **Description:**
   ```
   Best value - Unlimited messaging for a full year
   ```

3. Click **"Create"**

#### 4.2 - Add Base Plan

1. Click **"Add base plan"**
2. Fill in:

   **Base plan ID:**
   ```
   yearly-autorenewing
   ```

   **Type:**
   ```
   Auto-renewing ✓
   ```

   **Billing period:**
   ```
   1 Year
   ```

   **Grace period:**
   ```
   3 days
   ```

3. Click **"Continue"**

#### 4.3 - Set Pricing

**Recommended Yearly Price:**
```
$19.99 - $29.99 USD
```

**Pricing Strategy:**
- Monthly: $2.99/month = $35.88/year
- Yearly: $19.99/year = **44% savings!**
- Or: $29.99/year = **16% savings**

💡 **Tip:** Price yearly at 8-10 months worth of monthly cost to incentivize yearly purchases.

#### 4.4 - Add Free Trial (Optional)

Same as monthly - offer 7-day free trial for new users.

#### 4.5 - Activate

Click **"Activate"** to make the yearly subscription live.

---

## ✅ **Verify Your Setup**

After creating both subscriptions, you should see:

```
Subscriptions (2)
├── premium_monthly
│   └── Base plan: monthly-autorenewing ($2.99/month)
│       └── Offer: free-trial-7days (7-day free trial)
└── premium_yearly
    └── Base plan: yearly-autorenewing ($19.99/year)
        └── Offer: free-trial-7days (7-day free trial)
```

---

## 🧪 **Test Your Subscriptions**

### Enable License Testing

1. In Play Console, go to: **Setup → License testing**
2. Add your test email addresses (comma-separated)
3. Test accounts can make purchases without being charged

### Testing Steps

1. Install your app from Internal Testing track
2. Sign in with a test account
3. Navigate to Settings → Mobile Subscription
4. You should see:
   - ✅ "Premium Monthly - $2.99/month"
   - ✅ "Premium Yearly - $19.99/year"
5. Click "Subscribe" to test the purchase flow

---

## 📊 **Subscription Management**

### Monitor Subscriptions

In Play Console:
```
Monetize with Play → Subscriptions
```

Here you can:
- View active subscribers
- See revenue reports
- Manage refunds
- Update pricing (with proper notification to users)

### Important Notes

**Cannot Delete Subscriptions:**
- Once created, subscriptions cannot be deleted
- You can only deactivate/archive them

**Product ID is Permanent:**
- Cannot change product IDs after creation
- Cannot reuse product IDs across apps

**Price Changes:**
- Existing subscribers must be notified
- Must opt-in to price increases (per Google policy)

---

## 💰 **Pricing Recommendations**

Based on your freemium model (1 message/day free):

### Conservative Pricing:
- Monthly: $2.99
- Yearly: $19.99 (44% savings)

### Competitive Pricing:
- Monthly: $4.99
- Yearly: $29.99 (50% savings)

### Premium Pricing:
- Monthly: $9.99
- Yearly: $59.99 (50% savings)

💡 **Tip:** Start with conservative pricing, then increase based on user feedback and retention metrics.

---

## 🔧 **Troubleshooting**

### "No subscriptions found" in app

**Causes:**
1. Product IDs don't match exactly (`premium_monthly` vs `premium_monthly_sub`)
2. Base plan not activated
3. App not published to at least Internal Testing
4. License testing not configured for test account

**Fix:**
1. Double-check product IDs are exactly: `premium_monthly` and `premium_yearly`
2. Ensure base plans are **Activated** (not Draft)
3. Upload APK to Internal Testing and wait 1-2 hours for propagation
4. Add test email to License Testing

### Products show as "pending" in app

**Cause:** Google Play takes 1-2 hours to propagate new products

**Fix:** Wait 1-2 hours after creating/activating subscriptions

---

## 📞 **Need Help?**

- **Google Play Console Help:** https://support.google.com/googleplay/android-developer
- **Subscription Policies:** https://support.google.com/googleplay/android-developer/answer/140504
- **In-App Billing Documentation:** https://developer.android.com/google/play/billing

---

## ✨ **Next Steps After Setup**

1. ✅ Create both subscription products
2. ✅ Upload signed APK to Internal Testing
3. ✅ Add yourself as a license tester
4. ✅ Install app and test subscription flow
5. ✅ Monitor the browser console for detailed purchase logs
6. ✅ Once working, promote to production!

---

**Your subscriptions will appear in the app within 1-2 hours of activation!** 🎉

Good luck with your launch! 🚀
