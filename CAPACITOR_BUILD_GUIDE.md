# Capacitor Mobile App Build Guide

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

### 1. Build the Web App
```bash
# Build the frontend
npm run build
```

### 2. Sync Capacitor

#### For Android:
```bash
# Sync web assets to Android
npx cap sync android
```

#### For iOS:
```bash
# Sync web assets to iOS
npx cap sync ios
```

### 3. Open in Native IDE

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

### Server URL Configuration

For **production builds**, set the server URL before building:

```bash
# Using REPLIT_DOMAINS (automatic in Replit)
export REPLIT_DOMAINS=yourdomain.replit.app
npm run build
npx cap sync
```

For **local development** with HTTP server:
```bash
export VITE_SERVER_URL=http://10.0.2.2:5000  # Android emulator
# or
export VITE_SERVER_URL=http://localhost:5000  # iOS simulator
npm run build
npx cap sync
```

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
