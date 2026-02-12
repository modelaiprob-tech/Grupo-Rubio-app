// ============================================
// RUTAS: PLANTILLAS DE TURNOS
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// GET /api/plantillas
router.get('/', async (req, res) => {
  try {
    const plantillas = await prisma.plantillas_turnos.findMany({
      include: {
        centros_trabajo: true,
        plantillas_turnos_detalle: {
          include: { trabajadores: true }
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

// POST /api/plantillas/crear-desde-semana
router.post('/crear-desde-semana', async (req, res) => {
  try {
    const { nombre, descripcion, centroId, fechaInicio, fechaFin } = req.body;

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

    const plantilla = await prisma.plantillas_turnos.create({
      data: {
        nombre,
        descripcion,
        centro_id: centroId,
        creado_por_id: req.user.id
      }
    });

    for (const asig of asignaciones) {
      const diaSemana = new Date(asig.fecha).getDay() || 7;

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

// POST /api/plantillas/:id/aplicar
router.post('/:id/aplicar', async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio } = req.body;

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

// DELETE /api/plantillas/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.plantillas_turnos_detalle.deleteMany({
      where: { plantilla_id: parseInt(id) }
    });

    await prisma.plantillas_turnos.delete({
      where: { id: parseInt(id) }
    });

    res.json({ mensaje: 'Plantilla eliminada' });
  } catch (err) {
    console.error('Error eliminando plantilla:', err);
    res.status(500).json({ error: 'Error al eliminar plantilla' });
  }
});

module.exports = router;
