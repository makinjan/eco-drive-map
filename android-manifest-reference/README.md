# Permisos Android — Guía de integración

## Después de ejecutar `npx cap add android`

Copia el archivo `android-manifest-reference/AndroidManifest.xml` como referencia para añadir los permisos en:

```
android/app/src/main/AndroidManifest.xml
```

### Permisos incluidos

| Permiso | Uso |
|---|---|
| `ACCESS_FINE_LOCATION` | GPS de alta precisión para navegación |
| `ACCESS_COARSE_LOCATION` | Requerido antes de pedir precisión alta |
| `RECORD_AUDIO` | Reconocimiento de voz y comandos |
| `INTERNET` | Google Maps, cálculo de rutas |
| `ACCESS_NETWORK_STATE` | Detectar conexión offline |
| `WAKE_LOCK` | Mantener pantalla activa durante navegación |
| `VIBRATE` | Alertas de radares y zonas ZBE |

### Permiso de localización en background (opcional)

`ACCESS_BACKGROUND_LOCATION` está comentado porque Google Play requiere una **justificación detallada** en el formulario de la Play Console. Solo actívalo si la app realmente necesita rastrear ubicación cuando está minimizada.

## Flujo de permisos en la app

La pantalla de permisos (`PermissionsGate`) aparece **automáticamente** al arrancar la app en Android nativo y solicita ubicación + micrófono antes de mostrar el mapa.

## Comandos para compilar

```bash
npm run build
npx cap sync android
# Luego abre Android Studio:
npx cap open android
```
