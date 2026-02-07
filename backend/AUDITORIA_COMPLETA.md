# AUDITORÍA COMPLETA BACKEND - GRUPO RUBIO
**Fecha:** 2026-02-04
**Analista:** Claude Code (Sonnet 4.5)
**Alcance:** Lectura completa de todos los archivos fuente del backend

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Valor |
|---|---|
| Archivos analizados | 18 archivos fuente |
| Líneas de código totales | ~7.400 (excluyendo node_modules y dist) |
| Archivo más grande | `src/server.js` — 3.130 líneas |
| Problemas críticos | 7 |
| Problemas altos | 9 |
| Problemas medios | 8 |
| Mejoras sugeridas | 6 |

---

## 🔴 PROBLEMAS CRÍTICOS (prioridad inmediata)

---

### [CRÍTICO-001] Endpoint `/api/setup-admin` sin autenticación — creación de admin hardcoded

**Archivo:** `src/server.js`
**Líneas:** 2591–2607
**Severidad:** CRÍTICA

**Problema:**
Existe un endpoint POST `/api/setup-admin` sin cualquier middleware de autenticación ni protección. Cualquier usuario anónimo puede crear un usuario administrador con contraseña `admin123`. Además, este endpoint está definido **después** de `app.listen()` (línea 2583), lo que en la versión actual de Express sigue registrándose, pero es un patrón indefendible.

**Riesgo:**
Cualquier persona que conozca la URL puede crear un administrador en el sistema en cualquier momento. Es una puerta trasera completa al sistema.

**Código actual:**
```javascript
// server.js:2591
app.post('/api/setup-admin', async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const usuario = await prisma.usuario.create({
      data: {
        email: 'admin@gruporubio.com',
        passwordHash,
        nombre: 'Administrador',
        rol: 'ADMIN',
        activo: true
      }
    });
    res.json({ mensaje: 'Admin creado', usuario });
  } catch (error) {
    res.status(500).json({ error: error.message }); // Expone error.message
  }
});
```

**Solución propuesta:**
Eliminar este endpoint completamente. La creación de administrador inicial se gestiona por el seed (`prisma/seed.js`).

**Impacto:** Alto — compromiso total de seguridad
**Esfuerzo:** Bajo — eliminar ~17 líneas

---

### [CRÍTICO-002] Todas las rutas en archivos router NO tienen autenticación JWT

**Archivo:** `src/routes/categorias.js`, `src/routes/tiposAusencia.js`, `src/routes/acuerdosIndividuales.js`, `src/routes/horariosFijos.js`, `src/routes/ajustesManuales.js`, `src/routes/informes.js`, `src/routes/controlHoras.js`
**Líneas:** Todas las rutas POST/PUT/DELETE de cada router
**Severidad:** CRÍTICA

**Problema:**
El `authMiddleware` se define en `server.js` como una función local. Los routers en archivos separados no importan ni usan este middleware. El montaje en `server.js` (líneas 81–87) monta los routers directamente sin middleware previo:
```javascript
app.use('/api/informes', informesRoutes);       // sin auth
app.use('/api/categorias', categoriasRoutes);   // sin auth
app.use('/api/control-horas', controlHorasRoutes); // sin auth
// ... etc
```
Esto significa que los siguientes endpoints son accesibles sin token:
- `POST/PUT/DELETE /api/categorias` — modificar categorías salariales
- `POST/PUT/DELETE /api/tipos-ausencia` — modificar tipos de ausencia (afecta nóminas)
- `POST/PUT/DELETE /api/acuerdos-individuales` — modificar acuerdos económicos
- `POST /api/horarios-fijos` — crear horarios
- `POST /api/ajustes-manuales` — modificar asignaciones
- `GET /api/control-horas/nomina` — ver datos salariales
- `GET /api/informes/calendario-empresa` — ver datos de empresa

**Riesgo:**
Cualquier usuario no autenticado puede leer datos salariales, modificar categorías, crear acuerdos económicos y ajustar turnos. Es un acceso no restringido a datos sensibles de RRHH.

**Código actual (ejemplo categorias.js):**
```javascript
// categorias.js:21
router.post('/', async (req, res) => {  // ← sin auth
  // ...
  const categoria = await prisma.categoria.create({ data: { ... } });
});
```

**Solución propuesta:**
Crear el authMiddleware en un archivo separado y aplicarlo al montaje de routers:
```javascript
// server.js — al montar los routers:
const { authMiddleware } = require('./middlewares/auth');

app.use('/api/informes', authMiddleware, informesRoutes);
app.use('/api/categorias', authMiddleware, categoriasRoutes);
app.use('/api/control-horas', authMiddleware, controlHorasRoutes);
app.use('/api/tipos-ausencia', authMiddleware, tiposAusenciaRoutes);
app.use('/api/acuerdos-individuales', authMiddleware, acuerdosRoutes);
app.use('/api/horarios-fijos', authMiddleware, horariosFijosRoutes);
app.use('/api/ajustes-manuales', authMiddleware, ajustesManualesRoutes);
```

**Impacto:** Alto — datos sensibles expuestos sin autenticación
**Esfuerzo:** Bajo — extraer middleware + añadir al montaje

---

### [CRÍTICO-003] Mass assignment en POST/PUT de trabajadores — `req.body` directo a Prisma

**Archivo:** `src/server.js`
**Líneas:** 566, 636
**Severidad:** CRÍTICA

