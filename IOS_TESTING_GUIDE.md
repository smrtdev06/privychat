# iOS Subscription Testing & Webhook Setup Guide

## Part 1: Setting Up Sandbox Testing

### Step 1: Create Sandbox Test Accounts

1. Go to **App Store Connect** (https://appstoreconnect.apple.com)
2. Click **Users and Access** in the top menu
3. Click **Sandbox** tab
4. Click the **+** button to add a tester
5. Fill in the form:
   - **First Name**: Test
   - **Last Name**: User
   - **Email**: Use a unique email (e.g., `testuser1@yourdomain.com`)
   - **Password**: Create a strong password (you'll use this to sign in)
   - **Country/Region**: Select your country
   - **App Store Territory**: Same as country
6. Click **Invite**
7. Create 2-3 test accounts for different scenarios

**Important Notes:**
- ⚠️ Never sign into iCloud with sandbox accounts
- ⚠️ Only use sandbox accounts when prompted during in-app purchase
- ⚠️ These emails don't need to be real - Apple doesn't send verification emails

---

### Step 2: Set Up Your Subscription in App Store Connect

1. Go to **App Store Connect** → **My Apps**
2. Select your app (or create a new app if you haven't)
3. Click **In-App Purchases** (or **Subscriptions** in newer interface)
4. Click the **+** button to create a new subscription
5. Configure your subscription:

   **Product Information:**
   - **Reference Name**: Premium Yearly Subscription
   - **Product ID**: `premium-yearly` (must match your code)
   - **Subscription Group Name**: Premium Access (create if needed)

   **Subscription Prices:**
   - **Price**: $29.99
   - **Duration**: 1 Year

   **Subscription Review Information:**
   - **Screenshot**: Upload a screenshot showing where subscription appears
   - **Review Notes**: "Annual premium subscription for unlimited messaging"

6. Click **Save**
7. **Status** should be "Ready to Submit" (you don't need to submit the app yet for testing)

---

### Step 3: Build and Deploy Your iOS App

1. **Build your Capacitor iOS app:**
   ```bash
   cd /path/to/privycalc
   npx cap sync ios
   npx cap open ios
   ```

2. **Configure Bundle ID** in Xcode:
   - Select your project in the left sidebar
   - Under **General** → **Identity**
   - **Bundle Identifier**: `com.newhomepage.privycalc`

3. **Enable In-App Purchase Capability:**
   - Click **Signing & Capabilities** tab
   - Click **+ Capability**
   - Add **In-App Purchase**

4. **Connect your iPhone/iPad:**
   - Plug in your device via USB
   - Trust the device when prompted
   - Select your device from the scheme selector at the top

5. **Run the app:**
   - Click the ▶️ Play button in Xcode
   - App will install and launch on your device

---

### Step 4: Test the Purchase Flow

1. **Sign out of your real Apple ID:**
   - On your iPhone/iPad: **Settings → App Store**
   - Tap your Apple ID at the top
   - Tap **Sign Out**
   - ⚠️ Only sign out of App Store, NOT iCloud

2. **Open your PrivyCalc app:**
   - Register a new account (or login)
   - Navigate to **Settings**
   - Scroll to the **Subscription** section

3. **Start a purchase:**
   - Tap **Subscribe** button
   - A system popup will appear asking to sign in
   - Use your **sandbox test account** credentials
   - Confirm the purchase (you won't be charged)

4. **Subscription will activate immediately:**
   - In sandbox, subscriptions renew every **5 minutes** (simulates 1 year)
   - Auto-renews 6 times, then expires
   - Check your app - you should now have Premium status

---

### Step 5: Test Subscription Scenarios

**Test Renewal (wait 5 minutes):**
- Your subscription will auto-renew
- Check if your app still shows Premium status

**Test Cancellation:**
1. On your device: **Settings → App Store → Sandbox Account**
2. Tap **Manage**
3. Find your subscription and tap **Cancel Subscription**
4. Wait for the current period to expire (up to 5 minutes)
5. Your app should detect the expiration and downgrade to Free

**Test Multiple Devices:**
1. Install app on a second device
2. Sign in with the same user account
3. Tap **Restore Purchases** in Settings
4. Subscription should sync across devices

---

## Part 2: Setting Up Apple Webhooks

### What Are Webhooks?

Webhooks are automatic notifications from Apple when subscription events happen:
- Purchase completed
- Subscription renewed
- Subscription cancelled
- Subscription expired
- Refund issued

Your server receives these notifications in real-time and can update the user's subscription status.

---

### Step 1: Get Your Webhook URL

Your webhook endpoint is already built! It's:

```
https://your-replit-app-url.replit.app/api/mobile-subscriptions/apple/webhook
```

**To find your Replit URL:**
1. Look at the webview preview in Replit
2. Click the **Open in new tab** icon
3. Copy the URL (e.g., `https://abc123xyz.replit.app`)
4. Your webhook URL is: `https://abc123xyz.replit.app/api/mobile-subscriptions/apple/webhook`

**For Production (after publishing):**
- Your webhook URL will be on your published domain
- Example: `https://yourdomain.replit.app/api/mobile-subscriptions/apple/webhook`

---

### Step 2: Configure Webhooks in App Store Connect

1. Go to **App Store Connect** (https://appstoreconnect.apple.com)
2. Click **Apps** → Select your app
3. Click **App Information** (in the left sidebar under General)
4. Scroll down to **App Store Server Notifications**
5. Click **+ Add Server URL**

6. **Configure the webhook:**
   - **Production Server URL**: `https://yourdomain.replit.app/api/mobile-subscriptions/apple/webhook`
   - **Sandbox Server URL**: `https://yourdomain.replit.app/api/mobile-subscriptions/apple/webhook`
   - **Version**: Select `Version 2` (latest)

7. Click **Save**

8. **Test the connection:**
   - Click **Test** button next to your webhook URL
   - Apple will send a test notification
   - Check your server logs to confirm it was received

---

### Step 3: Verify Webhook is Working

**Method 1: Check Server Logs**
```bash
# In Replit, view logs in the Console
# Look for messages like:
# "Received Apple webhook notification"
# "Processing notification type: SUBSCRIBED"
```

**Method 2: Test with Real Purchase**
1. Make a sandbox purchase (as described above)
2. Your webhook should receive a `SUBSCRIBED` notification
3. Check database to confirm subscription was created

**Method 3: Test Cancellation**
1. Cancel the subscription in sandbox
2. Wait for it to expire (up to 5 minutes)
3. Your webhook should receive an `EXPIRED` notification
4. Check database to confirm subscription was deactivated

---

## Part 3: Understanding Webhook Events

Your webhook endpoint (`/api/mobile-subscriptions/apple/webhook`) handles these events:

| Event Type | When It Happens | What Your App Does |
|------------|----------------|-------------------|
| `SUBSCRIBED` | User purchases subscription | Create subscription record, activate premium |
| `DID_RENEW` | Auto-renewal successful | Extend subscription end date |
| `DID_FAIL_TO_RENEW` | Payment failed | Mark as "at risk", keep active until grace period ends |
| `EXPIRED` | Subscription ended | Deactivate premium, downgrade to free |
| `REFUND` | User got refund | Immediately revoke premium access |

---

## Part 4: Testing Checklist

### Initial Purchase ✓
- [ ] User can see subscription option in Settings
- [ ] Tapping Subscribe shows Apple payment sheet
- [ ] Purchase completes successfully
- [ ] User immediately gets Premium status
- [ ] Webhook receives `SUBSCRIBED` event
- [ ] Database shows active subscription

### Auto-Renewal ✓
- [ ] Wait 5 minutes (sandbox accelerated time)
- [ ] Subscription auto-renews
- [ ] User still has Premium status
- [ ] Webhook receives `DID_RENEW` event
- [ ] Database shows updated expiration date

### Cancellation ✓
- [ ] User cancels in Settings → Sandbox Account
- [ ] User keeps Premium until period ends
- [ ] After expiration, user downgrades to Free
- [ ] Webhook receives `EXPIRED` event
- [ ] Database shows inactive subscription

### Restore Purchases ✓
- [ ] Install app on second device
- [ ] Login with same account
- [ ] Tap "Restore Purchases"
- [ ] Premium status syncs across devices

### Cross-Platform ✓
- [ ] iOS subscription works on iOS device
- [ ] Premium status shows on web version
- [ ] Premium status shows on Android device (if applicable)

---

## Important Notes

### Sandbox vs Production

**Sandbox (Testing):**
- Subscriptions renew every 5 minutes
- Auto-renews 6 times then expires
- No real money charged
- Use sandbox test accounts
- Faster testing cycles

**Production (Live):**
- Subscriptions renew normally (1 year)
- Continues until user cancels
- Real money charged
- Real Apple IDs
- Same webhook endpoint works for both

### Security

Your webhook endpoint is **publicly accessible** but:
- ✅ Apple sends signed notifications (you can verify signature)
- ✅ Currently accepts all requests (you've confirmed this is intentional)
- ✅ For production, consider adding signature verification

### Troubleshooting

**"Cannot connect to iTunes Store":**
- Make sure you're signed out of real Apple ID
- Use sandbox account only when prompted during purchase
- Check internet connection

**"This product is not available":**
- Wait 15-30 minutes after creating product in App Store Connect
- Make sure Product ID matches: `premium-yearly`
- Verify product status is "Ready to Submit"

**Webhook not receiving notifications:**
- Check webhook URL is correct
- Verify app is using correct Bundle ID
- Test webhook with Test button in App Store Connect
- Check server logs for errors

**Purchase succeeds but app doesn't update:**
- Check receipt validation is working
- Verify webhook endpoint is processing events
- Check database for subscription record
- Look for errors in server logs

---

## Quick Reference

**Sandbox Test Account Sign In:**
- Device: Settings → App Store → Sign Out (of real ID)
- During Purchase: Use sandbox credentials when prompted

**Check Subscription Status:**
- Device: Settings → App Store → Sandbox Account → Manage

**Webhook URL:**
```
https://yourdomain.replit.app/api/mobile-subscriptions/apple/webhook
```

**Product ID:**
- iOS: `premium-yearly`
- Android: `premium_yearly` (underscore, not hyphen)

**Renewal Time in Sandbox:**
- 1 Year subscription → Renews every 5 minutes
- Auto-renews 6 times (30 minutes total)
- Then expires

---

## Next Steps

1. ✅ Create sandbox test accounts
2. ✅ Set up subscription product in App Store Connect
3. ✅ Build and install app on test device
4. ✅ Make a test purchase
5. ✅ Configure webhook URL
6. ✅ Test webhook notifications
7. ✅ Verify all scenarios work correctly

Once testing is complete, you can submit your app to the App Store. The same code and webhook will work in production!

**Need Help?** Check the troubleshooting section or contact Apple Developer Support.
