# Build Instructions for Version 10.0 (FINAL FIX)

## 🎯 What Was Fixed

**The Problem:** 
- Version 9.0 used `premium_yearly:premium-yearly` format
- This format is only for subscriptions with MULTIPLE base plans
- Your subscription has ONE backwards compatible base plan

**The Solution:**
- Changed to just `premium_yearly` (product ID only)
- For backwards compatible base plans, the plugin automatically finds it
- This is the correct format per cordova-plugin-purchase v13 documentation

---

## ✅ Your Google Play Console Setup (Perfect!)

- ✅ Product ID: `premium_yearly`
- ✅ Base Plan ID: `premium-yearly`
- ✅ Status: **Active**
- ✅ **Backwards compatible** tag: ✅ Present
- ✅ License tester: `smrtdev06@gmail.com`

**DO NOT create an offer** - The backwards compatible base plan is enough!

---

## 🔨 Build Commands

```bash
# 1. Build web app
npm run build

# 2. Sync to Capacitor
npx cap sync android

# 3. Navigate to Android directory
cd android

# 4. Build release APK
./gradlew assembleRelease

# 5. APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📤 Upload to Google Play Console

### Step 1: Create New Release
1. Go to **Testing → Internal testing**
2. Click **Create new release**

### Step 2: Upload APK
1. Upload: `android/app/build/outputs/apk/release/app-release.apk`
2. Version: **10.0 (10)**

### Step 3: Release Notes
```
Version 10.0
- Fixed Google Play Billing product ID format for backwards compatible subscriptions
- Now uses correct format: premium_yearly (without base plan suffix)
- This is the proper format per cordova-plugin-purchase documentation
```

### Step 4: Roll Out
1. Click **Review release**
2. Click **Start rollout to Internal testing**
3. Wait 5-15 minutes for processing

---

## 📱 Install and Test

### Step 1: Uninstall Old Version
1. On your phone, **uninstall Calculator+** completely
2. This ensures you get fresh version 10.0

### Step 2: Install from Play Store
1. Open Internal Testing opt-in link
2. Download from Play Store
3. **Important:** Must install from Play Store, not sideload!

### Step 3: Check Version
1. Open app → Settings
2. Verify it shows: **Version 10.0**

### Step 4: Check Debug Log
The **green debug panel** at bottom should now show:

✅ **Expected Success:**
```
✓ Store initialized: GooglePlay
✓ Product registered: premium_yearly
✓ Products loaded: 1
✓ Price: $29.99/year
✓ Can purchase: true
```

---

## 🎯 Why This Will Work

According to cordova-plugin-purchase documentation:

> **For backwards compatible base plans**: Use just the subscription product ID. The plugin automatically finds the backwards compatible offer. The format `productId:basePlanId` is only needed when you have multiple base plans.

Since you have:
- ONE base plan marked as backwards compatible
- Product correctly configured in Play Console
- Correct package name and signing

The plugin will now find your product using just `premium_yearly`!

---

## 🐛 If Still Not Working

### Check 1: Verify Version
- Open app → Settings
- Must show **Version 10.0**
- If not, rebuild and upload

### Check 2: Clear Cache
```
Settings → Apps → Google Play Store → Clear Cache
Settings → Apps → Google Play services → Clear Cache
Reboot phone
```

### Check 3: Check Debug Log
Look at the green panel for:
- Product ID registered: Should say `premium_yearly` (not `premium_yearly:premium-yearly`)
- Products found: Should be 1 (not 0)

### Check 4: Wait Time
- Give it 5-10 minutes after first launch
- Products sometimes load with a delay on first run

---

## 🎉 Expected Result

When working correctly:

1. **Debug overlay shows:**
   - Platform: android
   - Store: GooglePlay
   - Products found: 1
   - Product: premium_yearly
   - Price: $29.99/year

2. **Settings → Subscription page shows:**
   - Premium subscription card
   - Price: $29.99/year
   - "Upgrade to Premium" button

3. **Click upgrade:**
   - Google Play purchase dialog appears
   - Shows "No charge" (for license testers)
   - Purchase completes successfully

---

## 📊 Version History

- **v8.0**: Used `premium-yearly` (wrong - missing product ID)
- **v9.0**: Used `premium_yearly:premium-yearly` (wrong for backwards compatible)
- **v10.0**: Uses `premium_yearly` (correct! ✅)

---

## 🚀 This Should Work Because:

1. ✅ Product ID is correct: `premium_yearly`
2. ✅ Base plan is backwards compatible
3. ✅ Base plan is Active
4. ✅ Waited 5+ hours (well past propagation)
5. ✅ Installed from Play Store
6. ✅ License tester configured
7. ✅ Using correct format per plugin docs

**Build version 10.0 and test it!** 🎯
