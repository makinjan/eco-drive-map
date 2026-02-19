import { MapPin, Mic, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useState } from 'react';

interface PermissionsGateProps {
  onContinue: () => void;
}

/**
 * Pantalla de solicitud de permisos para Android (Capacitor).
 * Se muestra solo si algún permiso crítico no ha sido concedido.
 */
export function PermissionsGate({ onContinue }: PermissionsGateProps) {
  const { permissions, requestAll } = usePermissions();
  const [requesting, setRequesting] = useState(false);

  const locationOk = permissions.location === 'granted';
  const micOk = permissions.microphone === 'granted';
  const allGranted = locationOk && micOk;

  // CRÍTICO: requestAll debe ser la PRIMERA await dentro del handler.
  // Cualquier setState o lógica ANTES de la primera await rompe la cadena
  // de gesto del usuario en Android WebView, impidiendo los diálogos nativos.
  const handleRequest = async () => {
    await requestAll();
    // Solo después de requestAll podemos actualizar estado
    setRequesting(false);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-8 z-50">
      {/* Logo / título */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">eco-drive-map</h1>
        <p className="text-sm text-muted-foreground mt-1">Necesitamos tu permiso para continuar</p>
      </div>

      {/* Lista de permisos */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        <PermissionRow
          icon={<MapPin className="h-5 w-5" />}
          title="Ubicación GPS"
          description="Para calcular tu ruta y detectar zonas ZBE cercanas"
          granted={locationOk}
        />
        <PermissionRow
          icon={<Mic className="h-5 w-5" />}
          title="Micrófono"
          description="Para comandos de voz y guía por voz"
          granted={micOk}
        />
      </div>

      {/* Botones */}
      {allGranted ? (
        <Button className="w-full max-w-sm" size="lg" onClick={onContinue}>
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Continuar
        </Button>
      ) : (
        <div className="w-full max-w-sm space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={handleRequest}
            disabled={requesting}
          >
            {requesting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Solicitando permisos...
              </>
            ) : (
              'Conceder permisos'
            )}
          </Button>
          {/* Botón continuar siempre visible */}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground text-xs"
            onClick={onContinue}
          >
            Continuar sin algunos permisos (funcionalidad limitada)
          </Button>
          {/* Si ya se concedió ubicación pero no micrófono, permitir continuar */}
          {locationOk && !micOk && (
            <p className="text-xs text-center text-muted-foreground">
              Ubicación concedida ✓ — El micrófono es opcional para la navegación básica.
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center mt-6 max-w-xs">
        Tus datos de ubicación nunca se comparten con terceros y solo se usan para el cálculo de rutas en tu dispositivo.
      </p>
    </div>
  );
}

function PermissionRow({
  icon,
  title,
  description,
  granted,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  granted: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div className={`mt-0.5 flex-shrink-0 ${granted ? 'text-primary' : 'text-muted-foreground'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0 mt-0.5">
        {granted ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <AlertCircle className="h-5 w-5 text-destructive/70" />
        )}
      </div>
    </div>
  );
}
