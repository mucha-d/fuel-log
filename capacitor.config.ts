import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.muchad.refuelingapp',
  appName: 'FuelLog',
  webDir: 'build',
  plugins: {
    Keyboard: {
      resize: "none",
      resizeOnFullScreen: true,
    }
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;