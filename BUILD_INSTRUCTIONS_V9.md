# Build Instructions for Version 9.0 (Product ID Fix)

## ✅ What Was Fixed in This Version
- Changed product ID format from `premium-yearly` to **`premium_yearly:premium-yearly`**
- This matches Google Play's base plan subscription format
- Your Google Play Console is configured correctly - don't change it!

## 📋 Google Play Console Verification

Before building, verify your Google Play Console settings:

### 1. Product Configuration
Go to: **Monetize → Subscriptions → Premium Yearly**

✅ Check:
- **Product ID**: `premium_yearly` (with underscore)
- **Base Plan ID**: `premium-yearly` (with hyphen)
- **Price**: $29.99/year
- **Status**: Active

### 2. License Testing
Go to: **Setup → License testing**

✅ Add test Gmail account(s):
- Must be different from your developer account
- These accounts can test subscriptions without payment
- Example: `yourtest@gmail.com`

### 3. Internal Testing Track
Go to: **Testing → Internal testing**

✅ Create release track if not already created
✅ Add testers (can be same as license testing accounts)

---

## 🔨 Build Commands

Run these commands in order:

```bash
# 1. Build the web app
npm run build

# 2. Sync to Capacitor
npx cap sync android

# 3. Navigate to Android directory
cd android

# 4. Build release APK
./gradlew assembleRelease

# 5. APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📤 Upload to Google Play Console

### Step 1: Create New Release
1. Go to **Testing → Internal testing**
2. Click **Create new release**

### Step 2: Upload APK
1. Click **Upload** 
2. Select: `android/app/build/outputs/apk/release/app-release.apk`
3. Version will show: **9.0 (9)**

### Step 3: Release Notes
```
Version 9.0
- Fixed Google Play Billing product ID format
- Subscriptions now use correct base plan format (premium_yearly:premium-yearly)
```

### Step 4: Review and Roll Out
1. Click **Review release**
2. Click **Start rollout to Internal testing**

### Step 5: Wait for Processing
- Takes 5-15 minutes for Google to process
- You'll get email when ready

---

## 📱 Install and Test

### Step 1: Opt-in to Internal Testing
1. Open the internal testing link from Google Play Console
2. Click **Become a tester**
3. Download app from Play Store

### Step 2: Open App and Check Debug Log
The **native debug overlay** (green panel at bottom of screen) should show:

✅ **Good Signs:**
```
✓ Store initialized: GooglePlay
✓ Platform detected: android
✓ Product registered: premium_yearly:premium-yearly
✓ Products loaded: 1
Price: $29.99/year
```

❌ **Bad Signs (Old Version):**
```
Products Found: 0
Product ID mismatch error
```

### Step 3: Test Purchase Flow
1. Go to **Settings → Subscription**
2. You should see the subscription card
3. Click **Upgrade to Premium**
4. Google Play purchase dialog should appear
5. As a license tester, you'll see **"No charge"** or test payment

---

## 🐛 Troubleshooting

### ❌ Still showing 0 products?

**Check 1: APK Version**
- Open app, check version in Settings
- Should say **Version 9.0**
- If not, you're running old APK

**Check 2: License Testing**
- Make sure your Gmail is added to License Testing in Play Console
- Must be signed in with that Gmail on your phone

**Check 3: Package Name**
- Debug log should show: `com.newhomepage.privychat`
- If different, rebuild APK

**Check 4: Product Propagation**
- Products can take 1-2 hours to propagate after first creation
- Try again in 30 minutes

**Check 5: App Signature**
- Make sure you uploaded APK to Internal Testing
- Debug builds don't work with Google Play Billing

---

## ✅ Success Checklist

Before testing:
- [ ] Google Play product ID is `premium_yearly`
- [ ] Google Play base plan ID is `premium-yearly`
- [ ] License testing account configured
- [ ] Built release APK with version 9.0
- [ ] Uploaded to Internal Testing track
- [ ] Waited for Google Play processing (5-15 min)
- [ ] Installed from Play Store (not sideload)
- [ ] Signed in with license testing Gmail

---

## 🎯 Expected Result

When everything is working:
1. Native debug overlay shows product loaded
2. Settings → Subscription shows "$29.99/year" card
3. Clicking upgrade shows Google Play purchase dialog
4. Purchase completes (no charge for test account)
5. App shows "Premium Active"

---

## 📞 If Still Not Working

Check the native debug log overlay and report:
1. Platform detected
2. Products found count
3. Any error messages
4. APK version number

The debug overlay at the bottom of your screen has all the diagnostic info!
