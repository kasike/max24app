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
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#090d16",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  }
};

export default config;
