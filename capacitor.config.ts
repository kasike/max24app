import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'max24app.com',
  appName: 'MAX24',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: "#090d16",
      showSpinner: false
    }
  }
};

export default config;
