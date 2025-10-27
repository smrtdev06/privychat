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
  
  // Bundle loads locally - no remote server URL
  // API calls will be made to the backend dynamically
  
  // Configure server hostname for iOS cookie support
  // This makes the backend domain a "first-party" domain for WKAppBoundDomains
  server: {
    hostname: '622e822f-d1a1-4fd9-828a-42c12b885a85-00-1hd0vg3rilq4.worf.replit.dev',
    iosScheme: 'https',
    cleartext: false // Enforce HTTPS for security
  },
  
  // iOS-specific configuration for cookie support
  // Required to enable third-party cookies from backend API
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
