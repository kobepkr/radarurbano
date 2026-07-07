# Radar Urbano

Aplicación móvil comunitaria para reportar y visualizar incidentes urbanos en tiempo real.

## Estructura del proyecto

```
radarurbano/
├── radar-backend/          # API REST + WebSocket (Node.js/Express/TypeScript)
│   ├── src/
│   │   ├── index.ts        # Servidor principal (Express + Socket.IO)
│   │   ├── config/
│   │   │   ├── db.ts       # Conexión MongoDB
│   │   │   ├── email.ts    # Envío de emails (Resend)
│   │   │   ├── flow.ts     # Pagos Flow.cl
│   │   │   └── cloudinary.ts # Subida de imágenes
│   │   ├── models/
│   │   │   ├── Usuario.ts  # Modelo de usuario (auth, premium)
│   │   │   ├── reporte.ts  # Modelo de reportes/alertas
│   │   │   └── ReporteDiario.ts # Contador diario
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts      # JWT autenticación
│   │   │   └── limiteReportes.middleware.ts # Límite reportes
│   │   └── routes/
│   │       ├── usuario.routes.ts  # Auth, perfil, verificación, premium
│   │       └── reporte.routes.ts  # CRUD alertas, reacciones, comentarios
│   ├── .env                # Variables de entorno (NO COMMITEAR)
│   ├── package.json
│   └── tsconfig.json
│
└── radarurbano/            # App móvil (Expo/React Native)
    ├── App.tsx             # Punto de entrada + navegación
    ├── src/
    │   ├── screens/
    │   │   ├── LoginScreen.js      # Login, registro, verificación
    │   │   ├── MapScreen.tsx       # Mapa principal (alerta, filtros, regiones)
    │   │   ├── ProfileScreen.tsx   # Perfil, estadísticas, premium
    │   │   └── SettingsScreen.tsx  # Configuración, legal, premium info
    │   ├── components/
    │   │   ├── EventCard.tsx       # Tarjeta de alerta
    │   │   ├── PulseMarker.tsx     # Marcador en el mapa
    │   │   ├── CommentSection.tsx  # Sección de comentarios
    │   │   ├── CustomDrawer.tsx    # Menú lateral
    │   │   ├── ConnectionStatus.tsx # Estado de conexión
    │   │   └── CustomAlert.tsx     # Alertas personalizadas
    │   ├── services/
    │   │   └── OfflineReportService.ts # Cola offline
    │   ├── hooks/
    │   │   └── useNetworkStatus.ts # Detección de red
    │   ├── navigation/
    │   │   └── RootNavigation.js   # Navegación programática
    │   └── utils/
    │       ├── regiones.ts         # Regiones de Chile
    │       └── geocoding.ts        # Geocodificación inversa
    ├── app.json             # Configuración Expo
    ├── eas.json             # Build config (EAS)
    └── package.json
```

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js, Express 5, TypeScript |
| Base de datos | MongoDB Atlas (Mongoose) |
| Tiempo real | Socket.IO |
| Auth | JWT + bcryptjs |
| Email | Resend API |
| Pagos | Flow.cl (Webpay Chile) |
| Imágenes | Cloudinary |
| App móvil | React Native (Expo SDK 54) |
| Mapas | Google Maps (react-native-maps) |
| Notificaciones | Expo Push Notifications |
| Build | EAS (Expo Application Services) |
| Deploy backend | Render |

## Funcionalidades principales

### Alertas
- 100+ tipos de alertas en 8 categorías
- Filtros por categoría, estado y orden
- Selector de regiones de Chile
- Ubicación personalizada en el mapa
- Geocodificación inversa (direcciones reales)
- Tiempos de expiración configurables

### Social
- Confirmaciones y reportes falsos
- Reacciones (👍 🔥 🚨)
- Comentarios en cada alerta
- Compartir con link de Google Maps
- Visualizaciones por alerta

### Premium ($2.990/mes)
- Categorías exclusivas (Mascotas, Medio Ambiente, Servicios)
- Fotos en alertas
- Descripción personalizada
- Radio de búsqueda hasta 500km
- Sin límite de vistas
- Borde dorado en reportes
- Insignia ⭐

### Usuario
- Registro con validación
- Verificación por código de 6 dígitos al email
- Recuperación de contraseña
- Perfil con estadísticas y racha
- Nivel de contribuidor
- Modo oscuro
- Límite de 5 vistas por alerta (normal)

## Variables de entorno (Render)

| Variable | Descripción |
|----------|------------|
| `MONGO_URI` | Conexión MongoDB Atlas |
| `JWT_SECRET` | Clave para firmar tokens |
| `CORS_ORIGIN` | Orígenes permitidos CORS |
| `RESEND_API_KEY` | API key de Resend (emails) |
| `FLOW_API_KEY` | API key Flow.cl (pagos) |
| `FLOW_SECRET_KEY` | Secret key Flow.cl |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Comandos

### Desarrollo
```bash
# Backend
cd radar-backend
npm run dev        # Iniciar con hot-reload

# Frontend
cd radarurbano
npx expo start     # Iniciar Expo Go
```

### Build y deploy
```bash
# Backend (automático vía GitHub → Render)
git push

# APK Android
cd radarurbano
eas build --platform android --profile preview
```

## API Endpoints

### Usuarios
- `POST /api/usuarios/registro` - Registro
- `POST /api/usuarios/login` - Login
- `POST /api/usuarios/verificar` - Verificar código
- `GET /api/usuarios/perfil` - Perfil (auth)
- `POST /api/usuarios/recuperar-password` - Solicitar código
- `POST /api/usuarios/confirmar-recuperacion` - Cambiar contraseña
- `POST /api/usuarios/checkout-premium` - Crear pago Flow
- `POST /api/usuarios/toggle-notificaciones` - Activar/desactivar push
- `GET /api/usuarios/limite-reportes` - Límite diario

### Reportes
- `POST /api/reportes` - Crear alerta (auth)
- `GET /api/reportes/cercanos` - Alertas cercanas
- `GET /api/reportes/filtros` - Alertas filtradas
- `GET /api/reportes/:id` - Detalle
- `PUT /api/reportes/:id` - Editar (auth, propio)
- `DELETE /api/reportes/:id` - Eliminar (auth, propio)
- `POST /api/reportes/:id/confirmar` - Confirmar (auth)
- `POST /api/reportes/:id/reportar-falso` - Reportar falso (auth)
- `POST /api/reportes/:id/reaccionar` - Reaccionar (auth)
- `POST /api/reportes/:id/comentarios` - Comentar (auth)
- `GET /api/reportes/:id/comentarios` - Ver comentarios

## Categorías de alertas

| Categoría | Acceso | Tipos |
|-----------|--------|-------|
| 🚦 Tránsito | Todos | 20+ (choque, embotellamiento, bache, etc.) |
| 👮 Seguridad | Todos | 18+ (asalto, balacera, patrulla, etc.) |
| 🚑 Emergencias | Todos | 16+ (incendio, derrumbe, fuga gas, etc.) |
| 👥 Comunidad | Todos | 20+ (corte luz, escombros, ruido, etc.) |
| 🐾 Mascotas | ⭐ Premium | Perro/gato perdido, animal agresivo, etc. |
| 🌳 M. Ambiente | ⭐ Premium | Incendio forestal, tala ilegal, etc. |
| 🛠️ Servicios | ⭐ Premium | Internet caído, poste dañado, etc. |

## Versión

1.5.0 - Julio 2026
