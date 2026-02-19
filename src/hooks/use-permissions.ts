import { useEffect, useState } from 'react';

interface PermissionsState {
  location: PermissionState | 'unknown';
  microphone: PermissionState | 'unknown';
}

// Detecta si estamos en Capacitor nativo
const isNative = () =>
  typeof (window as any).Capacitor !== 'undefined' &&
  (window as any).Capacitor?.isNativePlatform?.() === true;

// Pre-importar el módulo de geolocalización en tiempo de carga del módulo
// para que NO haya import() dinámico dentro de la cadena de gesto del usuario
let GeolocationPlugin: typeof import('@capacitor/geolocation').Geolocation | null = null;

if (isNative()) {
  import('@capacitor/geolocation')
    .then((mod) => {
      GeolocationPlugin = mod.Geolocation;
      console.log('[Permissions] GeolocationPlugin cargado OK');
    })
    .catch((err) => {
      console.error('[Permissions] Error cargando GeolocationPlugin:', err);
    });
}

/**
 * Hook para solicitar y monitorizar permisos de localización y micrófono.
 * En Android (Capacitor) usa el plugin @capacitor/geolocation para disparar
 * los diálogos nativos del sistema. En navegador usa la Permissions API estándar.
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionsState>({
    location: 'unknown',
    microphone: 'unknown',
  });

  const requestLocationPermission = async (): Promise<boolean> => {
    if (isNative()) {
      try {
        if (!GeolocationPlugin) {
          console.warn('[Permissions] GeolocationPlugin aún no cargado, intentando import...');
          const mod = await import('@capacitor/geolocation');
          GeolocationPlugin = mod.Geolocation;
        }
        console.log('[Permissions] Solicitando permiso de ubicación nativo...');
        const status = await GeolocationPlugin.requestPermissions();
        console.log('[Permissions] Estado ubicación:', JSON.stringify(status));
        const granted = status.location === 'granted' || status.coarseLocation === 'granted';
        setPermissions((p) => ({ ...p, location: granted ? 'granted' : 'denied' }));
        return granted;
      } catch (err) {
        console.error('[Permissions] Error requesting location (native):', err);
        setPermissions((p) => ({ ...p, location: 'denied' }));
        return false;
      }
    }

    // Fallback navegador: usa geolocation API estándar
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions((p) => ({ ...p, location: 'granted' }));
          resolve(true);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setPermissions((p) => ({ ...p, location: 'denied' }));
          }
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log('[Permissions] Solicitando permiso de micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissions((p) => ({ ...p, microphone: 'granted' }));
      console.log('[Permissions] Micrófono concedido');
      return true;
    } catch (err: any) {
      console.error('[Permissions] Error requesting microphone:', err?.name, err?.message);
      setPermissions((p) => ({ ...p, microphone: 'denied' }));
      return false;
    }
  };

  // IMPORTANTE: Secuencial, no paralelo.
  // Promise.all rompe la cadena del gesto del usuario en Android WebView,
  // lo que impide que aparezcan los diálogos nativos de permisos.
  const requestAll = async () => {
    console.log('[Permissions] Iniciando solicitud de permisos secuencial...');
    await requestLocationPermission();
    await requestMicrophonePermission();
    console.log('[Permissions] Solicitud de permisos completada');
  };

  // Consultar estado inicial de permisos
  useEffect(() => {
    const check = async () => {
      // En nativo: intentar con Capacitor Geolocation para ver estado
      if (isNative()) {
        try {
          if (!GeolocationPlugin) {
            const mod = await import('@capacitor/geolocation');
            GeolocationPlugin = mod.Geolocation;
          }
          const status = await GeolocationPlugin.checkPermissions();
          console.log('[Permissions] Check inicial ubicación:', JSON.stringify(status));
          const locGranted = status.location === 'granted' || status.coarseLocation === 'granted';
          setPermissions((p) => ({ ...p, location: locGranted ? 'granted' : 'prompt' }));
        } catch (err) {
          console.error('[Permissions] Error en checkPermissions:', err);
        }
        return;
      }

      // Navegador: usa Permissions API
      if (!('permissions' in navigator)) return;
      try {
        const [loc, mic] = await Promise.all([
          navigator.permissions.query({ name: 'geolocation' }),
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ]);

        setPermissions({ location: loc.state, microphone: mic.state });

        loc.onchange = () => setPermissions((p) => ({ ...p, location: loc.state }));
        mic.onchange = () => setPermissions((p) => ({ ...p, microphone: mic.state }));
      } catch {
        // Fallback silencioso si el navegador no soporta Permissions API
      }
    };

    check();
  }, []);

  return {
    permissions,
    requestLocationPermission,
    requestMicrophonePermission,
    requestAll,
  };
}