**Problema:**
El body de la petición HTTP se pasa directamente a `prisma.trabajador.create()` y `.update()` sin filtrar campos. Un atacante puede enviar campos arbitrarios como `activo: true`, `categoriaId: 1` (categoría más alta), o campos del modelo que no deben ser editables por el usuario.

**Código actual:**
```javascript
// server.js:565-566
const trabajador = await prisma.trabajador.create({
  data: req.body,   // ← TODO el body sin filtrar
  include: { categoria: true }
});

// server.js:634-636
const trabajador = await prisma.trabajador.update({
  where: { id },
  data: req.body,   // ← TODO el body sin filtrar
  include: { categoria: true }
});
```

**Solución propuesta:**
```javascript
const { nombre, apellidos, dni, telefono, email, direccion, codigoPostal,
        localidad, fechaNacimiento, fechaAlta, categoriaId, tipoContrato,
        horasContrato, numeroSeguridadSocial, cuentaBancaria, notas } = req.body;

const trabajador = await prisma.trabajador.create({
  data: { nombre, apellidos, dni, telefono, email, direccion, codigoPostal,
          localidad, fechaNacimiento, categoriaId, tipoContrato, horasContrato,
          numeroSeguridadSocial, cuentaBancaria, notas, fechaAlta: fechaAlta || new Date() },
  include: { categoria: true }
});
```

**Impacto:** Alto — un usuario puede manipular cualquier campo del modelo
**Esfuerzo:** Medio — requiere desglose de campos en cada endpoint

---

### [CRÍTICO-004] `.env` con credenciales reales en el repositorio

**Archivo:** `.env`
**Líneas:** 1–15
**Severidad:** CRÍTICA

**Problema:**
El archivo `.env` contiene la URL de conexión a la base de datos con usuario/contraseña y el JWT_SECRET. Este archivo no debe estar en el repositorio. Además, el JWT_SECRET es un valor descriptivo muy débil: `"grupo-rubio-super-secret-key-cambiar-en-produccion-123456"`.

**Código actual:**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/grupo_rubio"
JWT_SECRET="grupo-rubio-super-secret-key-cambiar-en-produccion-123456"
```

**Solución propuesta:**
1. Añadir `.env` al `.gitignore`
2. Generar un JWT_SECRET seguro (mínimo 64 caracteres aleatorios): `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
3. En producción usar un gestor de secretos (variables de entorno del hosting)

**Impacto:** Alto — credenciales expuestas
**Esfuerzo:** Bajo

---

### [CRÍTICO-005] `apiLimiter` importado pero nunca aplicado como middleware

**Archivo:** `src/server.js`
**Líneas:** 30 (import), no aparece en ningún `app.use()`
**Severidad:** CRÍTICA

**Problema:**
Se importa `apiLimiter` (100 req/15 min) pero solo se usa `loginLimiter` en el endpoint de login. Todas las demás rutas de la API no tienen rate limiting. El sistema es vulnerable a brute force en cualquier endpoint.

**Código actual:**
```javascript
// server.js:30
const { loginLimiter, apiLimiter } = require('./middlewares/rateLimiter');

// Solo loginLimiter se usa:
app.post('/api/auth/login', loginLimiter, async (req, res) => { ... });
// apiLimiter: NUNCA usado
```

**Solución propuesta:**
```javascript
// Añadir ANTES de las rutas:
app.use('/api/', apiLimiter);  // Aplica a todas las rutas /api/
```

**Impacto:** Alto — sin protección contra ataques de fuerza bruta
**Esfuerzo:** Bajo — una línea de código

---

### [CRÍTICO-006] Ruta `/trabajadores/:id/completo` sin prefijo `/api`

**Archivo:** `src/server.js`
**Línea:** 525
**Severidad:** CRÍTICA

**Problema:**
La ruta está registrada como `/trabajadores/:id/completo` en lugar de `/api/trabajadores/:id/completo`. Si el frontend la llama con `/api/...` no la encontrará; si la llama sin `/api/` expone datos fuera del esquema de la API.

**Código actual:**
```javascript
// server.js:525
app.get('/trabajadores/:id/completo', authMiddleware, async (req, res) => {
```

**Solución propuesta:**
```javascript
app.get('/api/trabajadores/:id/completo', authMiddleware, async (req, res) => {
```

**Impacto:** Medio — endpoint inaccesible o con ruta no estándar
**Esfuerzo:** Bajo — añadir `/api` al prefijo

---

### [CRÍTICO-007] `calcularImporteAusencia` llamada sin `await` — función async retorna Promise no resuelto

**Archivo:** `src/server.js`
**Línea:** 1399
**Severidad:** CRÍTICA

**Problema:**
`calcularImporteAusencia` es una función `async` (delcara en `utils/calcularImporteAusencia.js:112`). En el endpoint `GET /api/ausencias/:id/calcular-importe` se llama sin `await`, por lo que `calculo` es un Promise no resuelto, no el objeto de resultado. La respuesta al cliente contiene un objeto vacío o serialización incorrecta de un Promise.

**Código actual:**
```javascript
// server.js:1399
const calculo = calcularImporteAusencia(ausencia.trabajador, ausencia);
// ← falta await
```

**Solución propuesta:**
```javascript
const calculo = await calcularImporteAusencia(ausencia.trabajador, ausencia);
```

**Impacto:** Alto — el cálculo de importes de ausencias devuelve datos basura al cliente
**Esfuerzo:** Bajo — añadir `await`

---

## 🟠 PROBLEMAS ALTOS

---

### [ALTO-001] Rutas duplicadas — la primera definición nunca se ejecuta

**Archivo:** `src/server.js`
**Líneas:** 388 vs 431 y 1542 vs 1891
**Severidad:** ALTA

