import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b316d9d984c34bff8d619806af6b63cd',
  appName: 'eco-drive-map',
  webDir: 'dist',
  server: {
    url: 'https://b316d9d9-84c3-4bff-8d61-9806af6b63cd.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    // Geolocation: alta precisión para navegación GPS
    Geolocation: {
      // En Android solicita permisos en runtime automáticamente
    },
    // Micrófono: reconocimiento de voz
    Microphone: {},
    // Mantener pantalla encendida durante la navegación
    KeepAwake: {},
    // Solicitar permisos de forma agrupada al inicio
    Permissions: {},
    // SplashScreen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1e1b4b',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    // StatusBar
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1e1b4b',
    },
  },
};

export default config;
