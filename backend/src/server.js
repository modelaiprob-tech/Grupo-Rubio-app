// ============================================
// SERVIDOR API - GRUPO RUBIO
// Sistema de Gestión de Horas
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { calcularTotalHoras, calcularHorasNocturnas, esFestivo, esDomingo } = require('../utils/calcularHoras');
const horariosFijosRoutes = require('../routes/horariosFijos');
const informesRoutes = require('./routes/informes');
const categoriasRoutes = require('./routes/categorias');
const controlHorasRoutes = require('./routes/controlHoras');
const tiposAusenciaRoutes = require('./routes/tiposAusencia');
const acuerdosRoutes = require('./routes/acuerdosIndividuales');
const ajustesManualesRoutes = require('./routes/ajustesManuales');  // ← AÑADE ESTA LÍNEA
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'grupo-rubio-secret-key-cambiar-en-produccion';
const { calcularDetalleHoras } = require('../utils/calcularHoras');
// ============================================
// FUNCIONES AUXILIARES
// ============================================

function validarCIF(cif) {
  if (!cif || typeof cif !== 'string') return false;
  // Formato: Letra + 7-8 dígitos + dígito/letra
  const regex = /^[A-Z]\d{7,8}[A-Z0-9]$/i;
  return regex.test(cif);
}

function  validarDNI(dni) {
  if (!dni || typeof dni !== 'string') return false;
  // Formato: 8 dígitos + letra
  const regex = /^\d{8}[A-Z]$/i;
  return regex.test(dni);
}

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
// CORS configurado
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/informes', informesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/control-horas', controlHorasRoutes);
app.use('/api/tipos-ausencia', tiposAusenciaRoutes);
app.use('/api/acuerdos-individuales', acuerdosRoutes);
app.use('/api/horarios-fijos', horariosFijosRoutes);
app.use('/api/ajustes-manuales', ajustesManualesRoutes);  // ← AÑADE ESTA LÍNEA


// Middleware de autenticación
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.userId } });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }
    req.user = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ============================================
// RUTAS: AUTENTICACIÓN
// ============================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValid = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar último acceso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() }
    });

    const token = jwt.sign({ userId: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    nombre: req.user.nombre,
    rol: req.user.rol
  });
});

// ============================================
// RUTAS: DASHBOARD
// ============================================
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [trabajadoresActivos, trabajadoresEnBaja, turnosHoy, clientesActivos, ausenciasPendientes] = await Promise.all([
      prisma.trabajador.count({ where: { activo: true } }),
      prisma.ausencia.count({
        where: {
          estado: 'APROBADA',
          tipoAusencia: { codigo: 'BM' },
          fechaInicio: { lte: hoy },
          fechaFin: { gte: hoy }
        }
      }),
      prisma.asignacion.count({ where: { fecha: hoy } }),
      prisma.cliente.count({ where: { activo: true } }),
      prisma.ausencia.count({ where: { estado: 'PENDIENTE' } })
    ]);

    res.json({
      trabajadoresActivos,
      trabajadoresEnBaja,
      turnosHoy,
      clientesActivos,
      ausenciasPendientes
    });
  } catch (error) {
    console.error('Error dashboard stats:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// ============================================
// RUTAS: TRABAJADORES
// ============================================

app.get('/api/trabajadores', authMiddleware, async (req, res) => {
  try {
    const { activo, categoria, busqueda } = req.query;

    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    if (categoria) where.categoriaId = parseInt(categoria);
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { apellidos: { contains: busqueda, mode: 'insensitive' } },
        { dni: { contains: busqueda, mode: 'insensitive' } }
      ];
    }

    const trabajadores = await prisma.trabajador.findMany({
      where,
      include: {
        categoria: true,
        centrosAsignados: { include: { centro: { include: { cliente: true } } } }
      },
      orderBy: { apellidos: 'asc' }
    });

    res.json(trabajadores);
  } catch (error) {
    console.error('Error listando trabajadores:', error);
    res.status(500).json({ error: 'Error listando trabajadores' });
  }
});

/**
 * Obtener trabajadores disponibles (sin ausencias activas)
 * GET /api/trabajadores/disponibles?fecha=YYYY-MM-DD
 */
app.get('/api/trabajadores/disponibles', authMiddleware, async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha ? new Date(fecha) : new Date();
    fechaConsulta.setHours(0, 0, 0, 0);

    // Obtener trabajadores activos
    const trabajadores = await prisma.trabajador.findMany({
      where: { activo: true },
      include: { categoria: true },
      orderBy: [
        { nombre: 'asc' },
        { apellidos: 'asc' }
      ]
    });

    // Obtener ausencias activas en la fecha
    const ausenciasActivas = await prisma.ausencia.findMany({
      where: {
        estado: 'APROBADA',
        fechaInicio: { lte: fechaConsulta },
        fechaFin: { gte: fechaConsulta }
      },
      select: { trabajadorId: true }
    });

    // IDs de trabajadores con ausencias
    const idsConAusencia = new Set(ausenciasActivas.map(a => a.trabajadorId));

    // Filtrar trabajadores disponibles
    const trabajadoresDisponibles = trabajadores.filter(t => !idsConAusencia.has(t.id));

    console.log(`✅ Trabajadores disponibles: ${trabajadoresDisponibles.length}/${trabajadores.length}`);

    res.json(trabajadoresDisponibles);

  } catch (error) {
    console.error('Error obteniendo trabajadores disponibles:', error);
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});
// ⚠️ IMPORTANTE: Este endpoint debe ir ANTES de /api/trabajadores/:id
// porque Express matchea las rutas en orden
app.get('/api/trabajadores/disponibles', authMiddleware, async (req, res) => {
  try {
    const { fecha, horaInicio, horaFin, centroId } = req.query;

    if (!fecha || !horaInicio || !horaFin) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    const todosTrabajadores = await prisma.trabajador.findMany({
      where: { activo: true },
      include: {
        categoria: true,
        centrosAsignados: { include: { centro: { include: { cliente: true } } } }
      }
    });

    const asignacionesDia = await prisma.asignacion.findMany({
      where: {
        fecha: new Date(fecha),
        estado: { notIn: ['CANCELADO'] }
      }
    });

    const disponibles = todosTrabajadores.filter(trabajador => {
      const asignacionesTrabajador = asignacionesDia.filter(
        a => a.trabajadorId === trabajador.id &&
          (!centroId || a.centroId !== parseInt(centroId))
      );

      const tieneConflicto = asignacionesTrabajador.some(asig => {
        return (
          (asig.horaInicio <= horaInicio && asig.horaFin > horaInicio) ||
          (asig.horaInicio < horaFin && asig.horaFin >= horaFin) ||
          (asig.horaInicio >= horaInicio && asig.horaFin <= horaFin)
        );
      });

      return !tieneConflicto;
    });

    res.json(disponibles);
  } catch (error) {
    console.error('Error obteniendo trabajadores disponibles:', error);
    res.status(500).json({ error: 'Error obteniendo trabajadores disponibles' });
  }
});

