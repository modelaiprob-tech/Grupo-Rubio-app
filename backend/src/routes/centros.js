// ============================================
// RUTAS: CENTROS DE TRABAJO
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { validate } = require('../middlewares/validation');
const { crearCentroSchema, actualizarCentroSchema } = require('../validators/centroValidators');
const { asyncHandler } = require('../middlewares/errorHandler');

// GET /api/centros
router.get('/', asyncHandler(async (req, res) => {
    const { clienteId } = req.query;
    const where = { activo: true };
    if (clienteId) where.clienteId = parseInt(clienteId);

    const centros = await prisma.centroTrabajo.findMany({
      where,
      include: {
        cliente: true,
        horariosLimpieza: {
          where: { activo: true },
          orderBy: { orden: 'asc' }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(centros);
}));

// POST /api/centros
router.post('/', validate(crearCentroSchema), asyncHandler(async (req, res) => {
    const centro = await prisma.centroTrabajo.create({
      data: {
        nombre: req.body.nombre,
        direccion: req.body.direccion,
        clienteId: req.body.clienteId,
        horarioApertura: req.body.horarioApertura,
        horarioCierre: req.body.horarioCierre,
        tipoHorarioLimpieza: req.body.tipoHorarioLimpieza || 'FLEXIBLE'
      }
    });

    // Crear horarios limpieza si es FIJO
    if (req.body.tipoHorarioLimpieza === 'FIJO' && req.body.horariosLimpieza?.length > 0) {
      await Promise.all(
        req.body.horariosLimpieza.map((h, index) =>
          prisma.horarioLimpieza.create({
            data: {
              centroId: centro.id,
              inicio: h.inicio,
              fin: h.fin,
              orden: index + 1
            }
          })
        )
      );
    }

    res.json(centro);
}));

// PUT /api/centros/:id
router.put('/:id', validate(actualizarCentroSchema), asyncHandler(async (req, res) => {
    const centroId = parseInt(req.params.id);

    const centro = await prisma.centroTrabajo.update({
      where: { id: centroId },
      data: {
        nombre: req.body.nombre,
        direccion: req.body.direccion,
        horarioApertura: req.body.horarioApertura,
        horarioCierre: req.body.horarioCierre,
        tipoHorarioLimpieza: req.body.tipoHorarioLimpieza || 'FLEXIBLE',
        tipo_servicio: req.body.tipoServicio || 'FRECUENTE'
      },
      include: { cliente: true }
    });

    // Actualizar horarios limpieza
    if (req.body.tipoHorarioLimpieza === 'FIJO' && req.body.horariosLimpieza?.length > 0) {
      await prisma.horarioLimpieza.updateMany({
        where: { centroId: centroId },
        data: { activo: false }
      });

      await Promise.all(
        req.body.horariosLimpieza.map((h, index) =>
          prisma.horarioLimpieza.create({
            data: {
              centroId: centroId,
              inicio: h.inicio,
              fin: h.fin,
              orden: index + 1,
              activo: true
            }
          })
        )
      );
    } else if (req.body.tipoHorarioLimpieza === 'FLEXIBLE') {
      await prisma.horarioLimpieza.updateMany({
        where: { centroId: centroId },
        data: { activo: false }
      });
    }

    res.json(centro);
}));

// PUT /api/centros/:id/dar-baja
router.put('/:id/dar-baja', asyncHandler(async (req, res) => {
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
}));

// PUT /api/centros/:id/reactivar
router.put('/:id/reactivar', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    const centro = await prisma.centroTrabajo.update({
      where: { id },
      data: { activo: true },
      include: { cliente: true }
    });

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
}));

// GET /api/centros/:id/horarios-limpieza
router.get('/:id/horarios-limpieza', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const horarios = await prisma.horarioLimpieza.findMany({
      where: { centroId: parseInt(id), activo: true },
      orderBy: { orden: 'asc' }
    });
    res.json(horarios);
}));

// POST /api/centros/:id/horarios-limpieza
router.post('/:id/horarios-limpieza', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { horarios } = req.body;

    await prisma.horarioLimpieza.updateMany({
      where: { centroId: parseInt(id) },
      data: { activo: false }
    });

    const nuevosHorarios = await Promise.all(
      horarios.map((h, index) =>
        prisma.horarioLimpieza.create({
          data: {
            centroId: parseInt(id),
            inicio: h.inicio,
            fin: h.fin,
            orden: index + 1,
            activo: true
          }
        })
      )
    );

    res.json(nuevosHorarios);
}));

module.exports = router;
