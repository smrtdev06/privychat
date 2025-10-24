# 🚀 How to Build Release APK/AAB for Google Play Store

Your keystore is already configured! Follow these simple steps to build a signed release version.

---

## 📦 **Method 1: Build with Android Studio (Recommended)**

### Step 1: Open Project
```bash
cd android
./gradlew clean  # Clean previous builds
```
Then open the `android` folder in Android Studio.

### Step 2: Generate Signed Bundle
1. In Android Studio: **Build → Generate Signed Bundle/APK**
2. Choose: **Android App Bundle** (recommended for Play Store)
3. Click **Next**

### Step 3: Use Existing Keystore
- Select: **Choose existing...**
- Browse to: `android/privycalc-release.keystore`
- Enter credentials:
  - **Keystore password:** `PrivyCalc2025#Secure!`
  - **Key alias:** `privycalc-key`
  - **Key password:** `PrivyCalc2025#Secure!`

### Step 4: Build Configuration
- Select build variant: **release**
- Check: ✅ **Export encrypted key for enrolling published apps**
- Click **Finish**

### Step 5: Locate Your Build
Your signed AAB will be at:
```
android/app/release/app-release.aab
```

---

## 🔧 **Method 2: Build with Command Line**

### For Android App Bundle (AAB - Recommended):
```bash
cd android
./gradlew bundleRelease
```

**Output location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

### For APK:
```bash
cd android
./gradlew assembleRelease
```

**Output location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📤 **Upload to Google Play Console**

### First Time Upload:
1. Go to: [Google Play Console](https://play.google.com/console)
2. **Create new app** or select existing app
3. Navigate to: **Release → Production → Create new release**
4. Upload your `app-release.aab` file
5. **Enable Google Play App Signing** (highly recommended!)
   - Google will manage your production signing key
   - If you lose your upload key, Google can reset it

### Updating Existing App:
1. Increment version in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment this
   versionName "1.1"  // Update version name
   ```
2. Rebuild the AAB/APK
3. Upload to Play Console

---

## 🔐 **Google Play App Signing**

When you upload your first release, Google will ask you to enroll in **App Signing**.

### ✅ Benefits:
- Google securely manages your app signing key
- You can reset your upload key if lost
- Enhanced security and key rotation
- Optimized APK delivery

### 📋 How It Works:
1. **Upload Key** (your keystore) → Used to upload to Play Console
2. **App Signing Key** (Google manages) → Used for production releases

**Your keystore = Upload Key**  
**Google generates = App Signing Key**

---

## 🔍 **Verify Your Build**

Check the signing certificate:
```bash
cd android
keytool -printcert -jarfile app/build/outputs/bundle/release/app-release.aab
```

Or for APK:
```bash
keytool -printcert -jarfile app/build/outputs/apk/release/app-release.apk
```

Should show:
```
Owner: CN=PrivyCalc, OU=Mobile Apps, O=PrivyCalc...
SHA256: 48:A8:B2:1B:4F:42:79:D6:57:10:9E:0A:4C:16:93:B7...
```

---

## ⚠️ **Important Notes**

### Before Building:
- ✅ Test thoroughly on real devices
- ✅ Update version code for each release
- ✅ Check app works in release mode (not just debug)
- ✅ Verify all permissions are declared in AndroidManifest.xml

### After Building:
- ✅ Test the signed APK/AAB before uploading
- ✅ Keep backup of keystore file
- ✅ Store passwords in password manager
- ✅ Enable Google Play App Signing

### Release Checklist:
- [ ] App icon looks correct
- [ ] App name is "Calculator+" (stealth mode)
- [ ] All features work in release build
- [ ] No debug logs or test data
- [ ] Privacy policy and terms of service links work
- [ ] In-app purchases configured (if applicable)

---

## 🐛 **Troubleshooting**

### Error: "Keystore was tampered with"
**Fix:** Check password is exactly: `PrivyCalc2025#Secure!`

### Error: "Key alias not found"
**Fix:** Use alias: `privycalc-key`

### Build fails with signing error:
**Fix:** Run clean build:
```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### Can't find output file:
**Fix:** Check exact path:
```bash
find android -name "*.aab" -o -name "*-release.apk"
```

---

## 📞 **Need Help?**

- **Keystore credentials:** See `android/KEYSTORE_CREDENTIALS.txt`
- **Google Play documentation:** https://support.google.com/googleplay/android-developer
- **Capacitor docs:** https://capacitorjs.com/docs/android

---

**Your keystore is valid until: March 11, 2053** ✅

Good luck with your release! 🎉
