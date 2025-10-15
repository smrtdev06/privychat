# 🕵️ Stealth Calculator Icons & Splash Screens

## ✅ What Was Created

Custom calculator-themed icons and splash screens designed specifically for your **stealth messaging app**.

## 🎯 Design Purpose

The icons are designed to look like a **legitimate calculator app** to maintain complete stealth:

### Icon Features (1024x1024)
- **Blue gradient background** (#1e3a8a → #3b82f6) matching your app colors
- **Calculator display** showing "0" in cyan (#22d3ee)
- **4x4 button grid** with numbers 0-9 and operators
- **Blue number buttons** (#3b82f6)
- **Purple operator buttons** (#6366f1 for ÷, ×, -, +)
- **Green equals button** (#10b981)

### Splash Screen Features (2732x2732)
- Same calculator interface at larger scale
- Shows during app launch
- Maintains the calculator disguise
- Light and dark mode variants

## 🛡️ Stealth Benefits

✅ **Looks 100% legitimate** - Appears as "Calculator" in app drawer  
✅ **No suspicion** - Zero hints of messaging functionality  
✅ **Matches your UI** - Consistent with the in-app calculator interface  
✅ **Professional** - High-quality design like a real calculator app  

**Result**: Anyone looking at your phone will see a normal calculator app and think nothing of it!

## 📱 Generated Assets

### Android (74 files)
- All density variants: ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
- Adaptive icons with foreground/background layers
- Light and dark mode splash screens
- Portrait and landscape orientations

**Location**: `android/app/src/main/res/`

### iOS (7 files)
- Universal app icon (1024x1024)
- Splash screens at all scales (1x, 2x, 3x)
- Light and dark mode variants

**Location**: `ios/App/App/Assets.xcassets/`

## 🚀 How to Use

The icons are already installed in your native projects! When you build:

```bash
# Android
npx cap sync android
npx cap open android

# iOS
npx cap sync ios
npx cap open ios
```

You'll see the calculator icon on your device/simulator.

## 🎨 Color Scheme

All colors match your app's theme:
- **Primary Blue**: #1e40af → #3b82f6 (gradient)
- **Display Background**: #0f172a (dark blue)
- **Display Text**: #22d3ee (cyan)
- **Number Buttons**: #3b82f6 (blue)
- **Operator Buttons**: #6366f1 (purple)
- **Equals Button**: #10b981 (green)

## 📋 Source Files

Keep these for future updates:
- `resources/icon.png` (69 KB) - App icon source
- `resources/splash.png` (205 KB) - Splash screen source

## 🔄 Regenerate Icons

If you ever need to update the icons:

```bash
# Regenerate icon
bash scripts/create-calculator-icon.sh

# Regenerate splash
bash scripts/create-calculator-splash.sh

# Generate all sizes
npx @capacitor/assets generate \
  --iconBackgroundColor '#1e40af' \
  --iconBackgroundColorDark '#1e3a8a' \
  --splashBackgroundColor '#1e40af' \
  --splashBackgroundColorDark '#0f172a' \
  --ios --android
```

## ⚠️ Important Reminder

**NEVER add messaging hints to the icon!**

The whole point of stealth is to look completely normal. The icon should ALWAYS:
- Look like a calculator
- Match calculator app conventions
- Avoid any messaging/chat symbols
- Maintain professional appearance

Your secret is safe - it's hidden in plain sight! 🔒