// Este endpoint debe ir DESPUÉS de /disponibles
app.get('/api/trabajadores/:id', authMiddleware, async (req, res) => {
  try {
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        categoria: true,
        centrosAsignados: { include: { centro: { include: { cliente: true } } } },
        ausencias: { include: { tipoAusencia: true }, orderBy: { fechaInicio: 'desc' }, take: 10 }
      }
    });
    
    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }
    
    const añoActual = new Date().getFullYear();
    const ausenciasAño = await prisma.ausencia.findMany({
      where: {
        trabajadorId: trabajador.id,
        estado: 'APROBADA',
        fechaInicio: { gte: new Date(`${añoActual}-01-01`) }
      },
      include: { tipoAusencia: true }
    });
    
    const diasVacacionesUsados = ausenciasAño
      .filter(a => a.tipoAusencia.restaVacaciones)
      .reduce((sum, a) => sum + a.diasTotales, 0);
    
    const diasAsuntosUsados = ausenciasAño
      .filter(a => a.tipoAusencia.restaAsuntos)
      .reduce((sum, a) => sum + a.diasTotales, 0);
    
    res.json({
      ...trabajador,
      saldos: {
        vacaciones: { usados: diasVacacionesUsados, total: trabajador.diasVacacionesAnuales },
        asuntosPropios: { usados: diasAsuntosUsados, total: trabajador.diasAsuntosPropios }
      }
    });
  } catch (error) {
    console.error('Error obteniendo trabajador:', error);
    res.status(500).json({ error: 'Error obteniendo trabajador' });
  }
});
// GET trabajador completo con categoría y acuerdos
app.get('/trabajadores/:id/completo', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        acuerdosIndividuales: {
          where: { activo: true },
          include: {
            centro: {
              select: { id: true, nombre: true }
            }
          }
        }
      }
    });

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    res.json(trabajador);
  } catch (error) {
    console.error('Error obteniendo trabajador completo:', error);
    res.status(500).json({ error: 'Error al obtener trabajador' });
  }
});
        app.post('/api/trabajadores', authMiddleware, async (req, res) => {
          try {
            // ✅ VALIDAR DNI
    if (!validarDNI(req.body.dni)) {
      return res.status(400).json({ 
        error: 'DNI inválido. Debe ser 8 números + letra (ej: 12345678Z)' 
      });
    }
            const trabajador = await prisma.trabajador.create({
              data: req.body,
              include: { categoria: true }
            });

            // Registrar en historial
            await prisma.historialCambios.create({
              data: {
                tablaAfectada: 'trabajadores',
                registroId: trabajador.id,
                accion: 'INSERT',
                datosNuevos: trabajador,
                usuarioId: req.user.id
              }
            });

            res.status(201).json(trabajador);
          } catch (error) {
            console.error('Error creando trabajador:', error);
            res.status(500).json({ error: 'Error creando trabajador' });
          }
        });
        // ============================================
        // RUTAS: TRABAJADOR-CENTRO (Preferencias)
        // ============================================
        app.post('/api/trabajador-centro', authMiddleware, async (req, res) => {
          try {
            const { trabajadorId, centroId, esHabitual } = req.body;

            const relacion = await prisma.trabajadorCentro.create({
              data: {
                trabajadorId: parseInt(trabajadorId),
                centroId: parseInt(centroId),
                esHabitual: esHabitual || false
              }
            });

            res.status(201).json(relacion);
          } catch (err) {
            console.error('Error creando relación trabajador-centro:', err);
            res.status(500).json({ error: 'Error al crear relación' });
          }
        });

        app.delete('/api/trabajador-centro/:id', authMiddleware, async (req, res) => {
          try {
            await prisma.trabajadorCentro.delete({
              where: { id: parseInt(req.params.id) }
            });
            res.json({ message: 'Relación eliminada' });
          } catch (err) {
            console.error('Error eliminando relación:', err);
            res.status(500).json({ error: 'Error al eliminar relación' });
          }
        });
        app.put('/api/trabajadores/:id', authMiddleware, async (req, res) => {
          try {
            // ✅ VALIDAR DNI SI VIENE EN EL BODY
    if (req.body.dni && !validarDNI(req.body.dni)) {
      return res.status(400).json({ 
        error: 'DNI inválido. Debe ser 8 números + letra (ej: 12345678Z)' 
      });
    }
            const id = parseInt(req.params.id);
            const anterior = await prisma.trabajador.findUnique({ where: { id } });

            const trabajador = await prisma.trabajador.update({
              where: { id },
              data: req.body,
              include: { categoria: true }
            });

            // Registrar en historial
            await prisma.historialCambios.create({
              data: {
                tablaAfectada: 'trabajadores',
                registroId: id,
                accion: 'UPDATE',
                datosAnteriores: anterior,
                datosNuevos: trabajador,
                usuarioId: req.user.id
              }
            });

            res.json(trabajador);
          } catch (error) {
            console.error('Error actualizando trabajador:', error);
            res.status(500).json({ error: 'Error actualizando trabajador' });
          }
        });

        // ============================================
        // RUTAS: CLIENTES
        // ============================================
        app.get('/api/clientes', authMiddleware, async (req, res) => {
          try {
            const clientes = await prisma.cliente.findMany({
              where: { activo: true },
              include: {
                centrosTrabajo: {
                  include: {
                    trabajadoresAsignados: true
                  }
                }
              },
              orderBy: { nombre: 'asc' }
            });
            res.json(clientes);
          } catch (error) {
            console.error('Error listando clientes:', error);
            res.status(500).json({ error: 'Error listando clientes' });
          }
        });

        app.post('/api/clientes', authMiddleware, async (req, res) => {
          try {
            // ✅ VALIDAR CIF
    if (!validarCIF(req.body.cif)) {
      return res.status(400).json({ 
        error: 'CIF inválido. Debe ser letra + 7 números + número/letra (ej: B12345678)' 
      });
    }
            const cliente = await prisma.cliente.create({ data: req.body });
            res.status(201).json(cliente);
          } catch (error) {
            console.error('Error creando cliente:', error);
            res.status(500).json({ error: 'Error creando cliente' });
          }
        });

        // ============================================
        // RUTAS: CENTROS DE TRABAJO
        // ============================================
        app.get('/api/centros', authMiddleware, async (req, res) => {
          try {
            const { clienteId } = req.query;
            const where = { activo: true };
            if (clienteId) where.clienteId = parseInt(clienteId);

            const centros = await prisma.centroTrabajo.findMany({
              where,
              include: { cliente: true },
              orderBy: { nombre: 'asc' }
            });
            res.json(centros);
          } catch (error) {
            console.error('Error listando centros:', error);
            res.status(500).json({ error: 'Error listando centros' });
          }
        });

        app.post('/api/centros', authMiddleware, async (req, res) => {
          try {
            const centro = await prisma.centroTrabajo.create({
              data: {
                nombre: req.body.nombre,
                direccion: req.body.direccion,
                clienteId: req.body.clienteId,
                horarioApertura: req.body.horarioApertura,
                horarioCierre: req.body.horarioCierre,
                horario_limpieza_inicio: req.body.horarioLimpiezaInicio || null,
                horario_limpieza_fin: req.body.horarioLimpiezaFin || null,
                flexibilidad_horaria: req.body.flexibilidadHoraria || 'FLEXIBLE',
                tipo_servicio: req.body.tipoServicio || 'FRECUENTE'
              }
            })
            res.json(centro)
          } catch (err) {
            console.error('Error creando centro:', err)
            res.status(500).json({ error: 'Error al crear centro' })
          }
        });
        app.put('/api/centros/:id', authMiddleware, async (req, res) => {
          try {
            const centro = await prisma.centroTrabajo.update({
              where: { id: parseInt(req.params.id) },
              data: {
                nombre: req.body.nombre,
                direccion: req.body.direccion,
                horarioApertura: req.body.horarioApertura,
                horarioCierre: req.body.horarioCierre,
                horario_limpieza_inicio: req.body.horarioLimpiezaInicio || null,
                horario_limpieza_fin: req.body.horarioLimpiezaFin || null,
                flexibilidad_horaria: req.body.flexibilidadHoraria || 'FLEXIBLE',
                tipo_servicio: req.body.tipoServicio || 'FRECUENTE'
              },
              include: { cliente: true }
            });
            res.json(centro);
          } catch (err) {
            console.error('Error actualizando centro:', err);
            res.status(500).json({ error: 'Error al actualizar centro' });
          }
        });
        // ============================================
        // RUTAS: ASIGNACIONES (PLANIFICACIÓN)
        // ============================================
        app.get('/api/asignaciones', authMiddleware, async (req, res) => {
          try {
            const { centroId, trabajadorId, fechaDesde, fechaHasta } = req.query;

            const where = {};
            if (centroId) where.centroId = parseInt(centroId);
            if (trabajadorId) where.trabajadorId = parseInt(trabajadorId);
            if (fechaDesde || fechaHasta) {
              where.fecha = {};
              if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
              if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
            }

            const asignaciones = await prisma.asignacion.findMany({
              where,
              include: {
                trabajador: { select: { id: true, nombre: true, apellidos: true } },
                centro: { select: { id: true, nombre: true } }
              },
              orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }]
            });

            res.json(asignaciones);
          } catch (error) {
            console.error('Error listando asignaciones:', error);
            res.status(500).json({ error: 'Error listando asignaciones' });
          }
        });

        app.post('/api/asignaciones', authMiddleware, async (req, res) => {
          try {
            const { trabajadorId, centroId, fecha, horaInicio, horaFin } = req.body;

            // Obtener trabajador
            const trabajador = await prisma.trabajador.findUnique({
              where: { id: trabajadorId },
              select: { id: true, nombre: true, apellidos: true, horasContrato: true }
            });

            if (!trabajador) {
              return res.status(404).json({ error: 'Trabajador no encontrado' });
            }

            // Verificar conflictos
            const conflicto = await prisma.asignacion.findFirst({
              where: {
                trabajadorId,
                fecha: new Date(fecha),
                OR: [
                  { horaInicio: { lte: horaInicio }, horaFin: { gt: horaInicio } },
                  { horaInicio: { lt: horaFin }, horaFin: { gte: horaFin } }
                ]
              }
            });

            if (conflicto) {
              return res.status(400).json({ error: 'Conflicto de horario', conflicto });
            }

            // Verificar ausencias
            const ausencia = await prisma.ausencia.findFirst({
              where: {
                trabajadorId,
                estado: 'APROBADA',
                fechaInicio: { lte: new Date(fecha) },
                fechaFin: { gte: new Date(fecha) }
              }
            });

            if (ausencia) {
              return res.status(400).json({ error: 'El trabajador tiene una ausencia aprobada' });
            }

            // 🔥 IMPORTAR UTILIDAD
const { calcularDetalleHoras, obtenerHorasSemanales, calcularTotalHoras } = require('../utils/calcularHoras');

// Calcular horas usando la función que maneja cruces de medianoche
const horasPlanificadas = calcularTotalHoras(horaInicio, horaFin);

// Validar que las horas sean positivas (ahora funcionará con turnos nocturnos)
if (horasPlanificadas <= 0 || horasPlanificadas > 24) {
  return res.status(400).json({ 
    error: 'Horario inválido' 
  });
}

// Calcular horas acumuladas ANTES de crear
const horasAcumuladas = await obtenerHorasSemanales(trabajadorId, fecha);

            // Crear asignación
            const asignacion = await prisma.asignacion.create({
              data: {
                ...req.body,
                fecha: new Date(fecha),
                horasPlanificadas,
                creadoPorId: req.user.id
              },
              include: {
                trabajador: { select: { id: true, nombre: true, apellidos: true } },
                centro: { select: { id: true, nombre: true } }
              }
            });

            // 🔥 Calcular desglose
            const detalleHoras = await calcularDetalleHoras(asignacion, trabajador, horasAcumuladas);

            // 🔥 CREAR REGISTRO
            await prisma.registroHoras.create({
              data: {
                asignacionId: asignacion.id,
                trabajadorId,
                fecha: new Date(fecha),
                horasNormales: detalleHoras.horasNormales,
                horasExtra: detalleHoras.horasExtra,
                horasNocturnas: detalleHoras.horasNocturnas,
                horasFestivo: detalleHoras.horasFestivo,
                validado: true
              }
            });

            // 🔥 ALERTAS
            const alertas = [];
            if (detalleHoras.excedioContrato) {
              alertas.push({
                tipo: 'HORAS_EXTRA',
                mensaje: `⚠️ Supera contrato (${detalleHoras.horasContrato}h/sem). Acumuladas: ${detalleHoras.horasAcumuladasSemana}h. Extras: ${detalleHoras.horasExtra}h`
              });
            }
            if (detalleHoras.horasNocturnas > 0) {
              alertas.push({
                tipo: 'NOCTURNAS',
                mensaje: `🌙 Incluye ${detalleHoras.horasNocturnas}h nocturnas (23:00-06:00)`
              });
            }
            if (detalleHoras.horasFestivo > 0) {
              alertas.push({
                tipo: 'FESTIVO',
                mensaje: `📅 Festivo/Domingo (${detalleHoras.horasFestivo}h)`
              });
            }

            // 🔥 RECALCULAR TODA LA SEMANA
const { recalcularSemanaTrabajador } = require('../utils/calcularHoras');
await recalcularSemanaTrabajador(trabajadorId, fecha);

            res.status(201).json({ asignacion, alertas, detalleHoras });

          } catch (error) {
            console.error('Error creando asignación:', error);
            res.status(500).json({ error: 'Error: ' + error.message });
          }
        });

        app.delete('/api/asignaciones/:id', authMiddleware, async (req, res) => {
          try {
            await prisma.asignacion.delete({ where: { id: parseInt(req.params.id) } });
            res.json({ message: 'Asignación eliminada' });
          } catch (error) {
            console.error('Error eliminando asignación:', error);
            res.status(500).json({ error: 'Error eliminando asignación' });
          }
        });
        // Copiar asignaciones de una semana a otra
        app.post('/api/asignaciones/copiar-semana', authMiddleware, async (req, res) => {
          try {
            const { fechaOrigenInicio, fechaOrigenFin, fechaDestinoInicio } = req.body;

            // Obtener asignaciones de la semana origen
            const asignacionesOrigen = await prisma.asignacion.findMany({
              where: {
                fecha: {
                  gte: new Date(fechaOrigenInicio),
                  lte: new Date(fechaOrigenFin)
                },
                estado: { not: 'CANCELADO' }
              }
            });

            if (asignacionesOrigen.length === 0) {
              return res.status(404).json({ error: 'No hay asignaciones en la semana origen' });
            }

            // Calcular diferencia de días
            const origenDate = new Date(fechaOrigenInicio);
            const destinoDate = new Date(fechaDestinoInicio);
            const diffDias = Math.floor((destinoDate - origenDate) / (1000 * 60 * 60 * 24));

            // Crear nuevas asignaciones
            const nuevasAsignaciones = [];
            for (const asig of asignacionesOrigen) {
              const nuevaFecha = new Date(asig.fecha);
              nuevaFecha.setDate(nuevaFecha.getDate() + diffDias);

              const nueva = await prisma.asignacion.create({
                data: {
                  trabajadorId: asig.trabajadorId,
                  centroId: asig.centroId,
                  fecha: nuevaFecha,
                  horaInicio: asig.horaInicio,
                  horaFin: asig.horaFin,
                  horasPlanificadas: asig.horasPlanificadas,
                  tipoServicio: asig.tipoServicio,
                  estado: 'PROGRAMADO',
                  creadoPorId: req.user.id
                }
              });
              nuevasAsignaciones.push(nueva);
            }

            res.json({
              mensaje: `${nuevasAsignaciones.length} asignaciones copiadas`,
              asignaciones: nuevasAsignaciones
            });

          } catch (err) {
            console.error('Error copiando semana:', err);
            res.status(500).json({ error: err.message || 'Error al copiar semana' });
          }
        });
        // ============================================
        // PLANTILLAS DE TURNOS
        // ============================================

        // Obtener plantillas
        app.get('/api/plantillas', authMiddleware, async (req, res) => {
          try {
            const plantillas = await prisma.plantillas_turnos.findMany({
              include: {
                centros_trabajo: true,
                plantillas_turnos_detalle: {
                  include: {
                    trabajadores: true
                  }
                }
              },
              orderBy: { created_at: 'desc' }
            });
            res.json(plantillas);
          } catch (err) {
            console.error('Error obteniendo plantillas:', err);
            res.status(500).json({ error: 'Error al obtener plantillas' });
          }
        });

        // Crear plantilla desde semana actual
        app.post('/api/plantillas/crear-desde-semana', authMiddleware, async (req, res) => {
          try {
            const { nombre, descripcion, centroId, fechaInicio, fechaFin } = req.body;

            // Obtener asignaciones de la semana
            const asignaciones = await prisma.asignacion.findMany({
              where: {
                centroId: centroId,
                fecha: {
                  gte: new Date(fechaInicio),
                  lte: new Date(fechaFin)
                },
                estado: { not: 'CANCELADO' }
              }
            });

            if (asignaciones.length === 0) {
              return res.status(400).json({ error: 'No hay turnos en esa semana' });
            }

            // Crear plantilla
            const plantilla = await prisma.plantillas_turnos.create({
              data: {
                nombre,
                descripcion,
                centro_id: centroId,
                creado_por_id: req.user.id
              }
            });

            // Crear detalles
            for (const asig of asignaciones) {
              const diaSemana = new Date(asig.fecha).getDay() || 7; // 0=Dom->7

              await prisma.plantillas_turnos_detalle.create({
                data: {
                  plantilla_id: plantilla.id,
                  trabajador_id: asig.trabajadorId,
                  dia_semana: diaSemana,
                  hora_inicio: asig.horaInicio,
                  hora_fin: asig.horaFin
                }
              });
            }

            res.json({ mensaje: 'Plantilla creada', plantilla });
          } catch (err) {
            console.error('Error creando plantilla:', err);
            res.status(500).json({ error: err.message });
          }
        });

        // Aplicar plantilla
        app.post('/api/plantillas/:id/aplicar', authMiddleware, async (req, res) => {
          try {
            const { id } = req.params;
            const { fechaInicio } = req.body;

            // Obtener plantilla con detalles
            const plantilla = await prisma.plantillas_turnos.findUnique({
              where: { id: parseInt(id) },
              include: { plantillas_turnos_detalle: true }
            });

            if (!plantilla) {
              return res.status(404).json({ error: 'Plantilla no encontrada' });
            }

            const nuevasAsignaciones = [];
            const fechaBase = new Date(fechaInicio);

            // Calcular inicio de semana (lunes)
            const diaSemana = fechaBase.getDay();
            const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
            const lunes = new Date(fechaBase);
            lunes.setDate(fechaBase.getDate() + diff);

            // Crear asignaciones
            for (const detalle of plantilla.plantillas_turnos_detalle) {
              const fecha = new Date(lunes);
              fecha.setDate(lunes.getDate() + (detalle.dia_semana - 1));

              const [hI, mI] = detalle.hora_inicio.split(':').map(Number);
              const [hF, mF] = detalle.hora_fin.split(':').map(Number);
              const horas = (hF * 60 + mF - hI * 60 - mI) / 60;

              const nueva = await prisma.asignacion.create({
                data: {
                  trabajadorId: detalle.trabajador_id,
                  centroId: plantilla.centro_id,
                  fecha: fecha,
                  horaInicio: detalle.hora_inicio,
                  horaFin: detalle.hora_fin,
                  horasPlanificadas: horas,
                  estado: 'PROGRAMADO',
                  creadoPorId: req.user.id
                }
              });
              nuevasAsignaciones.push(nueva);
            }

            res.json({
              mensaje: `${nuevasAsignaciones.length} turnos creados desde plantilla`,
              asignaciones: nuevasAsignaciones
            });

          } catch (err) {
            console.error('Error aplicando plantilla:', err);
            res.status(500).json({ error: err.message });
          }
        });
        // Eliminar plantilla
        app.delete('/api/plantillas/:id', authMiddleware, async (req, res) => {
          try {
            const { id } = req.params;

            // Primero eliminar los detalles
            await prisma.plantillas_turnos_detalle.deleteMany({
              where: { plantilla_id: parseInt(id) }
            });

            // Luego eliminar la plantilla
            await prisma.plantillas_turnos.delete({
              where: { id: parseInt(id) }
            });

            res.json({ mensaje: 'Plantilla eliminada' });
          } catch (err) {
            console.error('Error eliminando plantilla:', err);
            res.status(500).json({ error: 'Error al eliminar plantilla' });
          }
        });

        // Obtener centros con turnos sin cubrir
        app.get('/api/dashboard/centros-sin-cubrir', authMiddleware, async (req, res) => {
          try {
            const hoy = new Date();
            const inicioDia = new Date(hoy);
            inicioDia.setHours(0, 0, 0, 0);

            const finSemana = new Date(hoy);
            const diasHastaFinSemana = 7 - hoy.getDay();
            finSemana.setDate(hoy.getDate() + diasHastaFinSemana);
            finSemana.setHours(23, 59, 59, 999);

            // Obtener todos los centros activos
            const centros = await prisma.centroTrabajo.findMany({
              where: { activo: true },
              include: {
                cliente: true
              }
            });

            const centrosSinCubrir = [];

            for (const centro of centros) {
              // Verificar días laborables (Lun-Vie)
              const tempDate = new Date(inicioDia);
              while (tempDate <= finSemana) {
                const diaSemana = tempDate.getDay();

                if (diaSemana !== 0 && diaSemana !== 6) { // Solo días laborables
                  const iniciodia = new Date(tempDate);
                  iniciodia.setHours(0, 0, 0, 0);
                  const findia = new Date(tempDate);
                  findia.setHours(23, 59, 59, 999);

                  const asignaciones = await prisma.asignacion.count({
                    where: {
                      centroId: centro.id,
                      fecha: {
                        gte: iniciodia,
                        lte: findia
                      },
                      estado: { not: 'CANCELADO' }
                    }
                  });

                  if (asignaciones === 0) {
                    centrosSinCubrir.push({
                      centro: centro.nombre,
                      cliente: centro.cliente?.nombre || 'Sin cliente',
                      centroId: centro.id,
                      fecha: tempDate.toISOString().split('T')[0],
                      diaSemana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][tempDate.getDay()],
                      horario: `${centro.horarioLimpiezaInicio || centro.horarioApertura || '08:00'} - ${centro.horarioLimpiezaFin || centro.horarioCierre || '14:00'}`
                    });
                  }
                }

                tempDate.setDate(tempDate.getDate() + 1);
              }
            }

            res.json(centrosSinCubrir);
          } catch (err) {
            console.error('Error obteniendo centros sin cubrir:', err);
            res.status(500).json({ error: 'Error al obtener centros sin cubrir' });
          }
        });
        // ============================================
        // RUTAS: AUSENCIAS
        // ============================================
        app.get('/api/ausencias', authMiddleware, async (req, res) => {
  try {
    // Extraer todos los parámetros del query
    const { estado, trabajadorId, mes, año, archivada } = req.query;

    // Construir objeto where con validaciones
    const where = {};
    
    // Filtro por estado
    if (estado) {
      where.estado = estado;
    }
    
    // Filtro por trabajador
    if (trabajadorId) {
      const trabajadorIdNum = parseInt(trabajadorId);
      if (isNaN(trabajadorIdNum)) {
        return res.status(400).json({ error: 'trabajadorId debe ser un número' });
      }
      where.trabajadorId = trabajadorIdNum;
    }
    
    // Filtro por archivada
    if (archivada !== undefined) {
      where.archivada = archivada === 'true';
    }
    
    // Filtro por mes y año
    if (mes && año) {
      const mesNum = parseInt(mes);
      const añoNum = parseInt(año);
      
      if (isNaN(mesNum) || isNaN(añoNum) || mesNum < 1 || mesNum > 12) {
        return res.status(400).json({ error: 'Mes o año inválidos' });
      }
      
      const inicioMes = new Date(añoNum, mesNum - 1, 1);
      const finMes = new Date(añoNum, mesNum, 0, 23, 59, 59, 999);
      
      where.OR = [
        { fechaInicio: { gte: inicioMes, lte: finMes } },
        { fechaFin: { gte: inicioMes, lte: finMes } }
      ];
    }

    // Consulta a la base de datos
    const ausencias = await prisma.ausencia.findMany({
      where,
      include: {
        trabajador: { 
          select: { 
            id: true, 
            nombre: true, 
            apellidos: true 
          } 
        },
        tipoAusencia: true,
        aprobadoPor: { 
          select: { 
            id: true, 
            nombre: true 
          } 
        }
      },
      orderBy: { fechaInicio: 'desc' }
    });

    res.json(ausencias);
    
  } catch (error) {
    console.error('Error listando ausencias:', error);
    res.status(500).json({ 
      error: 'Error listando ausencias',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

        app.get('/api/tipos-ausencia', authMiddleware, async (req, res) => {
          try {
            const tipos = await prisma.tipoAusencia.findMany({
              where: { activo: true },
              orderBy: { nombre: 'asc' }
            });
            res.json(tipos);
          } catch (error) {
            console.error('Error listando tipos ausencia:', error);
            res.status(500).json({ error: 'Error listando tipos de ausencia' });
          }
        });

        app.post('/api/ausencias', authMiddleware, async (req, res) => {
          try {
            const { trabajadorId, tipoAusenciaId, fechaInicio, fechaFin, motivo } = req.body;

            // Calcular días totales
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

            // Crear la ausencia
            const ausencia = await prisma.ausencia.create({
              data: {
                trabajadorId,
                tipoAusenciaId,
                fechaInicio: inicio,
                fechaFin: fin,
                diasTotales,
                motivo,
                estado: 'PENDIENTE'
              },
              include: {
                trabajador: { select: { id: true, nombre: true, apellidos: true } },
                tipoAusencia: true
              }
            });

            // 🔥 NUEVA FUNCIONALIDAD: Buscar asignaciones afectadas
            const asignacionesAfectadas = await prisma.asignacion.findMany({
              where: {
                trabajadorId,
                fecha: {
                  gte: inicio,
                  lte: fin
                },
                estado: { notIn: ['CANCELADO', 'COMPLETADO'] }
              },
              include: {
                centro: {
                  include: {
                    cliente: true
                  }
                }
              }
            });

            // Marcar asignaciones con flag de atención (solo si está PENDIENTE)
            for (const asig of asignacionesAfectadas) {
              await prisma.asignacion.update({
                where: { id: asig.id },
                data: {
                  requiereAtencion: true,
                  motivoAtencion: `⚠️ BAJA PENDIENTE: ${ausencia.tipoAusencia.nombre} hasta ${fin.toLocaleDateString('es-ES')}`
                }
              });
            }

            // Agrupar por centro/cliente para respuesta
            const centrosAfectados = asignacionesAfectadas.reduce((acc, asig) => {
              const key = asig.centroId;
              if (!acc[key]) {
                acc[key] = {
                  centroId: asig.centroId,
                  centroNombre: asig.centro.nombre,
                  clienteNombre: asig.centro.cliente?.nombre || 'Sin cliente',
                  dias: []
                };
              }
              acc[key].dias.push(asig.fecha.toLocaleDateString('es-ES'));
              return acc;
            }, {});

            res.status(201).json({
              ausencia,
              centrosAfectados: Object.values(centrosAfectados),
              totalAsignacionesAfectadas: asignacionesAfectadas.length
            });

          } catch (error) {
            console.error('Error creando ausencia:', error);
            res.status(500).json({ error: 'Error creando ausencia' });
          }
        });

        // GET /api/ausencias/:id/calcular-importe - Calcula el importe de una ausencia
app.get('/api/ausencias/:id/calcular-importe', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { calcularImporteAusencia } = require('../utils/calcularImporteAusencia');

    // Obtener ausencia con relaciones
    const ausencia = await prisma.ausencia.findUnique({
      where: { id: parseInt(id) },
      include: {
        tipoAusencia: true,
        trabajador: {
          include: {
            categoria: true,
            acuerdosIndividuales: {
              where: { activo: true }
            }
          }
        }
      }
    });

    if (!ausencia) {
      return res.status(404).json({ error: 'Ausencia no encontrada' });
    }

    // Calcular importe
    const calculo = calcularImporteAusencia(ausencia.trabajador, ausencia);

    res.json({
      ausencia: {
        id: ausencia.id,
        trabajador: `${ausencia.trabajador.nombre} ${ausencia.trabajador.apellidos}`,
        tipoAusencia: ausencia.tipoAusencia.nombre,
        fechaInicio: ausencia.fechaInicio,
        fechaFin: ausencia.fechaFin,
        diasTotales: ausencia.diasTotales
      },
      calculo: calculo
    });

  } catch (error) {
    console.error('Error calculando importe ausencia:', error);
    res.status(500).json({ error: 'Error calculando importe de ausencia' });
  }
});

        app.put('/api/ausencias/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      trabajadorId,
      tipoAusenciaId,
      fechaInicio, 
      fechaFin, 
      motivo,
      observaciones,
      fechaAltaReal, // ✅ NUEVO
      numeroParte,
      contingencia,
      entidadEmisora
    } = req.body;

    // Calcular días totales
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

    const ausencia = await prisma.ausencia.update({
      where: { id },
      data: {
        trabajadorId,
        tipoAusenciaId,
        fechaInicio: inicio,
        fechaFin: fin,
        fechaAltaReal: fechaAltaReal ? new Date(fechaAltaReal) : null, // ✅ NUEVO
        diasTotales,
        motivo,
        observaciones,
        numeroParte,
        contingencia,
        entidadEmisora
      },
              include: {
                trabajador: { select: { id: true, nombre: true, apellidos: true } },
                tipoAusencia: true
              }
            });

            res.json(ausencia);
          } catch (error) {
            console.error('Error actualizando ausencia:', error);
            res.status(500).json({ error: 'Error actualizando ausencia' });
          }
        });
        app.put('/api/ausencias/:id/rechazar', authMiddleware, async (req, res) => {
          try {
            const ausencia = await prisma.ausencia.update({
              where: { id: parseInt(req.params.id) },
              data: {
                estado: 'RECHAZADA',
                aprobadoPorId: req.user.id,
                fechaAprobacion: new Date(),
                notas: req.body.motivo
              }
            });

            res.json(ausencia);
          } catch (error) {
            console.error('Error rechazando ausencia:', error);
            res.status(500).json({ error: 'Error rechazando ausencia' });
          }
        });
        app.put('/api/ausencias/:id/aprobar', authMiddleware, async (req, res) => {
          try {
            const id = parseInt(req.params.id);

            // Obtener la ausencia
            const ausenciaActual = await prisma.ausencia.findUnique({
              where: { id },
              include: { tipoAusencia: true }
            });

            if (!ausenciaActual) {
              return res.status(404).json({ error: 'Ausencia no encontrada' });
            }

            // Aprobar la ausencia
            const ausencia = await prisma.ausencia.update({
              where: { id },
              data: {
                estado: 'APROBADA',
                aprobadoPorId: req.user.id,
                fechaAprobacion: new Date()
              },
              include: {
                trabajador: { select: { id: true, nombre: true, apellidos: true } },
                tipoAusencia: true
              }
            });

            // 🔥 NUEVA FUNCIONALIDAD: Actualizar asignaciones a URGENTE
            const asignacionesAfectadas = await prisma.asignacion.findMany({
              where: {
                trabajadorId: ausencia.trabajadorId,
                fecha: {
                  gte: ausencia.fechaInicio,
                  lte: ausencia.fechaFin
                },
                estado: { notIn: ['CANCELADO', 'COMPLETADO'] }
              },
              include: {
                centro: {
                  include: {
                    cliente: true
                  }
                }
              }
            });

            // Marcar como URGENTE (aprobada)
            for (const asig of asignacionesAfectadas) {
              await prisma.asignacion.update({
                where: { id: asig.id },
                data: {
                  requiereAtencion: true,
                  motivoAtencion: `🔴 URGENTE - BAJA APROBADA: ${ausencia.tipoAusencia.nombre} - Requiere suplencia`
                }
              });
            }

            // Agrupar centros afectados
            const centrosAfectados = asignacionesAfectadas.reduce((acc, asig) => {
              const key = asig.centroId;
              if (!acc[key]) {
                acc[key] = {
                  centroId: asig.centroId,
                  centroNombre: asig.centro.nombre,
                  clienteNombre: asig.centro.cliente?.nombre || 'Sin cliente',
                  dias: []
                };
              }
              acc[key].dias.push(asig.fecha.toLocaleDateString('es-ES'));
              return acc;
            }, {});

            res.json({
              ausencia,
              centrosAfectados: Object.values(centrosAfectados),
              totalAsignacionesAfectadas: asignacionesAfectadas.length
            });

          } catch (error) {
            console.error('Error aprobando ausencia:', error);
            res.status(500).json({ error: 'Error aprobando ausencia' });
          }
        });
        // ============================================
