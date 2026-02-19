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

---

## 🖼️ ICONO DE LA APP — Cómo generarlo correctamente

El icono PWA (`public/pwa-512x512.png`) **NO se copia automáticamente** al proyecto Android. Hay que generarlo con `@capacitor/assets`.

### Paso 1 — Instalar la herramienta

```bash
npm install -D @capacitor/assets
```

### Paso 2 — Colocar el icono fuente

Crea la carpeta `assets/` en la raíz del proyecto y copia tu icono:

```
assets/
  icon-only.png      ← icono cuadrado sin fondo, mínimo 1024x1024px
  icon-foreground.png  ← solo el dibujo (para Adaptive Icons de Android 8+)
  icon-background.png  ← solo el fondo (color sólido o gradiente)
  splash.png          ← pantalla de carga, mínimo 2732x2732px
```

> **Tip rápido**: Puedes usar el mismo `public/pwa-512x512.png` como punto de partida, pero ampliado a 1024x1024px o superior para máxima calidad.

### Paso 3 — Generar los iconos para Android e iOS

```bash
npx @capacitor/assets generate --android --ios
```

Esto genera automáticamente todos los tamaños en:
- `android/app/src/main/res/mipmap-mdpi/`
- `android/app/src/main/res/mipmap-hdpi/`
- `android/app/src/main/res/mipmap-xhdpi/`
- `android/app/src/main/res/mipmap-xxhdpi/`
- `android/app/src/main/res/mipmap-xxxhdpi/`

### Paso 4 — Sincronizar y abrir Android Studio

```bash
npm run build
npx cap sync android
npx cap open android
```

---

## Flujo de permisos en la app

La pantalla de permisos (`PermissionsGate`) aparece **automáticamente** al arrancar la app en Android nativo y solicita ubicación + micrófono antes de mostrar el mapa.

## Comandos para compilar

```bash
npm run build
npx cap sync android
# Luego abre Android Studio:
npx cap open android
```
