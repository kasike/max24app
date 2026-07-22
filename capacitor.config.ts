import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'max24app.com',
  appName: 'MAX24',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