// ARCHIVAR/DESARCHIVAR AUSENCIAS
// ============================================
app.put('/api/ausencias/:id/archivar', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { archivada } = req.body;

    const ausencia = await prisma.ausencia.update({
      where: { id: parseInt(id) },
      data: { archivada: archivada },
      include: {
        trabajador: { select: { id: true, nombre: true, apellidos: true } },
        tipoAusencia: true
      }
    });

    res.json(ausencia);
  } catch (error) {
    console.error('Error archivando ausencia:', error);
    res.status(500).json({ error: 'Error al archivar ausencia' });
  }
});
        // ============================================
        // RUTAS: REGISTRO DE HORAS
        // ============================================
        app.get('/api/registro-horas', authMiddleware, async (req, res) => {
          try {
            const { trabajadorId, fechaDesde, fechaHasta, validado } = req.query;

            const where = {};
            if (trabajadorId) where.trabajadorId = parseInt(trabajadorId);
            if (validado !== undefined) where.validado = validado === 'true';
            if (fechaDesde || fechaHasta) {
              where.fecha = {};
              if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
              if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
            }

            const registros = await prisma.registroHoras.findMany({
              where,
              include: {
                trabajador: { select: { id: true, nombre: true, apellidos: true } },
                asignacion: { include: { centro: true } }
              },
              orderBy: [{ fecha: 'desc' }, { horaEntradaReal: 'desc' }]
            });

            res.json(registros);
          } catch (error) {
            console.error('Error listando registros:', error);
            res.status(500).json({ error: 'Error listando registros de horas' });
          }
        });

        // ============================================
        // RUTAS: CATEGORÍAS
        // ============================================
        app.get('/api/categorias', authMiddleware, async (req, res) => {
          try {
            const categorias = await prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
            res.json(categorias);
          } catch (error) {
            console.error('Error listando categorías:', error);
            res.status(500).json({ error: 'Error listando categorías' });
          }
        });

        // ============================================
        // RUTAS: FESTIVOS
        // ============================================
        app.get('/api/festivos', authMiddleware, async (req, res) => {
          try {
            const { año } = req.query;
            const festivos = await prisma.festivo.findMany({
              where: año ? { año: parseInt(año) } : {},
              orderBy: { fecha: 'asc' }
            });
            res.json(festivos);
          } catch (error) {
            console.error('Error listando festivos:', error);
            res.status(500).json({ error: 'Error listando festivos' });
          }
        });

        // ============================================
        // HEALTH CHECK
        // ============================================
        app.get('/api/health', (req, res) => {
          res.json({ status: 'OK', timestamp: new Date().toISOString() });
        });
