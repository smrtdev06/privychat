import type { CapacitorConfig } from '@capacitor/cli';

// REMOTE MODE: App loads from published Replit server
// This means you only publish the mobile app ONCE to app stores
// All frontend updates happen automatically through your published web app

// DEV MODE: Using development URL for testing
// Switch back to 'https://privycalc.com/' for production builds
const PUBLISHED_APP_URL = process.env.VITE_PUBLISHED_URL || 'https://622e822f-d1a1-4fd9-828a-42c12b885a85-00-1hd0vg3rilq4.worf.replit.dev/';

const config: CapacitorConfig = {
  appId: 'com.newhomepage.privychat',
  appName: 'Calculator+',
  webDir: './dist/public', // Still needed for initial sync, but won't be used at runtime
  
  server: {
    // Load from remote server instead of bundled files
    url: PUBLISHED_APP_URL.startsWith('http') ? PUBLISHED_APP_URL : `https://${PUBLISHED_APP_URL}`,
    androidScheme: 'https',
    cleartext: false, // Require HTTPS for security
    
    // Allow navigation to your domains
    allowNavigation: [
      PUBLISHED_APP_URL,
      '*.replit.dev',
      '*.replit.app'
    ]
  },
  
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