**Problema:**
Express matchea rutas en orden de definición. Hay dos casos de duplicación:

1. **`GET /api/trabajadores/disponibles`** definida en línea 388 Y en línea 431. La versión de línea 431 nunca se alcanza porque la primera ya responde. Además, la primera versión (388) no valida parámetros de hora y la segunda (431) sí — por lo que la validación de conflictos horarios **nunca se ejecuta**.

2. **`GET /api/informes/horas-trabajador`** definida en línea 1542 Y en línea 1891. La versión 1891 (que calcula importes con precios reales) **nunca se ejecuta**.

**Código actual:**
```javascript
// server.js:388 — esta se ejecuta siempre
app.get('/api/trabajadores/disponibles', authMiddleware, async (req, res) => { ... });

// server.js:431 — esta NUNCA se ejecuta (misma ruta, Express ya respondió)
app.get('/api/trabajadores/disponibles', authMiddleware, async (req, res) => { ... });

// server.js:1542 — esta se ejecuta siempre (sin importes)
app.get('/api/informes/horas-trabajador', authMiddleware, async (req, res) => { ... });

// server.js:1891 — esta NUNCA se ejecuta (con importes reales)
app.get('/api/informes/horas-trabajador', authMiddleware, async (req, res) => { ... });
```

**Solución propuesta:**
Eliminar la versión incompleta de cada par y mantener la más completa:
- Para disponibles: mantener la versión de línea 431 (con validación horaria), eliminar la de 388
- Para horas-trabajador: mantener la versión de línea 1891 (con importes), eliminar la de 1542

**Impacto:** Alto — funcionalidad clave inaccesible (precios reales en informes, validación de conflictos)
**Esfuerzo:** Medio — requiere verificar que la versión "nueva" funcione completa antes de eliminar

---

### [ALTO-002] Rutas duplicadas entre server.js y routers montados

**Archivo:** `src/server.js` líneas 1349–1360 y 1501–1509
**Severidad:** ALTA

**Problema:**
Las rutas `GET /api/tipos-ausencia` y `GET /api/categorias` están definidas DOS veces: una en server.js directamente y otra en los routers montados (`tiposAusenciaRoutes` y `categoriasRoutes`). La definición en server.js (inline) va primero, por lo que las versiones del router nunca se ejecutan para GET.

**Código actual:**
```javascript
// server.js:81-82 — monta routers
app.use('/api/categorias', categoriasRoutes);
app.use('/api/tipos-ausencia', tiposAusenciaRoutes);

// server.js:1349 — define OTRA ruta GET /api/tipos-ausencia (inline)
app.get('/api/tipos-ausencia', authMiddleware, async (req, res) => { ... });

// server.js:1501 — define OTRA ruta GET /api/categorias (inline)
app.get('/api/categorias', authMiddleware, async (req, res) => { ... });
```

**Solución propuesta:**
Eliminar las versiones inline de server.js (líneas 1349-1360 y 1501-1509). Las versiones en los routers ya existen.

**Impacto:** Medio — confusión de mantenimiento, riesgo de inconsistencias
**Esfuerzo:** Bajo

---

### [ALTO-003] N+1 queries severo en Dashboard Ejecutivo

**Archivo:** `src/server.js`
**Líneas:** 2924–2940 y 2953–2970
**Severidad:** ALTA

**Problema:**
El dashboard ejecutivo realiza queries individuales dentro de bucles:
1. Para cada centro activo, hace un `prisma.asignacion.count()` — si hay 50 centros, son 50 queries.
2. Para cada trabajador activo, hace un `prisma.registroHoras.aggregate()` — si hay 100 trabajadores, son 100 queries.

Total: potencialmente 150+ queries seriales en un solo endpoint.

**Código actual:**
```javascript
// server.js:2924 — loop con query por centro
for (const centro of centrosActivos) {
  const asignacionesFuturas = await prisma.asignacion.count({
    where: { centroId: centro.id, ... }
  });
}

// server.js:2953 — loop con query por trabajador
for (const trab of trabajadoresConExceso) {
  const horasSemana = await prisma.registroHoras.aggregate({
    where: { trabajadorId: trab.id, ... }
  });
}
```

**Solución propuesta:**
Usar `groupBy` de Prisma para obtener los datos en una sola query:
```javascript
// Una query agrupada por centro
const asignacionesPorCentro = await prisma.asignacion.groupBy({
  by: ['centroId'],
  where: { fecha: { gte: hoy, lte: en7Dias }, estado: { notIn: ['CANCELADO'] } },
  _count: { id: true }
});

// Una query agrupada por trabajador
const horasPorTrabajador = await prisma.registroHoras.groupBy({
  by: ['trabajadorId'],
  where: { fecha: { gte: lunes, lte: domingo } },
  _sum: { horasNormales: true, horasExtra: true }
});
```

**Impacto:** Alto — rendimiento grave con ~100 trabajadores
**Esfuerzo:** Medio

---

### [ALTO-004] N+1 queries en control-horas/nomina — `calcularImporteAusencia` dentro de bucle diario

**Archivo:** `src/routes/controlHoras.js`
**Líneas:** 318
**Severidad:** ALTA

**Problema:**
Para cada día de cada trabajador, si hay ausencia, se llama a `calcularImporteAusencia()` que internamente hace otra query a la base de datos (`obtenerHorasPerdidas`). Con un mes de 30 días y 100 trabajadores, esto puede generar miles de queries.

**Código actual:**
```javascript
// controlHoras.js:318
const calculoAusencia = await calcularImporteAusencia(trabajador, ausenciaDia);
```

