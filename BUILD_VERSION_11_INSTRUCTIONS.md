# Build Instructions for Version 11.0 (NEW PLUGIN)

## 🎯 What Changed

**Major Plugin Migration:**
- ❌ Removed: `cordova-plugin-purchase` (v13 - had issues with backwards compatible plans)
- ✅ Added: `cordova-plugin-inapppurchases` (v3.1.1 - works without offers!)

**Why This Works:**
- The new plugin supports backwards compatible plans WITHOUT requiring offers
- Simpler API - just uses `getAllProductInfo()` and `purchase()`
- Works on both iOS and Android
- Actively maintained (2023-2024)

---

## ✅ Your Google Play Console Setup (STAYS THE SAME!)

- ✅ Product ID: `premium_yearly`
- ✅ Base Plan ID: `premium-yearly`
- ✅ Status: **Active**
- ✅ **Backwards compatible** tag: ✅ Present
- ✅ License tester: `smrtdev06@gmail.com`

**STILL NO OFFERS NEEDED!** ✨ The new plugin works with just the backwards compatible base plan!

---

## 🔨 Build Commands

```bash
# 1. Build web app (already done)
npm run build

# 2. Sync to Capacitor (already done)
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
2. Version: **11.0 (11)**

### Step 3: Release Notes
```
Version 11.0
- Migrated to cordova-plugin-inapppurchases for better compatibility
- Now works with backwards compatible subscriptions without offers
- Improved product loading on Google Play
- More reliable subscription handling
```

### Step 4: Roll Out
1. Click **Review release**
2. Click **Start rollout to Internal testing**
3. Wait 5-15 minutes for processing

---

## 📱 Install and Test

### Step 1: Uninstall Old Version
1. On your phone, **uninstall Calculator+** completely
2. This ensures you get fresh version 11.0

### Step 2: Install from Play Store
1. Open Internal Testing opt-in link
2. Download from Play Store
3. **Important:** Must install from Play Store, not sideload!

### Step 3: Check Version
1. Open app → Settings
2. Verify it shows: **Version 11.0**

### Step 4: Check Debug Log
The **green debug panel** at bottom should now show:

✅ **Expected Success:**
```
✅ inAppPurchases plugin available!
🚀 Loading products for android...
✅ Products loaded!
📦 Product: premium_yearly
   - Title: Premium Yearly
   - Price: $29.99/year
   - Description: Unlimited messaging for one year
```

---

## 🎯 Why This Will Work

**Key Improvements:**

1. **✅ No Offers Requirement**
   - cordova-plugin-inapppurchases works with backwards compatible plans
   - No need to create offers in Play Console

2. **✅ Simpler API**
   - Old: `store.register() → store.initialize() → complex events`
   - New: `getAllProductInfo([ids]) → simple promise`

3. **✅ Better Compatibility**
   - Uses Google Play Billing Library 7
   - Works with both legacy and modern subscriptions

4. **✅ Cross-Platform**
   - Same plugin for iOS and Android
   - Consistent API across platforms

---

## 🐛 If Still Not Working

### Check 1: Verify Version
- Open app → Settings
- Must show **Version 11.0**
- Plugin should say **inAppPurchases** (not CdvPurchase)

### Check 2: Clear Cache
```
Settings → Apps → Google Play Store → Clear Cache
Settings → Apps → Google Play services → Clear Cache
Reboot phone
```

### Check 3: Check Debug Log
Look at the green panel for:
- Plugin: Should say `inAppPurchases plugin available`
- Products loaded: Should show the product details
- Any error messages

### Check 4: Wait Time
- Give it 5-10 minutes after first launch
- Products sometimes load with a delay on first run

---

## 📊 Version History

- **v8.0**: Used `premium-yearly` (wrong - missing product ID)
- **v9.0**: Used `premium_yearly:premium-yearly` (wrong for backwards compatible)
- **v10.0**: Used `premium_yearly` with cordova-plugin-purchase (plugin couldn't load it)
- **v11.0**: Uses `premium_yearly` with **cordova-plugin-inapppurchases** ✅

---

## 🚀 Expected Behavior

When working correctly:

1. **Debug overlay shows:**
   - Platform: android
   - Plugin: inAppPurchases
   - Products loaded: 1
   - Product: premium_yearly
   - Price: $29.99/year

2. **Settings → Subscription page shows:**
   - Premium subscription card
   - Price: $29.99/year
   - "Subscribe" button

3. **Click subscribe:**
   - Google Play purchase dialog appears
   - Shows "No charge" (for license testers)
   - Purchase completes successfully

---

## 🎉 This Should Work Because:

1. ✅ New plugin doesn't require offers
2. ✅ Works with backwards compatible plans
3. ✅ Simpler, more reliable API
4. ✅ Actively maintained (updated 2024)
5. ✅ Product configuration is correct in Play Console
6. ✅ License tester configured
7. ✅ Waited 5+ hours (propagation complete)

**Build version 11.0 and test it!** 🎯

---

## 🔧 Technical Changes

### Plugin API Changes

**Old Plugin (cordova-plugin-purchase):**
```javascript
CdvPurchase.store.register([...]);
await CdvPurchase.store.initialize();
store.when().productUpdated(...);
product.getOffer().order();
```

**New Plugin (cordova-plugin-inapppurchases):**
```javascript
const products = await inAppPurchases.getAllProductInfo([ids]);
const purchase = await inAppPurchases.purchase(productId);
await inAppPurchases.completePurchase(productId, false);
```

**Much simpler!** ✨

---

## 📝 Notes

- The new plugin uses a promise-based API (no complex event system)
- `completePurchase(productId, false)` - `false` means don't consume (it's a subscription)
- Receipt validation with backend still works the same way
- Product ID stays the same: `premium_yearly`
