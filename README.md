# 🏢 Sistema de Gestión de Horas - Grupo Rubio

Sistema completo para la gestión de horarios, trabajadores, ausencias e informes para empresas de limpieza.

## 📋 Características

- ✅ **Dashboard** con estadísticas en tiempo real
- ✅ **Planificación** visual tipo calendario (como Excel pero mejor)
- ✅ **Gestión de Trabajadores** con saldos de vacaciones
- ✅ **Clientes y Centros** de trabajo
- ✅ **Ausencias** según Convenio Limpieza Navarra 2024-2027
- ✅ **Registro de Horas** cumpliendo Ley Control Horario 2026
- ✅ **Informes** exportables a Excel/PDF

## 🛠️ Tecnologías

- **Frontend:** React + TailwindCSS
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **ORM:** Prisma

## 🚀 Instalación Rápida

### Requisitos previos
- Node.js 18+
- PostgreSQL 14+

### 1. Clonar/Descargar el proyecto

```bash
cd grupo-rubio-app
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
# DATABASE_URL="postgresql://usuario:password@localhost:5432/grupo_rubio"

# Crear tablas en la base de datos
npm run db:push

# Cargar datos iniciales (categorías, tipos ausencia, usuarios, festivos)
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

El API estará en: `http://localhost:3001`

### 3. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Iniciar aplicación
npm run dev
```

La app estará en: `http://localhost:5173`

## 👤 Usuarios de prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@gruporubio.net | admin123 | Administrador |
| manuel@gruporubio.net | manuel123 | Planificador |
| irene@gruporubio.net | irene123 | RRHH |

## 📊 Estructura de la Base de Datos

```
usuarios          → Login y permisos
trabajadores      → Datos de empleados
categorias        → Peón, Especialista, Encargado...
clientes          → Empresas cliente
centros_trabajo   → Ubicaciones de trabajo
asignaciones      → Turnos planificados
ausencias         → Vacaciones, bajas, permisos
tipos_ausencia    → Catálogo según convenio
registro_horas    → Fichajes (ley control horario)
historial_cambios → Auditoría (trazabilidad)
festivos          → Calendario festivos
configuracion     → Parámetros del sistema
```

## 📜 Convenio Colectivo Navarra 2024-2027

El sistema implementa automáticamente:

- **37 días** de vacaciones laborables
- **9 días** asuntos propios (tiempo completo)
- **4 días** asuntos propios (tiempo parcial)
- **18 días** por matrimonio
- **3-5 días** por fallecimiento familiar
- **Plus festivos:** +50% compensación + 3,09€/hora
- **Jornada anual:** 1.673 horas 20 minutos

## 🔒 Ley Control Horario 2026

El registro de horas cumple con:

- Registro digital obligatorio
- Hora exacta de entrada/salida
- Pausas y descansos
- Desglose: normales, extra, nocturnas, festivos
- Trazabilidad e inalterabilidad (historial_cambios)
- Conservación 4 años
- Acceso trabajador a sus registros

## 📁 Estructura del Proyecto

```
grupo-rubio-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Modelo de datos
│   │   └── seed.js          # Datos iniciales
│   ├── src/
│   │   └── server.js        # API Express
│   ├── package.json
│   └── .env.example
│
└── frontend/
    └── src/
        └── App.jsx          # Aplicación React
```

## 🔌 Endpoints API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Usuario actual

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas

### Trabajadores
- `GET /api/trabajadores` - Listar
- `GET /api/trabajadores/:id` - Detalle con saldos
- `POST /api/trabajadores` - Crear
- `PUT /api/trabajadores/:id` - Actualizar

### Clientes y Centros
- `GET /api/clientes` - Listar clientes con centros
- `POST /api/clientes` - Crear cliente
- `GET /api/centros` - Listar centros
- `POST /api/centros` - Crear centro

### Planificación
- `GET /api/asignaciones` - Listar turnos
- `POST /api/asignaciones` - Crear turno (con validación conflictos)
- `DELETE /api/asignaciones/:id` - Eliminar

### Ausencias
- `GET /api/ausencias` - Listar
- `GET /api/tipos-ausencia` - Catálogo
- `POST /api/ausencias` - Solicitar
- `PUT /api/ausencias/:id/aprobar` - Aprobar
- `PUT /api/ausencias/:id/rechazar` - Rechazar

### Otros
- `GET /api/categorias` - Categorías profesionales
- `GET /api/festivos` - Festivos por año
- `GET /api/registro-horas` - Fichajes

## 📞 Soporte

Desarrollado por Antigravity para Grupo Rubio Servicios Higiénicos Integrales S.L.

---
*Versión 1.0 - Enero 2026*
