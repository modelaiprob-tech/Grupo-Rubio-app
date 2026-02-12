// ============================================
// SERVIDOR API - GRUPO RUBIO
// Sistema de Gestión de Horas
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Middlewares
const { authMiddleware } = require('./middlewares/auth');
const { errorHandler } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

// Rutas
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const dashboardRoutes = require('./routes/dashboard');
const trabajadoresRoutes = require('./routes/trabajadores');
const clientesRoutes = require('./routes/clientes');
const centrosRoutes = require('./routes/centros');
const asignacionesRoutes = require('./routes/asignaciones');
const plantillasRoutes = require('./routes/plantillas');
const ausenciasRoutes = require('./routes/ausencias');
const registroHorasRoutes = require('./routes/registroHoras');
const festivosRoutes = require('./routes/festivos');
const nominasRoutes = require('./routes/nominas');
const informesRoutes = require('./routes/informes');
const horariosFijosRoutes = require('./routes/horariosFijos');
const categoriasRoutes = require('./routes/categorias');
const controlHorasRoutes = require('./routes/controlHoras');
const tiposAusenciaRoutes = require('./routes/tiposAusencia');
const acuerdosRoutes = require('./routes/acuerdosIndividuales');
const ajustesManualesRoutes = require('./routes/ajustesManuales');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE GLOBAL
// ============================================
app.use(helmet());

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting global
app.use('/api/', apiLimiter);

// ============================================
// FORZAR HTTPS EN PRODUCCIÓN
// ============================================
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// ============================================
// HEALTH CHECK (sin auth)
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================
// MONTAJE DE RUTAS
// ============================================

// Auth (sin middleware global - tiene su propio rate limiting)
app.use('/api/auth', authRoutes);

// Rutas protegidas por autenticación
app.use('/api/usuarios', authMiddleware, usuariosRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/trabajadores', authMiddleware, trabajadoresRoutes);
app.use('/api/clientes', authMiddleware, clientesRoutes);
app.use('/api/centros', authMiddleware, centrosRoutes);
app.use('/api/asignaciones', authMiddleware, asignacionesRoutes);
app.use('/api/plantillas', authMiddleware, plantillasRoutes);
app.use('/api/ausencias', authMiddleware, ausenciasRoutes);
app.use('/api/registro-horas', authMiddleware, registroHorasRoutes);
app.use('/api/festivos', authMiddleware, festivosRoutes);
app.use('/api/nominas', authMiddleware, nominasRoutes);
app.use('/api/informes', authMiddleware, informesRoutes);
app.use('/api/horarios-fijos', authMiddleware, horariosFijosRoutes);
app.use('/api/categorias', authMiddleware, categoriasRoutes);
app.use('/api/control-horas', authMiddleware, controlHorasRoutes);
app.use('/api/tipos-ausencia', authMiddleware, tiposAusenciaRoutes);
app.use('/api/acuerdos-individuales', authMiddleware, acuerdosRoutes);
app.use('/api/ajustes-manuales', authMiddleware, ajustesManualesRoutes);

// Compatibilidad: rutas legacy sin prefijo /api/
app.use('/trabajadores', authMiddleware, trabajadoresRoutes);
app.use('/api/trabajador-centro', authMiddleware, trabajadoresRoutes);

// ============================================
// MANEJO DE ERRORES (siempre al final)
// ============================================
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 API Grupo Rubio corriendo en http://localhost:${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
});

// ============================================
// KEEP-ALIVE: Mantener servidor despierto (Render)
// ============================================
if (process.env.NODE_ENV === 'production') {
  const BACKEND_URL = process.env.BACKEND_URL || 'https://grupo-rubio-backend.onrender.com';

  setInterval(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      if (response.ok) {
        console.log('✅ Keep-alive ping successful');
      }
    } catch (error) {
      console.log('⚠️ Keep-alive ping failed:', error.message);
    }
  }, 10 * 60 * 1000);

  console.log('🔄 Keep-alive activado (ping cada 10 min)');
}

module.exports = app;