// ============================================
// RUTAS: INFORMES
// ============================================

/**
 * INFORME 1: Estado Diario de Trabajadores
 * GET /api/informes/estado-trabajadores?fecha=YYYY-MM-DD
 */
app.get('/api/informes/horas-trabajador', authMiddleware, async (req, res) => {
  try {
    const { trabajadorId, mes, año } = req.query;

    if (!trabajadorId || !mes || !año) {
      return res.status(400).json({ error: 'Faltan parámetros: trabajadorId, mes, año' });
    }

    // Obtener trabajador
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(trabajadorId) },
      include: { categoria: true }
    });

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    // Calcular rango de fechas del mes
    const inicioMes = new Date(parseInt(año), parseInt(mes) - 1, 1);
    const finMes = new Date(parseInt(año), parseInt(mes), 0, 23, 59, 59, 999);

    console.log(`📅 Consultando asignaciones de ${trabajador.nombre} del ${inicioMes.toLocaleDateString()} al ${finMes.toLocaleDateString()}`);

    // 🔥 CONSULTAR ASIGNACIONES DIRECTAMENTE (no registro_horas)
    const asignaciones = await prisma.asignacion.findMany({
      where: {
        trabajadorId: parseInt(trabajadorId),
        fecha: {
          gte: inicioMes,
          lte: finMes
        },
        estado: {
          notIn: ['CANCELADO']
        }
      },
      include: {
        centro: { 
          include: { cliente: true } 
        }
      },
      orderBy: [
        { fecha: 'asc' },
        { horaInicio: 'asc' }
      ]
    });

    console.log(`📊 Asignaciones encontradas: ${asignaciones.length}`);

    if (asignaciones.length === 0) {
      return res.json({
        trabajador: {
          id: trabajador.id,
          nombre: `${trabajador.nombre} ${trabajador.apellidos}`,
          categoria: trabajador.categoria.nombre,
          horasContrato: parseFloat(trabajador.horasContrato)
        },
        periodo: {
          mes: parseInt(mes),
          año: parseInt(año),
          mesNombre: new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'long' })
        },
        totales: {
          horasNormales: 0,
          horasExtras: 0,
          horasNocturnas: 0,
          horasFestivas: 0,
          totalHoras: 0
        },
        desgloseSemanal: {},
        detallesDias: []
      });
    }

    // Organizar por semana
    const asignacionesPorSemana = {};
    asignaciones.forEach(asig => {
      const semana = getWeekNumber(new Date(asig.fecha));
      if (!asignacionesPorSemana[semana]) {
        asignacionesPorSemana[semana] = [];
      }
      asignacionesPorSemana[semana].push(asig);
    });

    // 🔥 CALCULAR HORAS EN TIEMPO REAL
    let totalNormales = 0;
    let totalExtras = 0;
    let totalNocturnas = 0;
    let totalFestivas = 0;
    const detallesDias = [];
    const semanas = {};

    for (const [numSemana, asignacionesSemana] of Object.entries(asignacionesPorSemana)) {
      let horasAcumuladasSemana = 0;

      for (const asig of asignacionesSemana) {
        // Calcular horas totales
        const totalHoras = calcularTotalHoras(asig.horaInicio, asig.horaFin);
        const horasNocturnas = calcularHorasNocturnas(asig.horaInicio, asig.horaFin);
        const esFestivoODomingo = await esFestivo(asig.fecha) || esDomingo(asig.fecha);

        // Calcular si excede contrato
        const horasContrato = parseFloat(trabajador.horasContrato);
        const horasAcumuladas = horasAcumuladasSemana + totalHoras;

        let horasNormales = 0;
        let horasExtra = 0;

        if (horasAcumuladas <= horasContrato) {
          horasNormales = totalHoras;
          horasExtra = 0;
        } else if (horasAcumuladasSemana >= horasContrato) {
          horasNormales = 0;
          horasExtra = totalHoras;
        } else {
          horasNormales = horasContrato - horasAcumuladasSemana;
          horasExtra = totalHoras - horasNormales;
        }

        const horasFestivo = esFestivoODomingo ? totalHoras : 0;

        // Acumular totales
        totalNormales += horasNormales;
        totalExtras += horasExtra;
        totalNocturnas += horasNocturnas;
        totalFestivas += horasFestivo;

        // Agregar al detalle por día
        detallesDias.push({
          fecha: asig.fecha.toISOString().split('T')[0],
          centro: asig.centro?.nombre || 'Sin centro',
          cliente: asig.centro?.cliente?.nombre || 'Sin cliente',
          horasNormales: parseFloat(horasNormales.toFixed(2)),
          horasExtras: parseFloat(horasExtra.toFixed(2)),
          horasNocturnas: parseFloat(horasNocturnas.toFixed(2)),
          horasFestivas: parseFloat(horasFestivo.toFixed(2))
        });

        // Acumular por semana
        const key = `Semana ${numSemana}`;
        if (!semanas[key]) {
          semanas[key] = {
            normales: 0,
            extras: 0,
            nocturnas: 0,
            festivas: 0,
            total: 0
          };
        }

        semanas[key].normales += horasNormales;
        semanas[key].extras += horasExtra;
        semanas[key].nocturnas += horasNocturnas;
        semanas[key].festivas += horasFestivo;
        semanas[key].total += horasNormales + horasExtra;

        // Actualizar acumuladas para siguiente asignación
        horasAcumuladasSemana = horasAcumuladas;
      }
    }

    console.log(`✅ Totales calculados - Normales: ${totalNormales.toFixed(2)}h, Extras: ${totalExtras.toFixed(2)}h, Total: ${(totalNormales + totalExtras).toFixed(2)}h`);

    res.json({
      trabajador: {
        id: trabajador.id,
        nombre: `${trabajador.nombre} ${trabajador.apellidos}`,
        categoria: trabajador.categoria.nombre,
        horasContrato: parseFloat(trabajador.horasContrato)
      },
      periodo: {
        mes: parseInt(mes),
        año: parseInt(año),
        mesNombre: new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'long' })
      },
      totales: {
        horasNormales: parseFloat(totalNormales.toFixed(2)),
        horasExtras: parseFloat(totalExtras.toFixed(2)),
        horasNocturnas: parseFloat(totalNocturnas.toFixed(2)),
        horasFestivas: parseFloat(totalFestivas.toFixed(2)),
        totalHoras: parseFloat((totalNormales + totalExtras).toFixed(2))
      },
      desgloseSemanal: semanas,
      detallesDias: detallesDias
    });

  } catch (error) {
    console.error('❌ Error en informe horas trabajador:', error);
    res.status(500).json({ error: 'Error generando informe' });
  }
});
/**
 * INFORME: Estado Diario de Trabajadores
 * GET /api/informes/estado-trabajadores?fecha=YYYY-MM-DD
 */
