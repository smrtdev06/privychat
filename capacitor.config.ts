import type { CapacitorConfig } from '@capacitor/cli';

// HYBRID MODE: App loads locally to initialize Capacitor plugins,
// then immediately redirects to remote Replit server for the actual app
// This gives you:
// ✅ Remote updates (no app store resubmission)
// ✅ Native plugins work (in-app purchases, etc.)

// Remote server URL - the actual app location
export const REMOTE_APP_URL = process.env.VITE_PUBLISHED_URL || 'https://622e822f-d1a1-4fd9-828a-42c12b885a85-00-1hd0vg3rilq4.worf.replit.dev/';

const config: CapacitorConfig = {
  appId: 'com.newhomepage.privychat',
  appName: 'Calculator+',
  webDir: './dist/public',
  
  // Load locally to enable native plugins
  // The local app will redirect to REMOTE_APP_URL automatically
  
  plugins: {
    App: {
      // Handle deep links for promo code redemption
      // URL scheme: privycalc://redeem?code=PROMO123
      appUrlScheme: 'privycalc',
      appUrlOpen: {
        webDeepLinkingEnabled: true
      }
    }
  }
};

export default config;
