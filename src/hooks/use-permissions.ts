import { useEffect, useState } from 'react';

interface PermissionsState {
  location: PermissionState | 'unknown';
  microphone: PermissionState | 'unknown';
}

// Detecta si estamos en Capacitor nativo
const isNative = () =>
  typeof (window as any).Capacitor !== 'undefined' &&
  (window as any).Capacitor?.isNativePlatform?.() === true;

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
        // Usar el plugin Capacitor para disparar el diálogo nativo
        const { Geolocation } = await import('@capacitor/geolocation');
        const status = await Geolocation.requestPermissions();
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
    if (isNative()) {
      try {
        // En Capacitor nativo, getUserMedia dispara el diálogo nativo de micrófono
        // siempre que se llame directamente desde un gesto del usuario
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermissions((p) => ({ ...p, microphone: 'granted' }));
        return true;
      } catch (err: any) {
        console.error('[Permissions] Error requesting microphone (native):', err);
        // Si falla getUserMedia en nativo, lo marcamos como concedido de todas formas
        // (el sistema puede haberlo bloqueado previamente o no estar disponible en emulador)
        setPermissions((p) => ({ ...p, microphone: 'denied' }));
        return false;
      }
    }

    // Fallback navegador
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissions((p) => ({ ...p, microphone: 'granted' }));
      return true;
    } catch {
      setPermissions((p) => ({ ...p, microphone: 'denied' }));
      return false;
    }
  };

  // IMPORTANTE: Secuencial, no paralelo.
  // Promise.all rompe la cadena del gesto del usuario en Android WebView,
  // lo que impide que aparezcan los diálogos nativos de permisos.
  const requestAll = async () => {
    await requestLocationPermission();
    await requestMicrophonePermission();
  };

  // Consultar estado inicial de permisos (Permissions API)
  useEffect(() => {
    const check = async () => {
      // En nativo: intentar con Capacitor Geolocation para ver estado
      if (isNative()) {
        try {
          const { Geolocation } = await import('@capacitor/geolocation');
          const status = await Geolocation.checkPermissions();
          const locGranted = status.location === 'granted' || status.coarseLocation === 'granted';
          setPermissions((p) => ({ ...p, location: locGranted ? 'granted' : 'prompt' }));
        } catch {
          // Silencioso
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
