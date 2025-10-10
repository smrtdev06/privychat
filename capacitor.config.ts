import type { CapacitorConfig } from '@capacitor/cli';

// Get server URL from environment variable
// IMPORTANT: Set REPLIT_DOMAINS environment variable before building for Capacitor
const rawUrl = process.env.REPLIT_DOMAINS?.split(',')[0];

// Only configure server URL if we have a domain (for production builds)
// For local development, don't set server.url to use the bundled app
const serverConfig = rawUrl ? {
  url: rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`,
  androidScheme: 'https',
  cleartext: false, // Use HTTPS in production
  allowNavigation: [
    rawUrl,
    '*.replit.dev',
    '*.replit.app'
  ]
} : {
  androidScheme: 'https',
  cleartext: true // Allow cleartext in local dev only
};

const config: CapacitorConfig = {
  appId: 'com.stealthcalc.app',
  appName: 'Stealth Calculator',
  webDir: './dist/public',
  server: serverConfig
};

export default config;
