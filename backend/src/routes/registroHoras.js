// ============================================
// RUTAS: REGISTRO DE HORAS
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// GET /api/registro-horas
router.get('/', async (req, res) => {
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

module.exports = router;