app.get('/api/informes/estado-trabajadores', authMiddleware, async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'Falta parámetro: fecha' });
    }

    // Parsear la fecha correctamente sin problemas de zona horaria
const [año, mes, dia] = fecha.split('-').map(Number);
const fechaObj = new Date(año, mes - 1, dia, 12, 0, 0, 0); // Usar mediodía para evitar problemas de zona horaria

console.log(`📅 Generando estado diario para ${fechaObj.toLocaleDateString()}`);
console.log(`📅 Fecha exacta en BD: ${fechaObj.toISOString()}`);

    const trabajadoresActivos = await prisma.trabajador.findMany({
      where: { activo: true },
      include: { categoria: true }
    });

    const ausencias = await prisma.ausencia.findMany({
      where: {
        fechaInicio: { lte: fechaObj },
        fechaFin: { gte: fechaObj }
      },
      include: {
  trabajador: true,
  tipoAusencia: true
}
    });

    const ausenciasPorEstado = {
      APROBADA: ausencias.filter(a => a.estado === 'APROBADA'),
      PENDIENTE: ausencias.filter(a => a.estado === 'PENDIENTE')
    };
    

    // Clasificar por tipo de ausencia
const tiposBajaMedica = [
  'baja médica',
  'accidente laboral', 
  'hospitalización familiar',
  'acompañamiento oncológico'
];

const bajasMedicas = ausenciasPorEstado.APROBADA.filter(a => {
  const nombreTipo = a.tipoAusencia.nombre.toLowerCase();
  return tiposBajaMedica.some(tipo => nombreTipo.includes(tipo));
});

const vacaciones = ausenciasPorEstado.APROBADA.filter(a => 
  a.tipoAusencia.nombre.toLowerCase().includes('vacacion')
);

const otrosPermisos = ausenciasPorEstado.APROBADA.filter(a => {
  const nombreTipo = a.tipoAusencia.nombre.toLowerCase();
  const esBajaMedica = tiposBajaMedica.some(tipo => nombreTipo.includes(tipo));
  const esVacaciones = nombreTipo.includes('vacacion');
  return !esBajaMedica && !esVacaciones;
});

    const trabajadoresConAusencia = new Set(ausenciasPorEstado.APROBADA.map(a => a.trabajadorId));
    const disponibles = trabajadoresActivos.length - trabajadoresConAusencia.size;

    const calcularDiasTotales = (fechaInicio, fechaFin) => {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const diferencia = fin.getTime() - inicio.getTime();
      return Math.ceil(diferencia / (1000 * 60 * 60 * 24)) + 1;
    };

    const respuesta = {
      fecha: fechaObj.toISOString().split('T')[0],
      resumen: {
        totalActivos: trabajadoresActivos.length,
        disponibles: disponibles,
        enBajaMedica: bajasMedicas.length,
        enVacaciones: vacaciones.length,
        conPermisos: otrosPermisos.length,
        pendientesAprobacion: ausenciasPorEstado.PENDIENTE.length
      },
      detalles: {
        bajasMedicas: bajasMedicas.map(baja => ({
          trabajador: {
            id: baja.trabajador.id,
            nombre: baja.trabajador.nombre,
            apellidos: baja.trabajador.apellidos
          },
          tipoAusencia: {
            nombre: baja.tipoAusencia.nombre
          },
          fechaInicio: baja.fechaInicio.toISOString().split('T')[0],
          fechaFin: baja.fechaFin.toISOString().split('T')[0],
          diasTotales: calcularDiasTotales(baja.fechaInicio, baja.fechaFin),
          motivo: baja.motivo
        })),
        vacaciones: vacaciones.map(vac => ({
          trabajador: {
            id: vac.trabajador.id,
            nombre: vac.trabajador.nombre,
            apellidos: vac.trabajador.apellidos
          },
          fechaInicio: vac.fechaInicio.toISOString().split('T')[0],
          fechaFin: vac.fechaFin.toISOString().split('T')[0],
          diasTotales: calcularDiasTotales(vac.fechaInicio, vac.fechaFin)
        })),
        otrosPermisos: otrosPermisos.map(permiso => ({
          trabajador: {
            id: permiso.trabajador.id,
            nombre: permiso.trabajador.nombre,
            apellidos: permiso.trabajador.apellidos
          },
          tipoAusencia: {
            nombre: permiso.tipoAusencia.nombre
          },
          fechaInicio: permiso.fechaInicio.toISOString().split('T')[0],
          fechaFin: permiso.fechaFin.toISOString().split('T')[0],
          diasTotales: calcularDiasTotales(permiso.fechaInicio, permiso.fechaFin)
        })),
        pendientesAprobacion: ausenciasPorEstado.PENDIENTE.map(pend => ({
          trabajador: {
            id: pend.trabajador.id,
            nombre: pend.trabajador.nombre,
            apellidos: pend.trabajador.apellidos
          },
          tipoAusencia: {
            nombre: pend.tipoAusencia.nombre
          },
          fechaInicio: pend.fechaInicio.toISOString().split('T')[0],
          fechaFin: pend.fechaFin.toISOString().split('T')[0],
          diasTotales: calcularDiasTotales(pend.fechaInicio, pend.fechaFin)
        }))
      }
    };


    console.log(`📊 Trabajadores: ${trabajadoresActivos.length}, Ausencias encontradas: ${ausencias.length}`);
console.log(`📊 Ausencias APROBADAS: ${ausenciasPorEstado.APROBADA.length}`);
console.log(`📊 Bajas médicas: ${bajasMedicas.length}, Vacaciones: ${vacaciones.length}, Otros: ${otrosPermisos.length}`);
console.log(`✅ Resumen: ${respuesta.resumen.disponibles} disponibles`);


    res.json(respuesta);

  } catch (error) {
    console.error('❌ Error en informe estado trabajadores:', error);
    res.status(500).json({ error: 'Error generando informe' });
  }
});
/**
 * INFORME 2: Horas por Trabajador
 * GET /api/informes/horas-trabajador?trabajadorId=X&mes=MM&año=YYYY
 * ✅ ACTUALIZADO: Calcula importes con precios reales y acuerdos
 */