**Solución propuesta:**
Pre-calcular los importes de ausencia una vez por ausencia (no por día), y distribuir el resultado a los días correspondientes.

**Impacto:** Alto — rendimiento grave en el módulo de nóminas
**Esfuerzo:** Medio

---

### [ALTO-005] Dependencias duplicadas: `bcrypt` y `bcryptjs` ambas instaladas y usadas

**Archivo:** `package.json` líneas 17–18, `src/server.js` línea 11, `prisma/seed.js` línea 7
**Severidad:** ALTA

**Problema:**
El `package.json` incluye tanto `bcrypt` (nativo, necesita compilación) como `bcryptjs` (JS puro). `server.js` usa `bcryptjs` y `seed.js` usa `bcrypt`. Si un hash se crea con uno y se verifica con el otro, la comparación FALLA silenciosamente.

**Código actual:**
```javascript
// server.js:11
const bcrypt = require('bcryptjs');   // ← bcryptjs

// prisma/seed.js:7
const bcrypt = require('bcrypt');     // ← bcrypt (diferente!)
```

**Solución propuesta:**
Usar únicamente `bcryptjs` en todo el proyecto (más portable, no necesita compilación). Eliminar `bcrypt` de dependencias.

**Impacto:** Alto — posible incompatibilidad de hashes entre seed y login
**Esfuerzo:** Bajo

---

### [ALTO-006] `build` script con `--force-reset --accept-data-loss`

**Archivo:** `package.json`
**Línea:** 9
**Severidad:** ALTA

**Problema:**
El script `build` ejecuta `prisma db push --force-reset --accept-data-loss`. Si alguien ejecuta `npm run build` en producción, **borra toda la base de datos**.

**Código actual:**
```json
"build": "prisma db push --force-reset --accept-data-loss && prisma generate && npm run db:seed"
```

**Solución propuesta:**
```json
"build": "prisma generate",
"db:push": "prisma db push"
```
La migración de producción debe usar `prisma migrate deploy`, nunca `db push --force-reset`.

**Impacto:** Alto — destrucción de datos en producción
**Esfuerzo:** Bajo

---

### [ALTO-007] Archivos basura en la carpeta backend raíz

**Archivo:** `/backend/`
**Severidad:** ALTA

**Problema:**
En la carpeta raíz del backend existen archivos que son artefactos de comandos shell mal ejecutados: `{`, `0`, `23`, `cd`, `horasContrato)`, `npx`. También existe `ausenciaService.js` en la raíz que es **un duplicado exacto** del archivo en `src/services/ausenciaService.js`.

**Archivos a eliminar:**
- `/backend/{`
- `/backend/0`
- `/backend/23`
- `/backend/cd`
- `/backend/horasContrato)`
- `/backend/npx`
- `/backend/ausenciaService.js` (duplicado de `src/services/ausenciaService.js`)
- `/backend/test-protecciones.js` (test manual, no pertenece en producción)

**Impacto:** Medio — confusión, posible error de import incorrecto
**Esfuerzo:** Bajo

---

### [ALTO-008] Múltiples instancias de PrismaClient creadas por archivo

**Archivo:** Todos los archivos de routes, services y utils
**Severidad:** ALTA

**Problema:**
Cada archivo crea su propia instancia: `const prisma = new PrismaClient()`. Esto genera múltiples conexiones al pool de la base de datos, consumiendo recursos innecesarios. Con 10+ archivos, se abre 10+ pools de conexiones.

**Archivos afectados:**
`server.js`, `ausenciaService.js` (raíz), `calcularHoras.js`, `calcularImporteAusencia.js`, `src/services/ausenciaService.js`, `src/routes/categorias.js`, `src/routes/controlHoras.js`, `src/routes/horariosFijos.js`, `src/routes/tiposAusencia.js`, `src/routes/acuerdosIndividuales.js`, `src/routes/ajustesManuales.js`, `src/routes/informes.js`, `src/middlewares/auditLogger.js`

**Solución propuesta:**
Crear un singleton en un archivo centralizado:
```javascript
// src/config/prisma.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;

// En cada archivo:
const prisma = require('../config/prisma');
```

**Impacto:** Alto — agota el pool de conexiones bajo carga
**Esfuerzo:** Medio — cambiar imports en ~13 archivos

---

### [ALTO-009] Errores exponen `error.message` al cliente

**Archivo:** `src/server.js`
**Líneas:** 972, 1039, 1117, 1176, 2591
**Severidad:** ALTA

**Problema:**
Varios endpoints devuelven `error.message` directamente en la respuesta JSON sin verificar el entorno. Esto puede exponer stack traces, nombres de tablas, queries SQL y estructura interna de la base de datos.

**Código actual:**
```javascript
// server.js:972
res.status(500).json({ error: 'Error: ' + error.message });

// server.js:1039
res.status(500).json({ error: err.message || 'Error al copiar semana' });

// server.js:2591 (setup-admin)
res.status(500).json({ error: error.message });
```

**Solución propuesta:**
```javascript
res.status(500).json({
  error: 'Error interno del servidor',
  mensaje: process.env.NODE_ENV === 'development' ? error.message : undefined
});
```

**Impacto:** Medio — información sensible expuesta
**Esfuerzo:** Bajo

---

## 🟡 PROBLEMAS MEDIOS

---

### [MEDIO-001] Indentación y formato inconsistente en server.js

**Archivo:** `src/server.js`
**Severidad:** MEDIA

