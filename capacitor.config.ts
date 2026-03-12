import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.muchad.refuelingapp',
  appName: 'Formularz Tankowania',
  webDir: 'build',
  plugins: {
    Keyboard: {
      resize: "none",
      resizeOnFullScreen: true,
    }
  }
};

export default config;