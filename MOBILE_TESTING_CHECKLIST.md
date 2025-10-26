# Mobile Subscription & Promo Code Testing Checklist

This checklist helps you manually test the subscription and promo code features on Android and iOS.

## Prerequisites

### Android Testing
- [ ] Android device or emulator
- [ ] App installed from `.apk` (local) or Google Play (internal testing track)
- [ ] Test Google account added to internal testers list
- [ ] Product `premium_yearly` created in Google Play Console
- [ ] Service account permissions configured (24-hour wait completed)

### iOS Testing
- [ ] iOS device or simulator
- [ ] App installed via Xcode or TestFlight
- [ ] Test Apple ID account
- [ ] Product `premium-yearly` created in App Store Connect
- [ ] Sandbox testing enabled

---

## Test Plan

### **Test 1: Fresh Subscription Purchase (Android)**

**Steps**:
1. Open app → Login with test account
2. Go to Settings
3. Verify "Mobile Subscription" card appears
4. Check debug log shows:
   - Platform detected: `android`
   - Product loaded: `premium_yearly`
   - Price displayed correctly
5. Click "Subscribe Now - $29.99/year"
6. Complete purchase in Google Play dialog
7. Wait for success toast: "Subscription Activated"
8. Verify subscription status shows "Premium" with expiry date
9. Check backend logs for successful validation

**Expected Behavior**:
- ✅ Product loads within 5 seconds
- ✅ Google Play dialog opens
- ✅ Purchase completes without errors
- ✅ User upgraded to premium immediately
- ✅ Subscription persists after app restart

**Common Issues**:
- Product not loading → Check product ID matches `premium_yearly` exactly
- Permission error → Wait 24 hours after setting up service account
- Purchase not validating → Check server logs for API errors

---

### **Test 2: Fresh Subscription Purchase (iOS)**

**Steps**:
1. Open app → Login with test account (using sandbox Apple ID)
2. Go to Settings
3. Verify "Mobile Subscription" card appears
4. Check debug log shows:
   - Platform detected: `ios`
   - Product loaded: `premium-yearly`
   - Price displayed correctly
5. Click "Subscribe Now - $29.99/year"
6. Complete purchase in App Store dialog
7. Wait for success toast: "Subscription Activated"
8. Verify subscription status shows "Premium" with expiry date

**Expected Behavior**:
- ✅ Product loads within 5 seconds
- ✅ App Store dialog opens
- ✅ Purchase completes without errors
- ✅ User upgraded to premium immediately
- ✅ Subscription persists after app restart

**iOS Sandbox Testing Notes**:
- Use a sandbox Apple ID (not your real Apple ID)
- Subscriptions renew faster in sandbox (e.g., 5 minutes instead of 1 year)
- You can cancel and test multiple times

---

### **Test 3: Restore Purchases (Android)**

**Steps**:
1. Login with account that previously purchased
2. Go to Settings
3. Subscription shows "Free Plan" (not synced yet)
4. Click "Restore Purchases" button
5. Wait for processing
6. Verify toast: "Purchases Restored"
7. Subscription status updates to "Premium"

**Expected Behavior**:
- ✅ Finds existing subscription
- ✅ Validates with backend
- ✅ User immediately upgraded to premium
- ✅ Expiry date matches original purchase

---

### **Test 4: Restore Purchases (iOS)**

**Steps**:
1. Login with account that previously purchased (same sandbox Apple ID)
2. Go to Settings
3. Subscription shows "Free Plan" (not synced yet)
4. Click "Restore Purchases" button
5. Wait for processing
6. Verify toast: "Purchases Restored"
7. Subscription status updates to "Premium"

**Expected Behavior**:
- ✅ Finds existing subscription
- ✅ Validates with backend
- ✅ User immediately upgraded to premium
- ✅ Expiry date matches original purchase

---

### **Test 5: Promo Code Redemption (Android)**

**Prerequisites**:
- Generate a promo code in Google Play Console
- Or use a test promo code if available

**Steps**:
1. Open app → Go to Settings
2. Click "Redeem Promo Code" button
3. Enter promo code (e.g., `TESTCODE123`)
4. Click "Redeem Code"
5. App opens Google Play redemption URL
6. Complete redemption in Google Play
7. Google Play processes the promo code
8. Return to app
9. Either:
   - Purchase automatically validates (if webhook configured)
   - OR click "Restore Purchases" to sync
10. Verify subscription activated