app.get('/api/informes/horas-trabajador', authMiddleware, async (req, res) => {
  try {
    const { trabajadorId, mes, año } = req.query;

    if (!trabajadorId || !mes || !año) {
      return res.status(400).json({ error: 'Faltan parámetros: trabajadorId, mes, año' });
    }

    const { calcularPrecioHora } = require('../utils/calcularPrecioHora');

    // Obtener trabajador completo con categoría y acuerdos
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(trabajadorId) },
      include: { 
        categoria: true,
        acuerdosIndividuales: {
          where: { activo: true },
          include: { centro: true }
        }
      }
    });

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    // Calcular rango de fechas del mes
    const inicioMes = new Date(parseInt(año), parseInt(mes) - 1, 1);
    const finMes = new Date(parseInt(año), parseInt(mes), 0, 23, 59, 59, 999);

    // Obtener festivos del mes
    const festivos = await prisma.festivo.findMany({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes
        }
      }
    });
    const fechasFestivas = new Set(festivos.map(f => f.fecha.toISOString().split('T')[0]));

    // Obtener asignaciones
    const asignaciones = await prisma.asignacion.findMany({
      where: {
        trabajadorId: parseInt(trabajadorId),
        fecha: {
          gte: inicioMes,
          lte: finMes
        },
        estado: {
          notIn: ['CANCELADO']
        }
      },
      include: {
        centro: { 
          include: { cliente: true } 
        }
      },
      orderBy: [
        { fecha: 'asc' },
        { horaInicio: 'asc' }
      ]
    });

    if (asignaciones.length === 0) {
      return res.json({
        trabajador: {
          id: trabajador.id,
          nombre: `${trabajador.nombre} ${trabajador.apellidos}`,
          categoria: trabajador.categoria.nombre,
          horasContrato: parseFloat(trabajador.horasContrato)
        },
        periodo: {
          mes: parseInt(mes),
          año: parseInt(año),
          mesNombre: new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'long' })
        },
        totales: {
          horasNormales: 0,
          horasExtras: 0,
          horasNocturnas: 0,
          horasFestivas: 0,
          totalHoras: 0,
          importeTotal: 0
        },
        desgloseSemanal: {},
        detallesDias: []
      });
    }

    // Organizar por semana
    const asignacionesPorSemana = {};
    asignaciones.forEach(asig => {
      const semana = getWeekNumber(new Date(asig.fecha));
      if (!asignacionesPorSemana[semana]) {
        asignacionesPorSemana[semana] = [];
      }
      asignacionesPorSemana[semana].push(asig);
    });

    // Calcular horas e importes
    let totalNormales = 0;
    let totalExtras = 0;
    let totalNocturnas = 0;
    let totalFestivas = 0;
    let importeTotal = 0;
    const detallesDias = [];
    const semanas = {};

    for (const [numSemana, asignacionesSemana] of Object.entries(asignacionesPorSemana)) {
      let horasAcumuladasSemana = 0;

      for (const asig of asignacionesSemana) {
        const fechaAsig = asig.fecha.toISOString().split('T')[0];
        const esFestivoODomingo = fechasFestivas.has(fechaAsig) || new Date(asig.fecha).getDay() === 0;

        // Calcular horas
        const totalHoras = calcularTotalHoras(asig.horaInicio, asig.horaFin);
        const horasNocturnas = calcularHorasNocturnas(asig.horaInicio, asig.horaFin);

        // Determinar tipo de horas
        const horasContrato = parseFloat(trabajador.horasContrato);
        const horasAcumuladas = horasAcumuladasSemana + totalHoras;

        let horasNormales = 0;
        let horasExtra = 0;

        if (horasAcumuladas <= horasContrato) {
          horasNormales = totalHoras;
        } else if (horasAcumuladasSemana >= horasContrato) {
          horasExtra = totalHoras;
        } else {
          horasNormales = horasContrato - horasAcumuladasSemana;
          horasExtra = totalHoras - horasNormales;
        }

        const horasFestivo = esFestivoODomingo ? totalHoras : 0;

        // Calcular importes con precios reales
        const tipo = esFestivoODomingo ? 'FESTIVA' : (horasNocturnas > 0 ? 'NOCTURNA' : 'NORMAL');
        const precioNormal = calcularPrecioHora(trabajador, asig.centroId, tipo);
        const precioExtra = calcularPrecioHora(trabajador, asig.centroId, 'EXTRA');

        const importeNormales = horasNormales * precioNormal;
        const importeExtras = horasExtra * precioExtra;
        const importeDia = importeNormales + importeExtras;

        // Acumular
        totalNormales += horasNormales;
        totalExtras += horasExtra;
        totalNocturnas += horasNocturnas;
        totalFestivas += horasFestivo;
        importeTotal += importeDia;

        // Detalle por día
        detallesDias.push({
          fecha: fechaAsig,
          centro: asig.centro?.nombre || 'Sin centro',
          cliente: asig.centro?.cliente?.nombre || 'Sin cliente',
          horasNormales: parseFloat(horasNormales.toFixed(2)),
          horasExtras: parseFloat(horasExtra.toFixed(2)),
          horasNocturnas: parseFloat(horasNocturnas.toFixed(2)),
          horasFestivas: parseFloat(horasFestivo.toFixed(2)),
          importe: parseFloat(importeDia.toFixed(2))
        });

        // Acumular por semana
        const key = `Semana ${numSemana}`;
        if (!semanas[key]) {
          semanas[key] = {
            normales: 0,
            extras: 0,
            nocturnas: 0,
            festivas: 0,
            total: 0,
            importe: 0
          };
        }

        semanas[key].normales += horasNormales;
        semanas[key].extras += horasExtra;
        semanas[key].nocturnas += horasNocturnas;
        semanas[key].festivas += horasFestivo;
        semanas[key].total += totalHoras;
        semanas[key].importe += importeDia;

        horasAcumuladasSemana = horasAcumuladas;
      }
    }

    res.json({
      trabajador: {
        id: trabajador.id,
        nombre: `${trabajador.nombre} ${trabajador.apellidos}`,
        categoria: trabajador.categoria.nombre,
        horasContrato: parseFloat(trabajador.horasContrato)
      },
      periodo: {
        mes: parseInt(mes),
        año: parseInt(año),
        mesNombre: new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'long' })
      },
      totales: {
        horasNormales: parseFloat(totalNormales.toFixed(2)),
        horasExtras: parseFloat(totalExtras.toFixed(2)),
        horasNocturnas: parseFloat(totalNocturnas.toFixed(2)),
        horasFestivas: parseFloat(totalFestivas.toFixed(2)),
        totalHoras: parseFloat((totalNormales + totalExtras).toFixed(2)),
        importeTotal: parseFloat(importeTotal.toFixed(2))
      },
      desgloseSemanal: Object.keys(semanas).map(key => ({
        semana: key,
        ...semanas[key],
        importe: parseFloat(semanas[key].importe.toFixed(2))
      })),
      detallesDias: detallesDias
    });

  } catch (error) {
    console.error('Error en informe horas trabajador:', error);
    res.status(500).json({ error: 'Error generando informe' });
  }
});
/**
 * INFORME 3: Horas por Cliente (para facturación)
 * GET /api/informes/horas-cliente?clienteId=X&mes=MM&año=YYYY
 * ✅ ACTUALIZADO: Usa precios reales con acuerdos individuales y recargos
 */
app.get('/api/informes/horas-cliente', authMiddleware, async (req, res) => {
  try {
    const { clienteId, mes, año } = req.query;

    if (!clienteId || !mes || !año) {
      return res.status(400).json({ error: 'Faltan parámetros: clienteId, mes, año' });
    }

    const { calcularPrecioHora } = require('../utils/calcularPrecioHora');

    // Obtener cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) },
      include: { centrosTrabajo: true }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Calcular rango de fechas del mes
    const inicioMes = new Date(parseInt(año), parseInt(mes) - 1, 1);
    const finMes = new Date(parseInt(año), parseInt(mes), 0);

    // Obtener IDs de centros del cliente
    const centrosIds = cliente.centrosTrabajo.map(c => c.id);

    // Obtener festivos del mes para detectar días festivos
    const festivos = await prisma.festivo.findMany({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes
        }
      }
    });
    const fechasFestivas = new Set(festivos.map(f => f.fecha.toISOString().split('T')[0]));

    // Obtener asignaciones del mes
    const asignaciones = await prisma.asignacion.findMany({
      where: {
        centroId: { in: centrosIds },
        fecha: {
          gte: inicioMes,
          lte: finMes
        },
        estado: { notIn: ['CANCELADO'] }
      },
      include: {
        centro: true,
        trabajador: { 
          include: { 
            categoria: true,
            acuerdosIndividuales: {
              where: { activo: true },
              include: { centro: true }
            }
          } 
        },
        registroHoras: true
      }
    });

    // Agrupar por centro
    const porCentro = {};
    let totalHorasCliente = 0;
    let totalCoste = 0;

    asignaciones.forEach(asig => {
      const centroNombre = asig.centro.nombre;
      const fechaAsig = asig.fecha.toISOString().split('T')[0];
      const esFestivo = fechasFestivas.has(fechaAsig);
      
      if (!porCentro[centroNombre]) {
        porCentro[centroNombre] = {
          centroId: asig.centro.id,
          totalHoras: 0,
          horasNormales: 0,
          horasExtras: 0,
          horasNocturnas: 0,
          horasFestivas: 0,
          costeTotal: 0
        };
      }

      const registro = asig.registroHoras;
      if (registro) {
        const horasNormalesReg = parseFloat(registro.horasNormales);
        const horasExtraReg = parseFloat(registro.horasExtra);
        const horasNocturnasReg = parseFloat(registro.horasNocturnas);
        const horasFestivasReg = parseFloat(registro.horasFestivo);

        // Calcular coste usando precios reales
        const precioNormal = calcularPrecioHora(asig.trabajador, asig.centroId, esFestivo ? 'FESTIVA' : 'NORMAL');
        const precioNocturna = calcularPrecioHora(asig.trabajador, asig.centroId, 'NOCTURNA');
        const precioExtra = calcularPrecioHora(asig.trabajador, asig.centroId, 'EXTRA');

        const costeNormales = horasNormalesReg * precioNormal;
        const costeNocturnas = horasNocturnasReg * precioNocturna;
        const costeExtras = horasExtraReg * precioExtra;
        const coste = costeNormales + costeNocturnas + costeExtras;

        porCentro[centroNombre].totalHoras += (horasNormalesReg + horasExtraReg);
        porCentro[centroNombre].horasNormales += horasNormalesReg;
        porCentro[centroNombre].horasExtras += horasExtraReg;
        porCentro[centroNombre].horasNocturnas += horasNocturnasReg;
        porCentro[centroNombre].horasFestivas += horasFestivasReg;
        porCentro[centroNombre].costeTotal += coste;

        totalHorasCliente += (horasNormalesReg + horasExtraReg);
        totalCoste += coste;
      } else {
        // Si no hay registro, usar horas planificadas con precio base
        const [horaInicioH, horaInicioM] = asig.horaInicio.split(':').map(Number);
        const [horaFinH, horaFinM] = asig.horaFin.split(':').map(Number);
        
        let horas = (horaFinH + horaFinM / 60) - (horaInicioH + horaInicioM / 60);
        if (horas < 0) horas += 24;

        const esNocturna = horaInicioH >= 23 || horaFinH <= 6;
        const tipo = esFestivo ? 'FESTIVA' : (esNocturna ? 'NOCTURNA' : 'NORMAL');
        const precio = calcularPrecioHora(asig.trabajador, asig.centroId, tipo);
        const coste = horas * precio;

        porCentro[centroNombre].totalHoras += horas;
        if (esFestivo) {
          porCentro[centroNombre].horasFestivas += horas;
        } else if (esNocturna) {
          porCentro[centroNombre].horasNocturnas += horas;
        } else {
          porCentro[centroNombre].horasNormales += horas;
        }
        porCentro[centroNombre].costeTotal += coste;

        totalHorasCliente += horas;
        totalCoste += coste;
      }
    });

    res.json({
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        cif: cliente.cif
      },
      periodo: {
        mes: parseInt(mes),
        año: parseInt(año),
        mesNombre: new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'long' })
      },
      totales: {
        totalHoras: parseFloat(totalHorasCliente.toFixed(2)),
        costeTotal: parseFloat(totalCoste.toFixed(2))
      },
      desglosePorCentro: Object.keys(porCentro).map(nombre => ({
        centro: nombre,
        ...porCentro[nombre],
        totalHoras: parseFloat(porCentro[nombre].totalHoras.toFixed(2)),
        horasNormales: parseFloat(porCentro[nombre].horasNormales.toFixed(2)),
        horasExtras: parseFloat(porCentro[nombre].horasExtras.toFixed(2)),
        horasNocturnas: parseFloat(porCentro[nombre].horasNocturnas.toFixed(2)),
        horasFestivas: parseFloat(porCentro[nombre].horasFestivas.toFixed(2)),
        costeTotal: parseFloat(porCentro[nombre].costeTotal.toFixed(2))
      }))
    });

  } catch (error) {
    console.error('Error en informe horas cliente:', error);
    res.status(500).json({ error: 'Error generando informe' });
  }
});



