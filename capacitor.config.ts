import type { CapacitorConfig } from '@capacitor/cli';

// LOCAL BUNDLE MODE: App runs fully locally with bundled assets
// API calls are made to the remote server for data
// This gives you:
// ✅ Works on iOS (no iframe blocking issues)
// ✅ Works on Android (native plugins work perfectly)
// ✅ All native features work (in-app purchases, camera, etc.)
// ⚠️ Updates require rebuilding the app (use OTA updates for faster deployment)

const config: CapacitorConfig = {
  appId: 'com.newhomepage.privychat',
  appName: 'Calculator+',
  webDir: './dist/public',
  
  // LOCAL BUNDLE MODE - NO REMOTE SERVER URL
  // App loads from local files, API calls go to backend via VITE_SERVER_URL
  // This prevents Android from loading the app remotely from privycalc.com
  
  // iOS-specific configuration for cookie support
  // WKAppBoundDomains in Info.plist + these settings enable session cookies
  ios: {
    limitsNavigationsToAppBoundDomains: true
  },
  
  plugins: {
    App: {
      // Handle deep links for promo code redemption
      // URL scheme: privycalc://redeem?code=PROMO123
      appUrlScheme: 'privycalc',
      appUrlOpen: {
        webDeepLinkingEnabled: true
      }
    },
    // Enable cookie support for iOS
    CapacitorCookies: {
      enabled: true
    },
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
