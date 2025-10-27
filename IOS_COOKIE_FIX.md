# iOS Session Cookie Issue - Fix Guide

## Problem
When you enter the correct PIN (e.g., `123456` for user Chang) on the iOS calculator and press `=`, the app redirects to the login page instead of unlocking messaging.

### Root Cause
iOS WebView blocks third-party cookies by default. When your app runs from `capacitor://localhost` and makes requests to your backend server (e.g., `https://yourapp.replit.dev`), iOS treats the session cookies as "third-party" and blocks them, even though we're using `credentials: "include"`, `SameSite=None`, and `Secure` cookies.

**What happens:**
1. PIN verification succeeds ✅ (200 OK)
2. Session is created on the server ✅
3. Set-Cookie header is sent ✅
4. iOS WebView **blocks the cookie** ❌
5. Next request has no session ❌ (401 Unauthorized)
6. User is redirected to login ❌

## Solution Applied

I've configured your app to enable iOS cookie support:

### 1. Updated `capacitor.config.ts`
```typescript
ios: {
  limitsNavigationsToAppBoundDomains: true
},
plugins: {
  CapacitorCookies: {
    enabled: true
  },
  CapacitorHttp: {
    enabled: true
  }
}
```

### 2. Updated `ios/App/App/Info.plist`
Added `WKAppBoundDomains` with your backend domain:
```xml
<key>WKAppBoundDomains</key>
<array>
    <string>622e822f-d1a1-4fd9-828a-42c12b885a85-00-1hd0vg3rilq4.worf.replit.dev</string>
</array>
```

**Important:** Do NOT include `http://` or `https://` in the domain - just the domain name.

### 3. Added Debug Logging
Added server-side logging to verify session creation and help with debugging.

## Next Steps - **ACTION REQUIRED**

### ⚠️ You Must Rebuild the iOS App

The changes to `capacitor.config.ts` and `Info.plist` require rebuilding the iOS app:

```bash
# 1. Sync Capacitor configuration
npx cap sync ios

# 2. Open Xcode
npx cap open ios

# 3. In Xcode, clean and rebuild:
#    - Product → Clean Build Folder (Cmd+Shift+K)
#    - Product → Build (Cmd+B)
#    - Run the app on your device/simulator
```

### Testing After Rebuild

1. Launch the app on iOS
2. Go to the calculator
3. Enter PIN: `123456` (for Chang) or `55555` (for Chang1)
4. Press `=`
5. You should now be taken to the messaging screen! ✅

## Important Notes

### Production Deployment
- **Replit Development URL Changes:** The current `WKAppBoundDomains` includes the Replit dev URL which may change.
- **For Production:** Update `ios/App/App/Info.plist` with your production domain when you deploy:
  ```xml
  <array>
      <string>your-production-domain.com</string>
  </array>
  ```

### Alternative Solutions

If rebuilding the iOS app is not immediately possible, here are alternative approaches:

#### Option A: Use Custom Domain (Recommended for Production)
1. Set up a custom domain for your backend (e.g., `api.yourapp.com`)
2. Update `WKAppBoundDomains` to use your custom domain
3. Rebuild the iOS app

#### Option B: Token-Based Authentication (Workaround)
Instead of relying on cookies, implement token-based auth:
1. After successful PIN login, return a JWT token
2. Store token in Capacitor Preferences (native storage)
3. Send token as `Authorization: Bearer <token>` header with requests
4. This works on all platforms without cookie issues

## Verification

After rebuilding, check the debug logs. You should see:
```
✅ Session created successfully for user: <user-id>
Session ID: <session-id>
User authenticated: true
GET /api/user 200 ✅ (instead of 401)
```

## Common Issues

### Issue: Still getting 401 after rebuild
**Solution:** Make sure you:
1. Ran `npx cap sync ios` after changing config files
2. Cleaned build folder in Xcode
3. Completely rebuilt the app (not just hot-reload)
4. Verified `WKAppBoundDomains` matches your backend domain exactly

### Issue: Domain changes frequently
**Solution:** 
- For development: Accept that you need to update `Info.plist` when Replit URL changes
- For production: Use a stable custom domain

## Reference
- [Capacitor iOS Cookie Documentation](https://capacitorjs.com/docs/apis/cookies)
- [Apple WKAppBoundDomains Documentation](https://developer.apple.com/documentation/bundleresources/information_property_list/wkappbounddomains)