/**
 * Utilidad: Obtener número de semana del año
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}
// ============================================
// SISTEMA DE BAJA LÓGICA (SOFT DELETE)
// Reemplaza los endpoints DELETE existentes
// ============================================

// ============================================
// TRABAJADORES - Baja Lógica
// ============================================

// Dar de baja a un trabajador (en vez de DELETE)
app.put('/api/trabajadores/:id/dar-baja', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;

    const anterior = await prisma.trabajador.findUnique({ where: { id } });
    
    if (!anterior) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    const trabajador = await prisma.trabajador.update({
      where: { id },
      data: {
        activo: false,
        fechaBaja: new Date(),
        notas: anterior.notas 
          ? `${anterior.notas}\n\n[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
          : `[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
      },
      include: { categoria: true }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        tablaAfectada: 'trabajadores',
        registroId: id,
        accion: 'BAJA',
        datosAnteriores: anterior,
        datosNuevos: trabajador,
        motivoCambio: motivo || 'Baja de trabajador',
        usuarioId: req.user.id
      }
    });

    // ✅ CANCELAR/MARCAR TURNOS FUTUROS
    const hoy = new Date();
    const turnosFuturos = await prisma.asignacion.updateMany({
      where: {
        trabajadorId: id,
        fecha: { gte: hoy },
        estado: { not: 'CANCELADO' }
      },
      data: {
        requiereAtencion: true,
        estado: 'CANCELADO'
      }
    });

    res.json({ 
      message: `Trabajador dado de baja correctamente. ${turnosFuturos.count} turnos futuros cancelados.`,
      trabajador,
      turnosCancelados: turnosFuturos.count
    });

  } catch (error) {
    console.error('Error dando de baja trabajador:', error);
    res.status(500).json({ error: 'Error al dar de baja trabajador' });
  }
});

// Reactivar un trabajador
app.put('/api/trabajadores/:id/reactivar', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const trabajador = await prisma.trabajador.update({
      where: { id },
      data: {
        activo: true,
        fechaBaja: null
      },
      include: { categoria: true }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        tablaAfectada: 'trabajadores',
        registroId: id,
        accion: 'REACTIVACION',
        datosNuevos: trabajador,
        motivoCambio: 'Reactivación de trabajador',
        usuarioId: req.user.id
      }
    });

    res.json({ 
      message: 'Trabajador reactivado correctamente',
      trabajador 
    });

  } catch (error) {
    console.error('Error reactivando trabajador:', error);
    res.status(500).json({ error: 'Error al reactivar trabajador' });
  }
});

// ============================================
// CLIENTES - Baja Lógica
// ============================================

app.put('/api/clientes/:id/dar-baja', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;

    const anterior = await prisma.cliente.findUnique({ where: { id } });
    
    if (!anterior) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        activo: false,
        notas: anterior.notas 
          ? `${anterior.notas}\n\n[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
          : `[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
      }
    });

    // Dar de baja también todos sus centros
    await prisma.centroTrabajo.updateMany({
      where: { clienteId: id },
      data: { activo: false }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        tablaAfectada: 'clientes',
        registroId: id,
        accion: 'BAJA',
        datosAnteriores: anterior,
        datosNuevos: cliente,
        motivoCambio: motivo || 'Baja de cliente',
        usuarioId: req.user.id
      }
    });

    res.json({ 
      message: 'Cliente y sus centros dados de baja correctamente',
      cliente 
    });

  } catch (error) {
    console.error('Error dando de baja cliente:', error);
    res.status(500).json({ error: 'Error al dar de baja cliente' });
  }
});

app.put('/api/clientes/:id/reactivar', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const cliente = await prisma.cliente.update({
      where: { id },
      data: { activo: true }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        tablaAfectada: 'clientes',
        registroId: id,
        accion: 'REACTIVACION',
        datosNuevos: cliente,
        motivoCambio: 'Reactivación de cliente',
        usuarioId: req.user.id
      }
    });

    res.json({ 
      message: 'Cliente reactivado correctamente. Revisa sus centros manualmente.',
      cliente 
    });

  } catch (error) {
    console.error('Error reactivando cliente:', error);
    res.status(500).json({ error: 'Error al reactivar cliente' });
  }
});

// ============================================
// CENTROS - Baja Lógica
// ============================================

app.put('/api/centros/:id/dar-baja', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;

    const anterior = await prisma.centroTrabajo.findUnique({ 
      where: { id },
      include: { cliente: true }
    });
    
    if (!anterior) {
      return res.status(404).json({ error: 'Centro no encontrado' });
    }

    const centro = await prisma.centroTrabajo.update({
      where: { id },
      data: {
        activo: false,
        notas: anterior.notas 
          ? `${anterior.notas}\n\n[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
          : `[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
      },
      include: { cliente: true }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        tablaAfectada: 'centros_trabajo',
        registroId: id,
        accion: 'BAJA',
        datosAnteriores: anterior,
        datosNuevos: centro,
        motivoCambio: motivo || 'Baja de centro',
        usuarioId: req.user.id
      }
    });

    res.json({ 
      message: 'Centro dado de baja correctamente',
      centro 
    });

  } catch (error) {
    console.error('Error dando de baja centro:', error);
    res.status(500).json({ error: 'Error al dar de baja centro' });
  }
});

app.put('/api/centros/:id/reactivar', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const centro = await prisma.centroTrabajo.update({
      where: { id },
      data: { activo: true },
      include: { cliente: true }
    });

    // Registrar en historial
    await prisma.historialCambios.create({
      data: {
        tablaAfectada: 'centros_trabajo',
        registroId: id,
        accion: 'REACTIVACION',
        datosNuevos: centro,
        motivoCambio: 'Reactivación de centro',
        usuarioId: req.user.id
      }
    });

    res.json({ 
      message: 'Centro reactivado correctamente',
      centro 
    });

  } catch (error) {
    console.error('Error reactivando centro:', error);
    res.status(500).json({ error: 'Error al reactivar centro' });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
          console.log(`🚀 API Grupo Rubio corriendo en http://localhost:${PORT}`);
          console.log(`📚 Documentación: http://localhost:${PORT}/api/health`);
        });

        module.exports = app;

// ============================================
// RUTA: CALCULAR NÓMINA DE TRABAJADOR
// ============================================
app.get('/api/nominas/calcular/:trabajadorId', authMiddleware, async (req, res) => {
  try {
    const { trabajadorId } = req.params;
    const { mes, año, centroId } = req.query;

    if (!mes || !año) {
      return res.status(400).json({ error: 'Faltan parámetros mes y año' });
    }

    const { calcularPrecioHora, calcularPlusesMensuales } = require('../utils/calcularPrecioHora');

    // Obtener trabajador completo
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(trabajadorId) },
      include: {
        categoria: true,
        acuerdosIndividuales: {
          where: { activo: true },
          include: { centro: true }
        }
      }
    });

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    // Calcular fechas del mes
    const fechaInicio = new Date(parseInt(año), parseInt(mes) - 1, 1);
    const fechaFin = new Date(parseInt(año), parseInt(mes), 0);

    // Obtener asignaciones del mes
    const asignaciones = await prisma.asignacion.findMany({
      where: {
        trabajadorId: parseInt(trabajadorId),
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        ...(centroId && { centroId: parseInt(centroId) })
      },
      include: {
        centro: true
      }
    });

    // Obtener ausencias del mes
    const ausencias = await prisma.ausencia.findMany({
      where: {
        trabajadorId: parseInt(trabajadorId),
        estado: 'APROBADA',
        fechaInicio: { lte: fechaFin },
        fechaFin: { gte: fechaInicio }
      },
      include: {
        tipoAusencia: true
      }
    });

    // Calcular horas por tipo
    let horasNormales = 0;
    let horasNocturnas = 0;
    let horasFestivas = 0;
    let horasExtra = 0;

    for (const asig of asignaciones) {
      const [horaInicioH, horaInicioM] = asig.horaInicio.split(':').map(Number);
      const [horaFinH, horaFinM] = asig.horaFin.split(':').map(Number);
      
      let horas = (horaFinH + horaFinM / 60) - (horaInicioH + horaInicioM / 60);
      if (horas < 0) horas += 24;

      // Determinar si es nocturna (22:00 - 06:00)
      const esNocturna = horaInicioH >= 23 || horaFinH <= 6;
      
      // TODO: Determinar si es festiva (requiere tabla de festivos)
      
      if (esNocturna) {
        horasNocturnas += horas;
      } else {
        horasNormales += horas;
      }
    }

    // Calcular importes
    const precioHoraNormal = calcularPrecioHora(trabajador, centroId ? parseInt(centroId) : null, 'NORMAL');
    const precioHoraNocturna = calcularPrecioHora(trabajador, centroId ? parseInt(centroId) : null, 'NOCTURNA');
    const precioHoraFestiva = calcularPrecioHora(trabajador, centroId ? parseInt(centroId) : null, 'FESTIVA');
    const precioHoraExtra = calcularPrecioHora(trabajador, centroId ? parseInt(centroId) : null, 'EXTRA');

    const importeNormal = horasNormales * precioHoraNormal;
    const importeNocturno = horasNocturnas * precioHoraNocturna;
    const importeFestivo = horasFestivas * precioHoraFestiva;
    const importeExtra = horasExtra * precioHoraExtra;

    // Calcular días de ausencia y su coste
    let diasAusencia = 0;
    let importeAusencias = 0;

    for (const ausencia of ausencias) {
      const inicio = new Date(ausencia.fechaInicio) > fechaInicio ? new Date(ausencia.fechaInicio) : fechaInicio;
      const fin = new Date(ausencia.fechaFin) < fechaFin ? new Date(ausencia.fechaFin) : fechaFin;
      
      const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
      diasAusencia += dias;

      // Calcular coste de ausencia según porcentaje
      const porcentajeCobro = parseFloat(ausencia.tipoAusencia.porcentajeCobro);
      const salarioDiario = parseFloat(trabajador.categoria.salarioBase) / 30;
      importeAusencias += (salarioDiario * dias * porcentajeCobro / 100);
    }

    // Pluses mensuales
    const plusesMensuales = calcularPlusesMensuales(trabajador, centroId ? parseInt(centroId) : null);

    // Total
    const totalBruto = importeNormal + importeNocturno + importeFestivo + importeExtra + importeAusencias + plusesMensuales;

    res.json({
      trabajador: {
        id: trabajador.id,
        nombre: trabajador.nombre,
        apellidos: trabajador.apellidos,
        categoria: trabajador.categoria.nombre
      },
      periodo: { mes: parseInt(mes), año: parseInt(año) },
      horas: {
        normales: horasNormales.toFixed(2),
        nocturnas: horasNocturnas.toFixed(2),
        festivas: horasFestivas.toFixed(2),
        extra: horasExtra.toFixed(2)
      },
      precios: {
        normal: precioHoraNormal.toFixed(2),
        nocturna: precioHoraNocturna.toFixed(2),
        festiva: precioHoraFestiva.toFixed(2),
        extra: precioHoraExtra.toFixed(2)
      },
      importes: {
        normal: importeNormal.toFixed(2),
        nocturno: importeNocturno.toFixed(2),
        festivo: importeFestivo.toFixed(2),
        extra: importeExtra.toFixed(2),
        ausencias: importeAusencias.toFixed(2),
        pluses: plusesMensuales.toFixed(2)
      },
      ausencias: {
        dias: diasAusencia,
        detalle: ausencias.map(a => ({
          tipo: a.tipoAusencia.nombre,
          fechaInicio: a.fechaInicio,
          fechaFin: a.fechaFin,
          porcentajeCobro: a.tipoAusencia.porcentajeCobro
        }))
      },
      totalBruto: totalBruto.toFixed(2)
    });

  } catch (error) {
    console.error('Error calculando nómina:', error);
    res.status(500).json({ error: 'Error al calcular nómina' });
  }
});
// ============================================
// DASHBOARD CEO - KPIs EJECUTIVOS
// ============================================

/**
 * Dashboard Ejecutivo - Vista completa para CEO/Gerencia
 * GET /api/dashboard/ejecutivo?mes=MM&año=YYYY
 */
