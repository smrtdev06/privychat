# 📱 Google Play Subscription Setup Guide for PrivyCalc

This guide will walk you through creating the yearly subscription product for your app.

---

## 📋 **Required Product ID**

Your app is configured to use this exact product ID:

| Product ID | Type | Duration | Price |
|------------|------|----------|-------|
| `premium_yearly` | Auto-renewing subscription | 1 year | $29.99/year |

⚠️ **IMPORTANT:** Use this exact ID - it's hardcoded in your app and cannot be changed!

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

### **Step 3: Create Yearly Subscription**

#### 3.1 - Create Subscription Product

1. Click **"Create subscription"** button
2. Fill in the form:

   **Product ID:**
   ```
   premium_yearly
   ```
   ⚠️ **CRITICAL:** Use exactly this ID - it cannot be changed later!

   **Name:**
   ```
   Premium Yearly
   ```
   This is what users see in emails and the subscription center.

   **Description (Optional):**
   ```
   Unlimited secure messaging for one year - hidden in plain sight
   ```

3. Click **"Create"**

#### 3.2 - Add Base Plan

Now you need to create a "base plan" (the actual subscription offering):

1. Click **"Add base plan"** button
2. Fill in the base plan details:

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

   **Grace period (Optional but Recommended):**
   ```
   3 days
   ```
   Gives users time to fix payment issues before losing access.

   **Tags (Optional):**
   ```
   premium, yearly
   ```

3. Click **"Continue"**

#### 3.3 - Set Pricing

1. Click **"Set prices"**
2. Choose pricing method:
   - **Option A:** Set a default price for all countries
   - **Option B:** Set custom prices per country

   **Price:**
   ```
   $29.99 USD
   ```

3. Google will auto-convert to other currencies
4. Click **"Apply prices"**

**Pricing Breakdown:**
- $29.99 per year = $2.50/month
- Much cheaper than typical messaging apps ($10-15/month)
- Excellent value for unlimited secure messaging

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
   - Price: Uses base plan price ($29.99)

4. Click **"Save"** then **"Activate"**

#### 3.5 - Activate Base Plan

1. Review all settings
2. Click **"Activate"** to make the base plan live
3. ✅ Yearly subscription is now ready!

---

## ✅ **Verify Your Setup**

After creating the subscription, you should see:

```
Subscriptions (1)
└── premium_yearly
    └── Base plan: yearly-autorenewing ($29.99/year)
        └── Offer: free-trial-7days (7-day free trial)
```

---

## 🧪 **Test Your Subscription**

### Enable License Testing

1. In Play Console, go to: **Setup → License testing**
2. Add your test email addresses (comma-separated)
3. Test accounts can make purchases without being charged

### Testing Steps

1. Install your app from Internal Testing track
2. Sign in with a test account
3. Navigate to Settings → Mobile Subscription
4. You should see:
   - ✅ "Premium Yearly - $29.99/year"
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

## 💰 **Premium Features Included**

What users get for $29.99/year:

✅ **Unlimited Messaging**
   - No daily message limits (free users get 1 message/day)
   
✅ **Media Sharing**
   - Send images, videos, voice messages
   
✅ **Stealth Mode**
   - Calculator disguise with PIN unlock
   - No visible messaging app on phone
   
✅ **Priority Support**
   - Faster response to issues
   
✅ **Ad-Free Experience**
   - No advertisements

✅ **Future Features**
   - Access to new premium features as they're released

---

## 🔧 **Troubleshooting**

### "No subscriptions found" in app

**Causes:**
1. Product ID doesn't match exactly (`premium_yearly`)
2. Base plan not activated
3. App not published to at least Internal Testing
4. License testing not configured for test account

**Fix:**
1. Double-check product ID is exactly: `premium_yearly`
2. Ensure base plan is **Activated** (not Draft)
3. Upload APK to Internal Testing and wait 1-2 hours for propagation
4. Add test email to License Testing

### Product shows as "pending" in app

**Cause:** Google Play takes 1-2 hours to propagate new products

**Fix:** Wait 1-2 hours after creating/activating subscription

### Can't find "Subscriptions" menu

**Cause:** App not uploaded or Merchant Account not set up

**Fix:**
1. Upload at least one APK/AAB to Internal Testing
2. Set up Google Merchant Account (in Play Console settings)

---

## 💡 **Why $29.99/year?**

**Value Proposition:**
- Equivalent to $2.50/month
- Less than one coffee per month
- Cheaper than any streaming service
- Much less than competitors ($10-15/month)

**Conversion Strategy:**
- Free users experience the 1 message/day limit
- They see the value of unlimited messaging
- $29.99 feels reasonable for a full year
- 7-day free trial lets them try before buying

**Revenue Projection:**
- 100 subscribers = $2,999/year
- 500 subscribers = $14,995/year
- 1,000 subscribers = $29,990/year

---

## 📞 **Need Help?**

- **Google Play Console Help:** https://support.google.com/googleplay/android-developer
- **Subscription Policies:** https://support.google.com/googleplay/android-developer/answer/140504
- **In-App Billing Documentation:** https://developer.android.com/google/play/billing

---

## ✨ **Next Steps After Setup**

1. ✅ Create premium_yearly subscription
2. ✅ Set price to $29.99/year
3. ✅ (Optional) Add 7-day free trial
4. ✅ Upload signed APK to Internal Testing
5. ✅ Add yourself as a license tester
6. ✅ Install app and test subscription flow
7. ✅ Monitor the browser console for detailed purchase logs
8. ✅ Once working, promote to production!

---

**Your subscription will appear in the app within 1-2 hours of activation!** 🎉

Good luck with your launch! 🚀