**Problema:**
El archivo mezcla indentación de 2, 4 y 8 espacios. Hay bloques de código con indentación de 12 espacios (líneas 554–586), otros con 2 (líneas 729–763), y algunos con indentación mixta dentro del mismo bloque. El código tiene comentarios tipo `// ← AÑADE ESTA LÍNEA` que son instrucciones de desarrollo, no comentarios de producción.

**Impacto:** Medio — dificulta el mantenimiento
**Esfuerzo:** Medio — formatear con prettier/eslint

---

### [MEDIO-002] `console.log` y `console.error` excesivos en producción

**Archivo:** Múltiples archivos
**Severidad:** MEDIA

**Problema:**
Hay 40+ llamadas a `console.log` con emojis y datos detallados (ejemplo: `calcularImporteAusencia.js` lineas 67, 83, 102, 117, 127–131, 156, 173, 199, 215). En producción esto contamina los logs del hosting y puede exponer datos sensibles de trabajadores.

**Solución propuesta:**
Usar un logger condicional:
```javascript
const log = process.env.NODE_ENV === 'development' ? console.log : () => {};
```
O implementar un logger propio con niveles (debug/info/warn/error).

**Impacto:** Medio — datos personales en logs, rendimiento
**Esfuerzo:** Medio

---

### [MEDIO-003] Validación de horario en `validarHorarioLimpieza.js` incorrecta para cruces de medianoche

**Archivo:** `utils/validarHorarioLimpieza.js`
**Líneas:** 33–35
**Severidad:** MEDIA

**Problema:**
La lógica de validación para horarios que cruzan medianoche es incorrecta. Usa OR (`||`) donde debería usar AND (`&&`) para verificar que inicio y fin estén dentro del rango:

**Código actual:**
```javascript
// validarHorarioLimpieza.js:34
if (rangoFin < rangoInicio) {
  return (inicioMinutos >= rangoInicio || finMinutos <= rangoFin);
  // ← OR permite que CUALQUIERA de las dos condiciones sea verdadera
}
```

**Solución propuesta:**
```javascript
if (rangoFin < rangoInicio) {
  // Para turnos que cruzan medianoche, inicio debe estar >= rangoInicio
  // Y fin debe estar <= rangoFin
  return (inicioMinutos >= rangoInicio && finMinutos <= rangoFin);
}
```

**Impacto:** Medio — permite horarios inválidos en centros con horario fijo
**Esfuerzo:** Bajo

---

### [MEDIO-004] Solapamiento de asignaciones no detecta todos los casos

**Archivo:** `src/server.js`
**Líneas:** 865–874
**Severidad:** MEDIA

**Problema:**
La verificación de conflictos de horario al crear una asignación no cubre el caso donde una asignación nueva contiene COMPLETAMENTE a otra existente (la nueva es más larga).

**Código actual:**
```javascript
OR: [
  { horaInicio: { lte: horaInicio }, horaFin: { gt: horaInicio } },  // nueva corta el inicio
  { horaInicio: { lt: horaFin }, horaFin: { gte: horaFin } }          // nueva corta el final
  // FALTA: existente contenida dentro de nueva
]
```

**Solución propuesta:**
```javascript
OR: [
  { horaInicio: { lte: horaInicio }, horaFin: { gt: horaInicio } },
  { horaInicio: { lt: horaFin }, horaFin: { gte: horaFin } },
  { horaInicio: { gte: horaInicio }, horaFin: { lte: horaFin } }  // ← AÑADIR
]
```

**Impacto:** Medio — permite asignaciones solapadas
**Esfuerzo:** Bajo

---

### [MEDIO-005] Copiar semana no verifica conflictos ni ausencias

**Archivo:** `src/server.js`
**Líneas:** 986–1041
**Severidad:** MEDIA

**Problema:**
El endpoint `POST /api/asignaciones/copiar-semana` copia todas las asignaciones de una semana a otra sin verificar:
- Si el trabajador tiene ausencias en la semana destino
- Si ya existen asignaciones en la semana destino (duplicados)
- Si el trabajador tiene conflictos horarios

**Impacto:** Medio — puede crear datos inconsistentes
**Esfuerzo:** Medio

---

### [MEDIO-006] Aplicar plantilla no verifica conflictos ni calcula horas

**Archivo:** `src/server.js`
**Líneas:** 1121–1178
**Severidad:** MEDIA

**Problema:**
Similar al anterior: `POST /api/plantillas/:id/aplicar` crea asignaciones sin verificar conflictos, sin calcular horas con `calcularDetalleHoras`, sin crear `RegistroHoras`, y calcula horas de forma manual e incorrecta para turnos que cruzan medianoche (línea 1152):
```javascript
const horas = (hF * 60 + mF - hI * 60 - mI) / 60; // ← no maneja medianoche
```

**Impacto:** Medio — datos de horas incorrectos
**Esfuerzo:** Medio

---

### [MEDIO-007] Ausencias: `diasTotales` calcula días naturales, no laborables

**Archivo:** `src/services/ausenciaService.js` y `ausenciaService.js` (raíz)
**Líneas:** 95 y 107
**Severidad:** MEDIA

**Problema:**
`diasTotales` se calcula como la diferencia entre fechaInicio y fechaFin en días naturales (+1). Esto incluye fines de semana y festivos. Si el campo se usa para descontar saldo de vacaciones, el descuento será incorrecto.

**Código actual:**
```javascript
const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
```

**Impacto:** Medio — saldo de vacaciones incorrecto si se usa diasTotales directamente
**Esfuerzo:** Medio — requiere calcular solo días laborables

---

