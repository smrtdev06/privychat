import type { CapacitorConfig } from '@capacitor/cli';

// REMOTE MODE: App loads from published Replit server
// This means you only publish the mobile app ONCE to app stores
// All frontend updates happen automatically through your published web app

// Your published Replit app URL (e.g., "yourapp.replit.app")
// You can find this in the Publishing tool after you publish your app
const PUBLISHED_APP_URL = process.env.VITE_PUBLISHED_URL || 'YOUR_PUBLISHED_URL.replit.app';

const config: CapacitorConfig = {
  appId: 'com.newhomepage.stealthchat',
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
