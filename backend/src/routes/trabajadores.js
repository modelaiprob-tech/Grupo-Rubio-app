// ============================================
// RUTAS: TRABAJADORES
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { auditLogger } = require('../middlewares/auditLogger');
const { validate } = require('../middlewares/validation');
const { crearTrabajadorSchema, actualizarTrabajadorSchema, trabajadorCentroSchema } = require('../validators/trabajadorValidators');
const { asyncHandler } = require('../middlewares/errorHandler');

// Helper: limpiar datos del body antes de enviar a Prisma
// Convierte strings vacíos a null y aplica tipos correctos
function limpiarDatosTrabajador(body) {
  const camposPermitidos = [
    'dni', 'nombre', 'apellidos', 'telefono', 'email', 'direccion', 'codigoPostal',
    'localidad', 'fechaNacimiento', 'fechaAlta', 'categoriaId', 'tipoContrato',
    'horasContrato', 'costeHora', 'diasVacacionesAnuales', 'diasAsuntosPropios',
    'numeroSeguridadSocial', 'cuentaBancaria', 'notas', 'activo',
    'nacionalidad', 'estadoCivil', 'genero', 'provincia', 'pais',
    'emailPersonal', 'telefonoPersonal', 'telefonoEmergencia',
    'tipoIdentificacion', 'identificacionSecundaria', 'tipoIdentificacionSecundaria',
    'compartirCumpleanos'
  ];

  const camposDateTime = ['fechaNacimiento', 'fechaAlta', 'fechaBaja'];
  const camposInt = ['categoriaId', 'diasVacacionesAnuales', 'diasAsuntosPropios'];
  const camposDecimal = ['horasContrato', 'costeHora'];
  const camposBoolean = ['activo', 'compartirCumpleanos'];

  const data = {};
  for (const campo of camposPermitidos) {
    if (body[campo] !== undefined) {
      let valor = body[campo];

      // Convertir strings vacíos a null (Prisma no acepta '' para DateTime, etc.)
      if (valor === '' || valor === null) {
        valor = null;
      } else if (camposDateTime.includes(campo)) {
        valor = new Date(valor);
      } else if (camposInt.includes(campo)) {
        valor = parseInt(valor);
      } else if (camposDecimal.includes(campo)) {
        valor = parseFloat(valor);
      } else if (camposBoolean.includes(campo)) {
        valor = valor === true || valor === 'true';
      }

      data[campo] = valor;
    }
  }
  return data;
}

// GET /api/trabajadores
router.get('/', asyncHandler(async (req, res) => {
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
}));

// GET /api/trabajadores/disponibles
// ⚠️ IMPORTANTE: Este endpoint debe ir ANTES de /:id
router.get('/disponibles', asyncHandler(async (req, res) => {
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
}));

// GET /api/trabajadores/:id
router.get('/:id', asyncHandler(async (req, res) => {
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
}));

// GET /api/trabajadores/:id/completo
router.get('/:id/completo', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(id) },
      include: {
        categoria: true,
        acuerdosIndividuales: {
          where: { activo: true },
          include: {
            centro: { select: { id: true, nombre: true } }
          }
        }
      }
    });

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    res.json(trabajador);
}));

// POST /api/trabajadores
router.post('/', auditLogger('trabajadores'), validate(crearTrabajadorSchema), asyncHandler(async (req, res) => {
    const data = limpiarDatosTrabajador(req.body);

    const trabajador = await prisma.trabajador.create({
      data,
      include: { categoria: true }
    });

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
}));

// PUT /api/trabajadores/:id
router.put('/:id', auditLogger('trabajadores'), validate(actualizarTrabajadorSchema), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const anterior = await prisma.trabajador.findUnique({ where: { id } });

    const data = limpiarDatosTrabajador(req.body);

    const trabajador = await prisma.trabajador.update({
      where: { id },
      data,
      include: { categoria: true }
    });

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
}));

// PUT /api/trabajadores/:id/dar-baja
router.put('/:id/dar-baja', asyncHandler(async (req, res) => {
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
}));

// PUT /api/trabajadores/:id/reactivar
router.put('/:id/reactivar', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    const trabajador = await prisma.trabajador.update({
      where: { id },
      data: {
        activo: true,
        fechaBaja: null
      },
      include: { categoria: true }
    });

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
}));

// POST /api/trabajadores/trabajador-centro (worker-center preference)
router.post('/trabajador-centro', validate(trabajadorCentroSchema), asyncHandler(async (req, res) => {
    const { trabajadorId, centroId, esHabitual } = req.body;

    const relacion = await prisma.trabajadorCentro.create({
      data: {
        trabajadorId: parseInt(trabajadorId),
        centroId: parseInt(centroId),
        esHabitual: esHabitual || false
      }
    });

    res.status(201).json(relacion);
}));

// DELETE /api/trabajadores/trabajador-centro/:id
router.delete('/trabajador-centro/:id', asyncHandler(async (req, res) => {
    await prisma.trabajadorCentro.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Relación eliminada' });
}));

module.exports = router;