app.get('/api/dashboard/ejecutivo', authMiddleware, async (req, res) => {
  try {
    const { mes, año } = req.query;
    const mesActual = mes ? parseInt(mes) : new Date().getMonth() + 1;
    const añoActual = año ? parseInt(año) : new Date().getFullYear();

    // Calcular rangos de fechas
    const inicioMes = new Date(añoActual, mesActual - 1, 1);
    const finMes = new Date(añoActual, mesActual, 0);
    
    // Mes anterior para comparativas
    const inicioMesAnterior = new Date(añoActual, mesActual - 2, 1);
    const finMesAnterior = new Date(añoActual, mesActual - 1, 0);

    // ========================================
    // 1. INGRESOS Y FACTURACIÓN
    // ========================================
    const registrosMes = await prisma.registroHoras.findMany({
      where: {
        fecha: { gte: inicioMes, lte: finMes },
        validado: true
      },
      include: {
        trabajador: { include: { categoria: true } },
        asignacion: { include: { centro: { include: { cliente: true } } } }
      }
    });

    const registrosMesAnterior = await prisma.registroHoras.findMany({
      where: {
        fecha: { gte: inicioMesAnterior, lte: finMesAnterior },
        validado: true
      },
      include: {
        trabajador: { include: { categoria: true } }
      }
    });

    let ingresosTotales = 0;
    let costeTotalTrabajadores = 0;
    let horasTotales = 0;

    registrosMes.forEach(reg => {
      const horas = parseFloat(reg.horasNormales) + parseFloat(reg.horasExtra);
      const precioHora = parseFloat(reg.trabajador.categoria.precioHora) || 0;
      const costeHora = parseFloat(reg.trabajador.categoria.salarioBase) / 160 || 0; // Aprox 160h/mes
      
      ingresosTotales += horas * precioHora;
      costeTotalTrabajadores += horas * costeHora;
      horasTotales += horas;
    });

    let ingresosMesAnterior = 0;
    registrosMesAnterior.forEach(reg => {
      const horas = parseFloat(reg.horasNormales) + parseFloat(reg.horasExtra);
      const precioHora = parseFloat(reg.trabajador.categoria.precioHora) || 0;
      ingresosMesAnterior += horas * precioHora;
    });

    const margenBruto = ingresosTotales - costeTotalTrabajadores;
    const porcentajeMargen = ingresosTotales > 0 ? (margenBruto / ingresosTotales) * 100 : 0;
    const variacionIngresos = ingresosMesAnterior > 0 
      ? ((ingresosTotales - ingresosMesAnterior) / ingresosMesAnterior) * 100 
      : 0;

    // ========================================
    // 2. UTILIZACIÓN DE TRABAJADORES
    // ========================================
    const trabajadoresActivos = await prisma.trabajador.count({ where: { activo: true } });
    const horasContratoTotales = await prisma.trabajador.aggregate({
      where: { activo: true },
      _sum: { horasContrato: true }
    });

    const horasDisponiblesEsteMes = (parseFloat(horasContratoTotales._sum.horasContrato) || 0) * 4.33; // ~4.33 semanas/mes
    const utilizacion = horasDisponiblesEsteMes > 0 ? (horasTotales / horasDisponiblesEsteMes) * 100 : 0;

    // ========================================
    // 3. TOP 5 CLIENTES POR FACTURACIÓN
    // ========================================
    const clientesMap = {};
    registrosMes.forEach(reg => {
      if (reg.asignacion?.centro?.cliente) {
        const clienteId = reg.asignacion.centro.cliente.id;
        const clienteNombre = reg.asignacion.centro.cliente.nombre;
        
        if (!clientesMap[clienteId]) {
          clientesMap[clienteId] = { nombre: clienteNombre, ingresos: 0, horas: 0 };
        }
        
        const horas = parseFloat(reg.horasNormales) + parseFloat(reg.horasExtra);
        const precioHora = parseFloat(reg.trabajador.categoria.precioHora) || 0;
        
        clientesMap[clienteId].ingresos += horas * precioHora;
        clientesMap[clienteId].horas += horas;
      }
    });

    const topClientes = Object.values(clientesMap)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5)
      .map(c => ({
        nombre: c.nombre,
        ingresos: parseFloat(c.ingresos.toFixed(2)),
        horas: parseFloat(c.horas.toFixed(2))
      }));

    // ========================================
    // 4. ALERTAS CRÍTICAS
    // ========================================
    const alertasCriticas = [];

    // Centros sin cobertura próximos 7 días
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);

    const centrosActivos = await prisma.centroTrabajo.findMany({
      where: { activo: true },
      include: { cliente: true }
    });

    for (const centro of centrosActivos) {
      const asignacionesFuturas = await prisma.asignacion.count({
        where: {
          centroId: centro.id,
          fecha: { gte: hoy, lte: en7Dias },
          estado: { notIn: ['CANCELADO'] }
        }
      });

      if (asignacionesFuturas === 0) {
        alertasCriticas.push({
          tipo: 'COBERTURA',
          severidad: 'ALTA',
          mensaje: `${centro.cliente?.nombre} - ${centro.nombre}: Sin cobertura próximos 7 días`
        });
      }
    }

    // Trabajadores con exceso de horas semanales (>45h)
    const trabajadoresConExceso = await prisma.trabajador.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellidos: true }
    });

    const lunes = new Date();
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    for (const trab of trabajadoresConExceso) {
      const horasSemana = await prisma.registroHoras.aggregate({
        where: {
          trabajadorId: trab.id,
          fecha: { gte: lunes, lte: domingo }
        },
        _sum: { horasNormales: true, horasExtra: true }
      });

      const totalHoras = parseFloat(horasSemana._sum.horasNormales || 0) + parseFloat(horasSemana._sum.horasExtra || 0);
      if (totalHoras > 45) {
        alertasCriticas.push({
          tipo: 'LEGAL',
          severidad: 'CRÍTICA',
          mensaje: `${trab.nombre} ${trab.apellidos}: ${totalHoras.toFixed(1)}h esta semana (límite: 45h)`
        });
      }
    }

    // Clientes con horas extras excesivas (>30% del total)
    Object.entries(clientesMap).forEach(([clienteId, data]) => {
      const registrosCliente = registrosMes.filter(r => 
        r.asignacion?.centro?.cliente?.id === parseInt(clienteId)
      );

      let horasExtrasCliente = 0;
      let horasTotalesCliente = 0;

      registrosCliente.forEach(reg => {
        horasExtrasCliente += parseFloat(reg.horasExtra);
        horasTotalesCliente += parseFloat(reg.horasNormales) + parseFloat(reg.horasExtra);
      });

      const porcentajeExtras = horasTotalesCliente > 0 ? (horasExtrasCliente / horasTotalesCliente) * 100 : 0;
      
      if (porcentajeExtras > 30) {
        alertasCriticas.push({
          tipo: 'FINANCIERO',
          severidad: 'MEDIA',
          mensaje: `${data.nombre}: Horas extras ${porcentajeExtras.toFixed(1)}% (revisar contrato)`
        });
      }
    });

    // ========================================
    // 5. EFICIENCIA OPERATIVA
    // ========================================
    let horasExtrasTotales = 0;
    let horasNormalesTotales = 0;

    registrosMes.forEach(reg => {
      horasExtrasTotales += parseFloat(reg.horasExtra);
      horasNormalesTotales += parseFloat(reg.horasNormales);
    });

    const ratioHorasExtras = (horasNormalesTotales + horasExtrasTotales) > 0 
      ? (horasExtrasTotales / (horasNormalesTotales + horasExtrasTotales)) * 100 
      : 0;

    // Ausencias no planificadas
    const ausenciasNoPlanificadas = await prisma.ausencia.count({
      where: {
        estado: 'APROBADA',
        fechaInicio: { gte: inicioMes, lte: finMes },
        tipoAusencia: { codigo: { in: ['BM', 'BML'] } } // Bajas médicas
      }
    });

    const totalAsignaciones = await prisma.asignacion.count({
      where: {
        fecha: { gte: inicioMes, lte: finMes },
        estado: { notIn: ['CANCELADO'] }
      }
    });

    const asignacionesCompletadas = await prisma.asignacion.count({
      where: {
        fecha: { gte: inicioMes, lte: finMes },
        estado: 'COMPLETADO'
      }
    });

    const coberturaTurnos = totalAsignaciones > 0 
      ? (asignacionesCompletadas / totalAsignaciones) * 100 
      : 0;

    // ========================================
    // RESPUESTA FINAL
    // ========================================
    res.json({
      periodo: {
        mes: mesActual,
        año: añoActual,
        mesNombre: new Date(añoActual, mesActual - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      },
      kpisFinancieros: {
        ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
        margenBruto: parseFloat(margenBruto.toFixed(2)),
        porcentajeMargen: parseFloat(porcentajeMargen.toFixed(1)),
        horasFacturables: parseFloat(horasTotales.toFixed(2)),
        variacionIngresos: parseFloat(variacionIngresos.toFixed(1))
      },
      kpisOperativos: {
        trabajadoresActivos,
        utilizacion: parseFloat(utilizacion.toFixed(1)),
        horasDisponibles: parseFloat(horasDisponiblesEsteMes.toFixed(2)),
        horasTrabajadas: parseFloat(horasTotales.toFixed(2))
      },
      topClientes,
      alertasCriticas: alertasCriticas.slice(0, 10), // Máximo 10 alertas
      eficiencia: {
        ratioHorasExtras: parseFloat(ratioHorasExtras.toFixed(1)),
        ausenciasNoPlanificadas,
        coberturaTurnos: parseFloat(coberturaTurnos.toFixed(1)),
        totalAsignaciones
      }
    });

  } catch (error) {
    console.error('Error en dashboard ejecutivo:', error);
    res.status(500).json({ error: 'Error generando dashboard ejecutivo' });
  }
});