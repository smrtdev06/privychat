# App Icon Generation Guide

## ✅ What Was Done

App icons and splash screens have been successfully generated for both Android and iOS platforms using the Capacitor Assets tool.

## 📱 Generated Assets

### Android (74 files, 1.62 MB)
- **Adaptive Icons**: Foreground and background layers for all densities
  - ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
  - Located in: `android/app/src/main/res/mipmap-*/`
- **Splash Screens**: Portrait and landscape variants for all densities
  - Light and dark mode versions
  - Located in: `android/app/src/main/res/drawable-*/`
- **Configuration**: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`

### iOS (7 files, 1.46 MB)
- **App Icon**: 1024x1024 universal icon
  - Located in: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- **Splash Screens**: 1x, 2x, 3x scale variants
  - Light and dark mode versions
  - Located in: `ios/App/App/Assets.xcassets/Splash.imageset/`

## 🎨 Icon Design - Stealth Calculator

The icon is designed to look like a **legitimate calculator app** to maintain stealth:
- Blue gradient background matching app colors (#1e3a8a to #3b82f6)
- Calculator display showing "0" in cyan (#22d3ee)
- 4x4 button grid with numbers 0-9 and operators (÷, ×, -, +, =)
- Blue number buttons (#3b82f6)
- Purple operator buttons (#6366f1)
- Green equals button (#10b981)
- **Purpose**: Disguises the messaging app as a normal calculator
- **Stealth Factor**: Looks completely innocent in app drawer/home screen

## 🔄 How to Update Icons in the Future

If you want to change the app icon:

### Step 1: Create Your Icon
Create a 1024x1024 PNG image and save it as `resources/icon.png`

### Step 2: Generate All Sizes
```bash
npx @capacitor/assets generate --iconBackgroundColor '#1e40af' --iconBackgroundColorDark '#1e3a8a' --ios --android
```

### Step 3: Sync to Native Projects
```bash
# For Android
npx cap sync android

# For iOS
npx cap sync ios
```

## 📋 Icon Requirements

### Android
- **Adaptive Icon**: Foreground (108x108dp) + Background
- **Legacy Icon**: 48x48dp to 192x192dp
- **Format**: PNG with transparency
- **Safe Zone**: Keep important content within 66dp circle

### iOS
- **Size**: 1024x1024px
- **Format**: PNG without alpha channel
- **No Transparency**: Must have solid background
- **No Rounded Corners**: iOS applies them automatically

## 🎨 Customization Options

When generating assets, you can customize:

```bash
npx @capacitor/assets generate \
  --iconBackgroundColor '#1e40af' \        # Light mode background
  --iconBackgroundColorDark '#1e3a8a' \   # Dark mode background
  --splashBackgroundColor '#ffffff' \      # Light mode splash
  --splashBackgroundColorDark '#000000' \  # Dark mode splash
  --ios \                                  # Generate iOS assets
  --android                                # Generate Android assets
```

## 📦 Source Files

- **Icon Source**: `resources/icon.png` (1024x1024)
- **Stock Image**: `attached_assets/stock_images/modern_calculator_ic_0fd8a8b4.jpg`

## ✨ Features

- ✅ All required sizes generated automatically
- ✅ Adaptive icons for Android (supports theme customization)
- ✅ Dark mode splash screens
- ✅ Optimized file sizes
- ✅ Proper XML configuration for Android
- ✅ Xcode-compatible JSON for iOS

## 🚀 Next Steps

Your app icons are now ready! When you build the mobile app:

1. **Android**: Open in Android Studio
   ```bash
   npx cap open android
   ```
   The icons will appear in the launcher automatically.

2. **iOS**: Open in Xcode
   ```bash
   npx cap open ios
   ```
   The icons will be visible on the device/simulator.

## 🔍 Verification

To verify icons are properly installed:

- **Android**: Check `android/app/src/main/res/mipmap-*/ic_launcher*.png`
- **iOS**: Check `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

All files should be present with appropriate sizes and naming conventions.

## 🕵️ Stealth Design Philosophy

This is a **stealth messaging app** disguised as a calculator. The icons and splash screens are designed to:

✅ **Look completely legitimate** - Appears as a normal calculator in app drawer  
✅ **Avoid suspicion** - No hint of messaging functionality  
✅ **Match the calculator UI** - Consistent with the in-app calculator interface  
✅ **Professional appearance** - High-quality design that looks like a real calculator app  

**Security through obscurity**: Anyone looking at your phone will see "Calculator" and think nothing of it!

## 💡 Tips

- **Keep Source Files**: Always keep `resources/icon.png` and `resources/splash.png` for future updates
- **Test on Device**: Icons may look different on actual devices vs simulators
- **App Store Requirements**: iOS requires 1024x1024 icon for App Store listing (already generated)
- **Google Play Requirements**: Feature graphic is separate from app icon (create separately)
- **Stealth Matters**: The icon should ALWAYS look like a calculator - never add messaging hints!