**Expected Behavior**:
- ✅ Promo code dialog opens
- ✅ Google Play redemption page opens in browser/app
- ✅ Redemption completes successfully
- ✅ User upgraded to premium
- ✅ Redemption logged in backend (`promo_code_redemptions` table)

**Redemption History**:
- Open promo code dialog again
- Verify "Recent Redemptions" section shows the code
- Status should be "success"

---

### **Test 6: Promo Code Redemption (iOS)**

**Prerequisites**:
- Generate an offer code in App Store Connect
- Or use a test offer code if available

**Steps**:
1. Open app → Go to Settings
2. Click "Redeem Promo Code" button
3. Enter offer code
4. Click "Redeem Code"
5. App attempts to open StoreKit redemption sheet
   - If available: Native iOS redemption UI appears
   - If not: App Store redemption page opens in browser
6. Complete redemption
7. Return to app
8. Either:
   - Purchase automatically validates
   - OR click "Restore Purchases" to sync
9. Verify subscription activated

**Expected Behavior**:
- ✅ Redemption UI opens (native or web)
- ✅ Offer code validates successfully
- ✅ User upgraded to premium
- ✅ Redemption logged in backend

---

### **Test 7: Gift Code Redemption (Web Only)**

**Note**: This tests the web-based gift system, NOT promo codes.

**Prerequisites**:
- Another user gifted you a code (via web)
- Or create a gift code via web interface

**Steps**:
1. Open app on **WEB BROWSER** (not mobile app)
2. Go to Settings
3. Find "Redeem Upgrade Code" section
4. Enter 12-character gift code (e.g., `ABCD1234EFGH`)
5. Click "Redeem" button
6. Verify toast: "Upgrade successful"
7. Subscription status updates to "Premium"
8. Expiry date set to 1 year from now

**Expected Behavior**:
- ✅ Works on web browser
- ✅ Code validates successfully
- ✅ User immediately upgraded
- ✅ Gift marked as redeemed in database
- ✅ "Redeem Upgrade Code" section NOT visible on mobile apps (streamlined UX)

---

### **Test 8: Already Subscribed Error Handling (Android)**

**Steps**:
1. Login with account that already has active subscription
2. Go to Settings → Mobile Subscription
3. Try to purchase again
4. Google Play shows "You already own this item" message
5. Dialog dismisses
6. No error toast shown (expected behavior)

**Expected Behavior**:
- ✅ Google Play prevents duplicate purchase
- ✅ App handles gracefully (no crash)
- ✅ No confusing error messages shown

---

### **Test 9: Already Subscribed Error Handling (iOS)**

**Steps**:
1. Login with account that already has active subscription
2. Go to Settings → Mobile Subscription
3. Try to purchase again
4. App Store shows "You're already subscribed" message
5. Dialog dismisses
6. No error toast shown (expected behavior)

**Expected Behavior**:
- ✅ App Store prevents duplicate purchase
- ✅ App handles gracefully (no crash)
- ✅ No confusing error messages shown

---

### **Test 10: Subscription Cancellation (Android)**

**Prerequisites**:
- Active subscription

**Steps**:
1. Open Google Play app
2. Go to Subscriptions
3. Find "PrivyCalc Premium Yearly"
4. Click "Cancel subscription"
5. Confirm cancellation
6. Note: User KEEPS access until expiry date
7. Wait up to 24 hours for webhook to process (or manually test)
8. Open PrivyCalc app → Settings
9. Subscription should still show "Premium" with expiry date
10. `autoRenewing` flag should be `false` in database
11. After expiry date passes, user downgrades to "Free"

**Expected Behavior**:
- ✅ User keeps premium until expiry (not immediate revocation)
- ✅ Webhook processes cancellation (type 3)
- ✅ Database: `autoRenewing = false`, `isActive = true`
- ✅ After expiry: Webhook processes expiration (type 13)
- ✅ Database: `isActive = false`
- ✅ User downgraded to free plan

---

### **Test 11: Subscription Renewal (Android)**

**Steps**:
1. Wait for subscription renewal date (or fast-forward in sandbox)
2. Google Play automatically renews subscription
3. Webhook receives SUBSCRIPTION_RENEWED event (type 2)
4. Backend re-validates with Google Play API
5. Updates expiry date in database
6. User remains premium with new expiry date

**Expected Behavior**:
- ✅ Automatic renewal succeeds
- ✅ Webhook processes renewal
- ✅ New expiry date set correctly
- ✅ User stays premium continuously

---

### **Test 12: Web-Only Features (Compliance Check)**

