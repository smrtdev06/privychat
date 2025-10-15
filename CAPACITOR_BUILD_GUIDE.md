# Capacitor Mobile App Build Guide

## 🌐 Remote Mode Configuration

**This app is configured in REMOTE MODE** - it loads content from your published Replit server instead of bundling local files.

### Benefits:
✅ **Publish mobile app ONCE** to app stores  
✅ **All frontend updates happen automatically** (no app store review)  
✅ **Users always get the latest version** instantly  
✅ **No rebuilding for frontend changes**

### How It Works:
The mobile app is just a native "wrapper" that opens your published web app. When you update your frontend and publish to Replit, all users get the update immediately.

## Package Information
- **Package Name**: `com.newhomepage.stealthchat`
- **App Name**: Stealth Calculator
- **Platforms**: Android & iOS

## Prerequisites

### For Both Platforms:
- Node.js installed
- Capacitor CLI installed globally: `npm install -g @capacitor/cli`

### For Android:
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK) 11 or higher

### For iOS (macOS only):
- Xcode 14 or higher
- CocoaPods installed: `sudo gem install cocoapods`
- iOS deployment target: iOS 13.0+

## Build Steps

### 1. Publish Your Replit App

First, publish your app to get a permanent URL:

1. Click the **Publish** button in Replit
2. Follow the publishing wizard
3. Copy your published URL (e.g., `yourapp.replit.app`)

### 2. Configure Remote URL

Set your published URL as an environment variable:

```bash
# Set your published Replit URL
export VITE_PUBLISHED_URL=yourapp.replit.app

# Or use the full URL
export VITE_PUBLISHED_URL=https://yourapp.replit.app
```

Alternatively, edit `capacitor.config.ts` and replace `YOUR_PUBLISHED_URL.replit.app` with your actual URL.

### 3. Sync Capacitor

Since we're using remote mode, we don't need to build the frontend. Just sync the configuration:

#### For Android:
```bash
npx cap sync android
```

#### For iOS:
```bash
npx cap sync ios
```

### 4. Open in Native IDE

#### Android:
```bash
# Open in Android Studio
npx cap open android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Select your device/emulator
3. Click Run (green play button)

#### iOS (macOS only):
```bash
# Open in Xcode
npx cap open ios
```

Then in Xcode:
1. Select "App" scheme
2. Select your device/simulator
3. Click Run (play button)
4. You may need to sign the app with your Apple Developer account

## Environment Configuration

### Remote URL Configuration

The app is configured to load from your published Replit server. Set one of these:

**Option 1: Environment Variable (Recommended)**
```bash
export VITE_PUBLISHED_URL=yourapp.replit.app
npx cap sync
```

**Option 2: Edit capacitor.config.ts Directly**
Replace `YOUR_PUBLISHED_URL.replit.app` with your actual published URL.

### Important Notes

- ✅ **No frontend build required** - The app loads from your live server
- ✅ **Update anytime** - Just publish to Replit, users get updates instantly
- ✅ **One-time mobile publish** - Only rebuild if changing native features (permissions, plugins, etc.)
- ⚠️ **Requires published Replit app** - Make sure your app is published before testing

### In-App Purchase Configuration

The app is configured for in-app purchases:
- Package name: `com.newhomepage.stealthchat`
- Configure products in Google Play Console and App Store Connect
- Recommended product IDs:
  - `premium_monthly` - Monthly subscription
  - `premium_yearly` - Yearly subscription

## Testing

### Test on Emulator/Simulator:
```bash
# Android
npx cap run android

# iOS (macOS only)
npx cap run ios
```

### Test on Physical Device:

#### Android:
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run: `npx cap run android -l` (live reload)

#### iOS:
1. Connect iPhone/iPad via USB
2. Trust the computer on your device
3. In Xcode, select your device
4. You'll need an Apple Developer account to deploy to physical devices

## Publishing

### Android (Google Play):
1. In Android Studio, select Build > Generate Signed Bundle/APK
2. Create a new keystore or use existing one
3. Build release AAB (Android App Bundle)
4. Upload to Google Play Console

### iOS (App Store):
1. In Xcode, select Product > Archive
2. Once archived, click Distribute App
3. Choose App Store Connect
4. Upload to App Store Connect
5. Submit for review in App Store Connect

## Troubleshooting

### Android Issues:

**Gradle sync failed:**
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

**Package name conflicts:**
- Ensure old package `com.stealthcalc.app` is completely removed
- Clean and rebuild in Android Studio

### iOS Issues:

**Pod install failed:**
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
npx cap sync ios
```

**Signing issues:**
- Configure your team in Xcode (Signing & Capabilities)
- Ensure you have a valid Apple Developer account

### General Issues:

**WebView not loading app:**
- Check server URL configuration in `capacitor.config.ts`
- Verify CORS settings on your server
- Check browser console in device DevTools

**In-app purchases not working:**
- Ensure products are created in respective stores
- Verify package name matches exactly
- Test with sandbox/test accounts

## File Locations

- **Capacitor Config**: `capacitor.config.ts`
- **Android Main**: `android/app/src/main/java/com/newhomepage/stealthchat/MainActivity.java`
- **Android Build**: `android/app/build.gradle`
- **iOS Project**: `ios/App/App.xcodeproj`
- **Build Output**: `dist/public/`

## Live Reload Development

For faster development, use live reload:

```bash
# Start dev server
npm run dev

# In another terminal, run with live reload
npx cap run android -l --host=YOUR_IP
# or
npx cap run ios -l --host=YOUR_IP
```

Replace `YOUR_IP` with your computer's local IP address (e.g., `192.168.1.100`).

## Next Steps

1. Configure in-app purchases in Google Play Console and App Store Connect
2. Set up Google Play Developer API for receipt validation
3. Configure App Store Connect API for receipt validation
4. Test subscription flow on both platforms
5. Submit apps for review