### [MEDIO-008] Rola de autorización solo distingue ADMIN vs resto

**Archivo:** `src/server.js`
**Líneas:** 116–121
**Severidad:** MEDIA

**Problema:**
Solo existe `adminOnly` como middleware de rol. No hay verificación de RRHH ni PLANIFICADOR. Los roles RRHH y PLANIFICADOR tienen exactamente los mismos permisos que TRABAJADOR en el backend (acceso a todo excluido lo de admin). El esquema define 4 roles pero solo se implementan 2 niveles de autorización.

**Impacto:** Medio — autorización insuficiente según el modelo de negocio
**Esfuerzo:** Medio — crear middlewares por rol

---

## 🟢 MEJORAS SUGERIDAS (no urgentes)

---

### [MEJORA-001] Keep-alive con `fetch` no disponible en Node < 18

**Archivo:** `src/server.js`
**Líneas:** 2612–2627
**Severidad:** BAJA

`fetch` es global solo desde Node 18. Si se ejecuta en versiones anteriores, el keep-alive falla silenciosamente. El `package.json` requiere `>=18.0.0` así que es consistente, pero debería verificarse en el entorno de producción.

---

### [MEJORA-002] Usar transacciones para operaciones multi-step

**Archivo:** `src/server.js` (crear asignación), `src/routes/horariosFijos.js` (generar asignaciones)
**Severidad:** BAJA

Las operaciones que crean asignación + registroHoras + actualización de alertas no están envueltas en transacciones. Si falla la segunda operación, la primera ya fue persistida.

**Ejemplo:**
```javascript
// Envolver en transacción:
await prisma.$transaction(async (tx) => {
  const asignacion = await tx.asignacion.create({ ... });
  await tx.registroHoras.create({ ... });
  // Si algo falla, todo se revierte
});
```

---

### [MEJORA-003] Eliminar dependencia de `morgan` en producción

**Archivo:** `src/server.js` línea 62
**Severidad:** BAJA

Morgan logea cada request HTTP. En producción con hosting serverless esto genera mucho ruido. Considerar usar solo en desarrollo:
```javascript
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
```

---

### [MEJORA-004] Añadir `.gitignore` adecuado

**Severidad:** BAJA

Crear `.gitignore` que incluya:
```
node_modules/
dist/
.env
*.log
```

---

### [MEJORA-005] Añadir validación de formato de hora en endpoints de asignaciones

**Archivo:** `src/server.js` (POST asignaciones)
**Severidad:** BAJA

Las horas se reciben como strings (`horaInicio`, `horaFin`) sin validar formato. Un valor como `"25:00"` o `"abc"` pasará a la base de datos y corromperá los cálculos.

---

### [MEJORA-006] Añadir índice en `HistorialCambios` por `usuarioId`

**Archivo:** `prisma/schema.prisma`
**Severidad:** BAJA

Si se implementan consultas de auditoría por usuario, faltará un índice. El modelo solo tiene un índice compuesto por `tablaAfectada + registroId + createdAt`.

---

## 🏗️ PROPUESTA DE REESTRUCTURACIÓN

### Estructura actual:
```
/backend
  /src
    server.js                    ← 3.130 líneas, todo mezclado
    /routes
      categorias.js
      controlHoras.js
      horariosFijos.js
      informes.js
      tiposAusencia.js
      acuerdosIndividuales.js
      ajustesManuales.js
    /middlewares
      auditLogger.js
      errorHandler.js
      rateLimiter.js
      validation.js
    /services
      ausenciaService.js
    /validators
      ausenciaValidators.js
  /utils                         ← fuera de /src
    calcularHoras.js
    calcularImporteAusencia.js
    calcularPrecioHora.js
    validarHorarioLimpieza.js
  /prisma
    schema.prisma
    seed.js
  ausenciaService.js             ← duplicado
  test-protecciones.js           ← test en raíz
  {, 0, 23, cd, npx, ...        ← basura
```

### Estructura propuesta:
```
/backend
  /src
    server.js                    ← solo app setup, middlewares globales, listen
    /config
      prisma.js                  ← singleton PrismaClient
      jwt.js                     ← constantes JWT
    /routes
      index.js                   ← monta todos los routers con auth
      auth.js                    ← login, me
      trabajadores.js
      clientes.js
      centros.js
      asignaciones.js
      ausencias.js
      plantillas.js
      categorias.js
      tiposAusencia.js
      acuerdosIndividuales.js
      horariosFijos.js
      ajustesManuales.js
      informes.js
      controlHoras.js
      dashboard.js
      nominas.js
    /controllers                 ← lógica de cada endpoint extraída
      trabajadorController.js
      ausenciaController.js
      asignacionController.js
      nominaController.js
    /services
      ausenciaService.js
      nominaService.js           ← extraer cálculos de nómina
      asignacionService.js       ← extraer lógica de creación
    /middlewares
      auth.js                    ← authMiddleware exportado
      adminOnly.js
      roleGuard.js               ← middleware genérico por rol
      auditLogger.js
      errorHandler.js
      rateLimiter.js
      validation.js
    /validators
      ausenciaValidators.js
      trabajadorValidator.js
      asignacionValidator.js
    /utils
      calcularHoras.js
      calcularImporteAusencia.js
      calcularPrecioHora.js
      validarHorarioLimpieza.js
      helpers.js
  /prisma
    schema.prisma
    seed.js
  package.json
  .env.example
  .gitignore
```

