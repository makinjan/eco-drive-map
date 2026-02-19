import { useEffect, useState } from 'react';

interface PermissionsState {
  location: PermissionState | 'unknown';
  microphone: PermissionState | 'unknown';
}

/**
 * Hook para solicitar y monitorizar permisos de localización y micrófono.
 * En Android (Capacitor) los permisos se solicitan en runtime.
 * En el navegador usa la Permissions API estándar.
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionsState>({
    location: 'unknown',
    microphone: 'unknown',
  });

  const requestLocationPermission = async (): Promise<boolean> => {
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
