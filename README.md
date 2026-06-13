# Barbershop Manager Frontend

Frontend Angular de Barbershop Manager. Implementa la interfaz para administrar clientes, turnos, agenda, visitas, pagos, sucursales, empleados, configuracion y estadisticas.

## Stack

- Angular
- TypeScript
- RxJS
- Angular Router
- Guards
- HTTP Interceptors
- PrimeNG
- Tailwind CSS
- Vercel para deploy

## Requisitos

- Node.js
- npm
- Backend levantado localmente o desplegado

## Instalacion

```bash
npm install
```

## Scripts

Desarrollo local:

```bash
npm start
```

Equivalente:

```bash
npm run start:dev
```

Demo apuntando al backend configurado en `environment.demo.ts`:

```bash
npm run start:demo
```

Build local:

```bash
npm run build:dev
```

Build demo:

```bash
npm run build:demo
```

## Environments

Los environments estan en:

```text
src/environments/
|-- environment.ts
|-- environment.dev.ts
`-- environment.demo.ts
```

Cada environment define:

```ts
export const environment = {
  production: true,
  profile: 'demo',
  baseUrl: 'https://tu-backend.onrender.com/api'
};
```

Para deploy demo, `baseUrl` debe apuntar a la URL publica del backend en Render terminada en `/api`.

## Arquitectura frontend

```text
src/app/
|-- components/       Pantallas y componentes principales
|-- guards/           Proteccion de rutas
|-- interceptors/     JWT y sucursal activa
|-- models/           Tipos TypeScript
`-- services/         Comunicacion con la API
```

## Funcionalidades UI

- Login y registro.
- Cambio obligatorio de contrasena temporal.
- Selector de sucursal activa.
- Sidebar responsive.
- Agenda diaria.
- Alta y edicion de turnos.
- Selector visual de horarios.
- Gestion de clientes.
- Notas internas de clientes en pantalla separada.
- Configuracion de monto estimado.
- Configuracion de disponibilidad horaria.
- Gestion de sucursales.
- Gestion de empleados y sucursales asignadas.
- Atencion de turnos.
- Edicion de visitas.
- Dashboard general.
- Estadisticas por cliente.
- Exportacion de turnos a PDF.
- Recordatorio manual por WhatsApp.

## Comunicacion con backend

El frontend usa:

- `Authorization: Bearer <token>` para requests autenticadas.
- `X-Branch-Id` para enviar la sucursal activa.
- Guards para proteger rutas privadas.
- Interceptor para centralizar headers.

## Deploy sugerido

Vercel:

- Framework preset: Angular.
- Root directory: raiz del repo frontend.
- Install command: `npm install`.
- Build command: `npm run build:demo`.
- Output directory: `dist/shifts-frontend/browser`.

Antes de desplegar:

1. Verificar `src/environments/environment.demo.ts`.
2. Confirmar que el backend permite el dominio de Vercel en `APP_FRONTEND_URL`.
3. Redeployar backend si se cambia la URL del frontend.

## Troubleshooting

Si el login o register devuelve `403` desde Vercel:

- Revisar que `APP_FRONTEND_URL` en Render tenga exactamente el origen del frontend.
- No incluir rutas como `/login`; solo el origen, por ejemplo `https://app.vercel.app`.
- Redeployar el backend despues de cambiar variables.

Si el frontend no conecta con el backend:

- Revisar `environment.demo.ts`.
- Confirmar que `baseUrl` termine en `/api`.
- Verificar en Network la URL real de la request.
