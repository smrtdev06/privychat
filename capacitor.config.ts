import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stealthcalc.app',
  appName: 'Stealth Calculator',
  webDir: './dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