**Steps**:
1. Open app on **Android**
2. Go to Settings
3. Verify "Gift Premium Access" card is **HIDDEN**
4. Verify "Redeem Upgrade Code" is **HIDDEN** (streamlined UX)
5. Verify "Mobile Subscription" and "Redeem Promo Code" ARE visible
6. Open app on **iOS**
7. Go to Settings
8. Verify "Gift Premium Access" card is **HIDDEN**
9. Verify "Redeem Upgrade Code" is **HIDDEN**
10. Verify "Mobile Subscription" and "Redeem Promo Code" ARE visible
11. Open app on **Web**
12. Go to Settings
13. Verify "Gift Premium Access" card IS visible
14. Verify "Redeem Upgrade Code" IS visible
15. Can create and redeem gift codes on web

**Expected Behavior**:
- ✅ Gift purchase hidden on mobile (App Store compliance)
- ✅ Gift redemption hidden on mobile (streamlined UX - use in-app purchase instead)
- ✅ Web has full access to gift system
- ✅ Mobile users must use in-app purchase or promo codes

---

## Debugging Tools

### Check Debug Logs (Mobile)
The `MobileSubscription` component has comprehensive debug logging:

```
🚀 MobileSubscription component initializing...
🔍 Platform detected: android
🌉 Using remote bridge mode (iframe)
🚀 Initializing store via bridge...
✅ Products loaded successfully!
  - premium_yearly: Premium Yearly ($29.99/year)
```

### Check Backend Logs
Monitor server logs for:
- Purchase validation attempts
- API responses from Google/Apple
- Webhook events
- Database updates

### Check Database

```sql
-- Check user subscription status
SELECT id, username, subscription_type, subscription_expires_at 
FROM users WHERE username = 'testuser';

-- Check mobile subscriptions
SELECT * FROM mobile_subscriptions 
WHERE user_id = 'USER_ID_HERE' 
ORDER BY created_at DESC;

-- Check promo code redemptions
SELECT * FROM promo_code_redemptions 
WHERE user_id = 'USER_ID_HERE' 
ORDER BY created_at DESC;
```

---

## Common Issues & Solutions

### Issue: Products not loading
**Symptoms**: "No products found" message  
**Causes**:
- Product not created in Play Console/App Store Connect
- Product ID mismatch
- Product still propagating (1-2 hours after creation)
- App package name doesn't match

**Solution**:
1. Verify product exists in console
2. Check product ID exactly matches:
   - Android: `premium_yearly`
   - iOS: `premium-yearly`
3. Wait 2 hours after creating product
4. Rebuild and reinstall app

### Issue: Purchase validation fails
**Symptoms**: "Invalid purchase token" or permission errors  
**Causes**:
- Service account not configured
- Permissions not granted
- 24-hour propagation delay

**Solution**:
1. Check service account permissions in Play Console
2. Wait 24 hours after granting permissions
3. Try "edit product" trick to force refresh
4. Check server logs for exact error

### Issue: Webhook not triggering
**Symptoms**: Subscription status doesn't update automatically  
**Causes**:
- Webhook URL not configured in Play Console
- Pub/Sub topic not set up
- Server not receiving webhook calls

**Solution**:
1. Check webhook URL in Play Console
2. Use "Restore Purchases" as workaround
3. Verify webhook endpoint is accessible
4. Check server logs for webhook calls

---

## Test Result Tracking

Use this table to track your test results:

| Test # | Test Name | Android | iOS | Web | Notes |
|--------|-----------|---------|-----|-----|-------|
| 1 | Fresh Purchase | ⬜ | ⬜ | N/A |  |
| 2 | Restore Purchases | ⬜ | ⬜ | N/A |  |
| 3 | Promo Code Redemption | ⬜ | ⬜ | N/A |  |
| 4 | Gift Code Redemption | ⬜ | ⬜ | ⬜ |  |
| 5 | Already Subscribed | ⬜ | ⬜ | N/A |  |
| 6 | Cancellation Flow | ⬜ | ⬜ | N/A |  |
| 7 | Renewal Flow | ⬜ | ⬜ | N/A |  |
| 8 | Web-Only Compliance | ⬜ | ⬜ | ⬜ |  |

✅ = Pass | ❌ = Fail | ⬜ = Not Tested

---

## Next Steps

After testing, document any issues found and prioritize fixes:

1. **Critical**: Issues that break core functionality
2. **High**: Issues that affect user experience significantly
3. **Medium**: Minor bugs or edge cases
4. **Low**: Cosmetic issues or nice-to-haves

Good luck with testing! 🚀