### Justificación:
1. **`/config/prisma.js`** — elimina 13 instancias duplicadas de PrismaClient
2. **`/routes/index.js`** — monta todos los routers con `authMiddleware` como capa única, eliminando el bug de routers sin auth
3. **`/controllers`** — extrae la lógica de ~80 endpoints actualmente en server.js (3.130 líneas) a archivos de ~50-100 líneas
4. **`/services/nominaService.js`** — centraliza la lógica de cálculo de nóminas que actualmente está fragmentada entre 3 endpoints y 4 archivos de utils
5. **`/middlewares/auth.js`** — exporta el authMiddleware para uso en routers individuales si es necesario

---

## 📈 MÉTRICAS DE CÓDIGO

| Métrica | Valor |
|---|---|
| Complejidad ciclomática estimada (server.js) | Alta — funciones de 100+ líneas con múltiples condicionales |
| Funciones >50 líneas | 12 (incluyendo los bloques inline en server.js) |
| Archivos >300 líneas | 3 (`server.js` 3130, `controlHoras.js` 479, `horariosFijos.js` 669) |
| Código duplicado | ~15% — `ausenciaService.js` duplicado, lógica de cálculo de horas repetida en 3 lugares, sobreescritura de indentación |
| Cobertura de manejo de errores | ~60% — los routers de archivos separados tienen try/catch pero server.js inline mezcla asyncHandler con try/catch manual |
| Endpoints sin autenticación | 8 routers completos + 1 endpoint setup-admin |

---

## ⚠️ MÓDULO DE NÓMINAS - ANÁLISIS ESPECIAL

### Archivos relacionados:
- `utils/calcularHoras.js` — cálculo de horas normales/extras/nocturnas/festivas
- `utils/calcularImporteAusencia.js` — cálculo de importes de ausencias
- `utils/calcularPrecioHora.js` — precio por hora según categoría y acuerdos
- `src/routes/controlHoras.js` — endpoint `/nomina` con cálculo día a día
- `src/server.js` líneas 2631–2793 — endpoint `/api/nominas/calcular/:trabajadorId`
- `src/server.js` líneas 1891–2113 — endpoint `/api/informes/horas-trabajador` (NUNCA ejecutado, ver ALTO-001)

### Flujo de datos actual:
```
Categoría (salarioBase, precioHora, recargos%)
    ↓
Trabajador (horasContrato, categoriaId)
    ↓                          ↓
AcuerdosIndividuales      Asignaciones (fecha, horaInicio, horaFin)
    ↓                          ↓
calcularPrecioHora()     calcularHoras.js → RegistroHoras
    ↓                          ↓
    └──────────→ NÓMINA ←──────┘
                   ↓
              Ausencias → calcularImporteAusencia()
```

### Validaciones encontradas:
- ✅ Solapamiento de ausencias se verifica antes de crear
- ✅ Conflicto de horario se verifica al crear asignación
- ✅ Recálculo semanal se ejecuta al crear asignación
- ✅ Tramos de porcentaje por días de ausencia (usaTramos/tramosJson)
- ✅ Días de carencia se aplican en cálculo de ausencias
- ✅ Tope diario de euros en ausencias
- ❌ Las horas extras NO se calculan en el endpoint `/api/nominas/calcular/:trabajadorId`
- ❌ Las horas festivas NO se calculan en el endpoint `/api/nominas/calcular/:trabajadorId` (hay un TODO en línea 2706)
- ❌ El cálculo de ausencias en nominas (línea 2738) usa `salarioBase / 30` en lugar del módulo `calcularImporteAusencia` que implementa los tramos correctamente
- ❌ La función `calcularImporteAusencia` se llama sin `await` en línea 1399

### Cálculos críticos identificados:

**1. Horas nocturnas (calcularHoras.js:40)**
```javascript
if (horaActual >= 22 || horaActual < 6)  // ← Nocturno desde 22:00
```
El comentario del archivo dice "23:00 - 06:00" pero el código implementa "22:00 - 06:00". La alerta del endpoint de asignaciones (línea 954) dice "22:00-06:00". Debe verificarse qué define el **Convenio Limpieza Navarra 2024-2027** como horario nocturno. Si es 21:00-06:00 o 22:00-06:00, la implementación debe coincidir exactamente.

**2. Precio hora de ausencias (calcularImporteAusencia.js:51)**
```javascript
const horasMes = parseFloat(trabajador.horasContrato) * 4.33;
```
El multiplicador 4.33 (semanas/mes) es una aproximación. El valor exacto es `horasAnuales / 12`. Si el convenio establece 1673.33h anuales, el valor mensual correcto es `1673.33 / 12 = 139.44h`. Con `horasContrato = 37.5h/sem × 4.33 = 162.375h/mes`, hay un 16% de diferencia.

**3. Nómina endpoint (server.js:2696-2713)**
El cálculo de horas nocturnas usa una heurística oversimplificada:
```javascript
const esNocturna = horaInicioH >= 23 || horaFinH <= 6;
```
Esto clasifica un turno completo como nocturno si CUALQUIER hora está en el rango, en lugar de descomponer la fracción nocturna vs diurna como hace `calcularHorasNocturnas()`.

### Posibles bugs detectados:

