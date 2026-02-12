// ============================================
// RUTAS: AUSENCIAS
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const ausenciaService = require('../services/ausenciaService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { validate } = require('../middlewares/validation');
const { crearAusenciaSchema, actualizarAusenciaSchema } = require('../validators/ausenciaValidators');
const { auditLogger } = require('../middlewares/auditLogger');

// GET /api/ausencias
router.get('/', asyncHandler(async (req, res) => {
    const { estado, trabajadorId, mes, año, archivada } = req.query;

    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (trabajadorId) {
      const trabajadorIdNum = parseInt(trabajadorId);
      if (isNaN(trabajadorIdNum)) {
        return res.status(400).json({ error: 'trabajadorId debe ser un número' });
      }
      where.trabajadorId = trabajadorIdNum;
    }

    if (archivada !== undefined) {
      where.archivada = archivada === 'true';
    }

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

    const ausencias = await prisma.ausencia.findMany({
      where,
      include: {
        trabajador: {
          select: { id: true, nombre: true, apellidos: true }
        },
        tipoAusencia: true,
        aprobadoPor: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    });

    res.json(ausencias);
}));

// POST /api/ausencias
router.post('/',
  auditLogger('ausencias'),
  validate(crearAusenciaSchema),
  asyncHandler(async (req, res) => {
    const resultado = await ausenciaService.crearAusencia(req.body);
    res.status(201).json(resultado);
  })
);

// GET /api/ausencias/:id/calcular-importe
router.get('/:id/calcular-importe', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { calcularImporteAusencia } = require('../../utils/calcularImporteAusencia');

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

    const calculo = await calcularImporteAusencia(ausencia.trabajador, ausencia);

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
}));

// PUT /api/ausencias/:id
router.put('/:id',
  auditLogger('ausencias'),
  validate(actualizarAusenciaSchema),
  asyncHandler(async (req, res) => {
    const ausencia = await ausenciaService.actualizarAusencia(parseInt(req.params.id), req.body);
    res.json(ausencia);
  })
);

// PUT /api/ausencias/:id/rechazar
router.put('/:id/rechazar',
  asyncHandler(async (req, res) => {
    const ausencia = await ausenciaService.rechazarAusencia(parseInt(req.params.id), req.user.id, req.body.motivo);
    res.json(ausencia);
  })
);

// PUT /api/ausencias/:id/aprobar
router.put('/:id/aprobar',
  auditLogger('ausencias'),
  asyncHandler(async (req, res) => {
    const resultado = await ausenciaService.aprobarAusencia(parseInt(req.params.id), req.user.id);
    res.json(resultado);
  })
);

// PUT /api/ausencias/:id/archivar
router.put('/:id/archivar', asyncHandler(async (req, res) => {
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
}));

module.exports = router;
