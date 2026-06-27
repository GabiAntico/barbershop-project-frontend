# Barbershop Manager Frontend

Frontend Angular de Barbershop Manager. Implementa la interfaz para administrar clientes, responsables, turnos, agenda, visitas, pagos, sucursales, empleados, horarios laborales, configuración y estadísticas.

## Stack

- Angular 19
- TypeScript
- RxJS
- Angular Router
- Guards
- HTTP Interceptors
- PrimeNG
- Tailwind CSS
- SSR/prerender configurado por Angular
- Vercel para deploy

## Requisitos

- Node.js
- npm
- Backend levantado localmente o desplegado

## Instalación

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

Verificación actual:

```bash
npm run build:dev
npm run build:demo
```

El proyecto conserva el script `npm test` generado por Angular, pero todavía no cuenta con una suite de tests automatizados representativa. Para este repositorio demo, la verificación recomendada por ahora es compilar ambos perfiles.

## Environments

Los environments están en:

```text
src/environments/
|-- environment.ts
|-- environment.dev.ts
`-- environment.demo.ts
```

Ejemplo:

```ts
export const environment = {
  production: true,
  profile: 'demo',
  baseUrl: 'https://barbershop-project-backend.onrender.com/api'
};
```

Para deploy demo, `baseUrl` apunta a la API pública del backend en Render terminada en `/api`.

## Arquitectura frontend

```text
src/app/
|-- components/       Pantallas y componentes principales
|-- guards/           Protección de rutas
|-- interceptors/     JWT y sucursal activa
|-- models/           Tipos TypeScript
`-- services/         Comunicación con la API
```

Rutas principales:

```text
/login
/register
/change-password
/agenda
/shifts-view
/shifts/:id
/create-shift
/edit-shift/:id
/clients-view
/clients/:id
/clients/:id/notes
/create-client
/edit-client/:id
/visits-view
/visits/create/:shiftId
/visits/edit/:id
/dashboard
/dashboard/clients
/settings
```

## Funcionalidades UI

- Login y registro de barbería.
- Cambio obligatorio de contraseña temporal.
- Layout sin sidebar/topbar en pantallas públicas.
- Topbar con nombre de barbería y selector de sucursal activa.
- Sidebar responsive.
- Agenda diaria con turnos agrupados por horario.
- Creación y edición de turnos con selector visual de horarios.
- Capacidad de turnos por cantidad de barberos disponibles.
- Selección de barbero manual o asignación automática.
- Vista detallada de turno.
- Recordatorio manual por WhatsApp desde la agenda.
- Gestión de clientes con responsable opcional.
- Vista detallada de cliente.
- Notas internas de cliente en pantalla separada con confirmación previa.
- Listados responsive: tablas en escritorio y cards en mobile.
- Configuración de monto estimado y moneda por defecto.
- Configuración de disponibilidad horaria de la sucursal.
- Gestión de sucursales.
- Gestión de empleados, sucursales asignadas y horarios laborales por empleado.
- Atender turnos y generar visitas.
- Edición de visitas.
- Movimientos de pago, reembolso y bonificación.
- Dashboard general.
- Estadísticas por cliente.
- Exportación de turnos a PDF.
- Loaders en botones de guardado para evitar envíos duplicados.

## Comunicación con backend

El frontend centraliza headers en interceptores:

- `Authorization: Bearer <token>` para requests autenticadas.
- `X-Branch-Id` para enviar la sucursal activa.

El guard de autenticación protege rutas privadas y redirige cuando:

- No hay token válido.
- El usuario debe cambiar una contraseña temporal.
- Falta contexto de trabajo requerido.

## Convenciones de diseño

- Escritorio: tablas para lectura densa de datos.
- Mobile: cards para evitar scroll horizontal en listados principales.
- Selectores y date/time pickers con PrimeNG para mantener consistencia visual.
- Confirmaciones con modales propios de la app, no `alert` del navegador.
- Botones de guardado con estado de carga para evitar doble submit.
- Datos vacíos representados con una raya larga consistente.

## Deploy demo

El frontend demo está publicado en Vercel:

```text
https://barbershop-project-frontend.vercel.app
```

Configuración del proyecto en Vercel:

- Framework preset: Angular.
- Root directory: raíz del repo frontend.
- Install command: `npm install`.
- Build command: `npm run build:demo`.
- Output directory: `dist/shifts-frontend/browser`.

Configuración de la demo:

- `environment.demo.ts` apunta a `https://barbershop-project-backend.onrender.com/api`.
- El backend en Render permite el origen `https://barbershop-project-frontend.vercel.app`.
- El build publicado corresponde a `npm run build:demo`.

## Notas técnicas

- El entorno `dev` apunta al backend local en `http://localhost:8080/api`.
- El entorno `demo` apunta a la API pública en Render.
- El frontend envía el JWT y la sucursal activa mediante interceptores HTTP.
- Las rutas privadas están protegidas por guards.
- Los listados principales usan tablas en escritorio y cards en mobile.
- El script `npm test` se conserva por la configuración base de Angular, pero la verificación actual del repo demo se realiza compilando `dev` y `demo`.

La configuración de build `demo` usa budgets más amplios que desarrollo porque incluye el bundle necesario para la demo desplegada.