| # | Descripción | Archivo | Línea | Severidad |
|---|---|---|---|---|
| BUG-N1 | `horasExtra` siempre es 0 en `/api/nominas/calcular` | server.js | 2694, 2724 | CRÍTICO para nóminas |
| BUG-N2 | `horasFestivas` siempre es 0 en `/api/nominas/calcular` (TODO no implementado) | server.js | 2706 | CRÍTICO para nóminas |
| BUG-N3 | Ausencias en nominas usan `salarioBase/30` ignorando tramos/carencia | server.js | 2738-2740 | ALTO |
| BUG-N4 | `calcularImporteAusencia` llamada sin `await` | server.js | 1399 | CRÍTICO (ver CRÍTICO-007) |
| BUG-N5 | Informe `/horas-trabajador` con importes NUNCA se ejecuta (duplicado) | server.js | 1891 | ALTO (ver ALTO-001) |
| BUG-N6 | Mulitplicador 4.33 para horas mensuales impreciso vs real del convenio | calcularImporteAusencia.js | 51 | MEDIO |
| BUG-N7 | Nocturnas en nominas: heurística vs desglose real | server.js | 2704 | MEDIO |

### Recomendaciones ESPECÍFICAS para este módulo:
1. **No tocar la lógica** de `calcularImporteAusencia.js`, `calcularHoras.js` ni `calcularPrecioHora.js` hasta que se confirme el convenio
2. **Unificar**: el endpoint `/api/nominas/calcular` debe usar las mismas funciones que los informes detallados (`calcularTotalHoras`, `calcularHorasNocturnas`, `calcularImporteAusencia` con await)
3. **Verificar con el convenio**: el horario nocturno (22:00 vs 23:00), el multiplicador de horas mensuales (4.33 vs real), y los tramos de ausencia por baja médica

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Semana 1 — Seguridad (CRÍTICO):
- [x] **CRÍTICO-001** Eliminar endpoint `/api/setup-admin`
- [x] **CRÍTICO-002** Extraer `authMiddleware` a archivo separado y aplicar al montaje de todos los routers
- [x] **CRÍTICO-004** Añadir `.env` al `.gitignore`, generar JWT_SECRET seguro
- [x] **CRÍTICO-005** Aplicar `apiLimiter` como middleware global (`app.use('/api/', apiLimiter)`)
- [x] **CRÍTICO-007** Añadir `await` en la llamada a `calcularImporteAusencia` (línea 1399)
- [x] **ALTO-005** Unificar a `bcryptjs` en todo el proyecto
- [x] **ALTO-006** Corregir script `build` en package.json
- [x] **ALTO-007** Eliminar archivos basura de la raíz

### Semana 2 — Bugs de nóminas y rutas:
- [x] **ALTO-001** Eliminar versiones duplicadas de rutas, mantener las completas
- [x] **ALTO-002** Eliminar rutas GET duplicadas inline vs router
- [x] **CRÍTICO-003** Filtrar `req.body` en POST/PUT de trabajadores
- [x] **CRÍTICO-006** Corregir ruta `/trabajadores/:id/completo` — añadir `/api`
- [x] **BUG-N1/N2** En `/api/nominas/calcular`: usar `calcularTotalHoras` + `esFestivo` reales
- [x] **BUG-N3** En `/api/nominas/calcular`: usar `calcularImporteAusencia` para ausencias

### Semana 3 — Reestructuración y optimización:
- [x] **ALTO-008** Crear singleton PrismaClient en `config/prisma.js`
- [x] **ALTO-003** Reemplazar N+1 queries en dashboard ejecutivo por `groupBy`
- [x] **MEDIO-002** Condicionar console.log al entorno
- [x] **MEDIO-003** Corregir validación de horario en cruces de medianoche
- [x] **MEDIO-004** Añadir caso faltante en verificación de solapamiento
- [x] Extraer endpoints de server.js a archivos de routes separados
- [x] Añadir validación de formato de hora en asignaciones

### Semana 4 — Mejoras de calidad:
- [x] **MEDIO-001** Formatear server.js con prettier
- [x] **MEDIO-005** Añadir verificación de conflictos en copiar-semana
- [x] **MEDIO-006** Añadir verificación de conflictos en aplicar plantilla
- [x] **MEDIO-007** Revisar cálculo de diasTotales (laborables vs naturales)
- [x] **MEDIO-008** Implementar middlewares de rol (RRHH, PLANIFICADOR)
- [x] Añadir transacciones para operaciones multi-step

---

## 🎯 CONCLUSIONES

### Estado general del backend:
El backend funciona y cubre la lógica de negocio principal, pero tiene **deudas técnicas severas de seguridad** que deben ser corregidas antes de cualquier despliegue en producción. El problema más urgente es que **7 de los 8 routers no tienen autenticación**, lo que expone datos salariales y permite modificaciones sin token.

### Problemas que requieren atención inmediata:
1. **Seguridad**: endpoint sin auth (`setup-admin`), routers sin auth, rate limiting no aplicado, `.env` con secretos
2. **Datos incorrectos**: la ruta de nómina más completa nunca se ejecuta (duplicada), `await` faltante en cálculo de ausencias, horas extras y festivas siempre son 0 en nominas
3. **Estabilidad**: mass assignment en trabajadores, 13 instancias de PrismaClient, N+1 queries en dashboard

### Advertencias importantes:
- **NO modificar** la lógica de `calcularHoras.js`, `calcularImporteAusencia.js` ni `calcularPrecioHora.js` hasta confirmar los valores del Convenio Limpieza Navarra 2024-2027 (horario nocturno, horas mensuales, porcentajes)
- El endpoint `/api/nominas/calcular/:trabajadorId` (server.js:2631) tiene **3 bugs de cálculo** que producen resultados incorrectos. Debe reemplazarse por llamadas a las funciones de utils que ya implementan la lógica correcta
- La estructura actual con 3.130 líneas en un solo archivo hace imposible mantener el código sin errores. La reestructuración no es opcional a mediano plazo
