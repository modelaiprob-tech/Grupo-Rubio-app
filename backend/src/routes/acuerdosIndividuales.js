const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET todos los acuerdos (con info de trabajador y centro)
router.get('/', async (req, res) => {
  try {
    const acuerdos = await prisma.acuerdoIndividual.findMany({
      where: { activo: true },
      include: {
        trabajador: {
          select: {
            id: true,
            nombre: true,
            apellidos: true
          }
        },
        centro: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(acuerdos);
  } catch (error) {
    console.error('Error obteniendo acuerdos:', error);
    res.status(500).json({ error: 'Error al obtener acuerdos' });
  }
});

// GET acuerdos de un trabajador específico
router.get('/trabajador/:trabajadorId', async (req, res) => {
  try {
    const { trabajadorId } = req.params;
    const acuerdos = await prisma.acuerdoIndividual.findMany({
      where: { 
        trabajadorId: parseInt(trabajadorId),
        activo: true 
      },
      include: {
        centro: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });
    res.json(acuerdos);
  } catch (error) {
    console.error('Error obteniendo acuerdos del trabajador:', error);
    res.status(500).json({ error: 'Error al obtener acuerdos' });
  }
});

// POST crear acuerdo
router.post('/', async (req, res) => {
  try {
    const {
      trabajadorId,
      tipoAcuerdo,
      valor,
      centroId,
      descripcion,
      fechaInicio,
      fechaFin
    } = req.body;

    const acuerdo = await prisma.acuerdoIndividual.create({
      data: {
        trabajadorId,
        tipoAcuerdo,
        valor,
        centroId: centroId || null,
        descripcion,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        activo: true
      },
      include: {
        trabajador: {
          select: {
            nombre: true,
            apellidos: true
          }
        },
        centro: {
          select: {
            nombre: true
          }
        }
      }
    });

    res.json(acuerdo);
  } catch (error) {
    console.error('Error creando acuerdo:', error);
    res.status(500).json({ error: 'Error al crear acuerdo' });
  }
});

// PUT actualizar acuerdo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipoAcuerdo,
      valor,
      centroId,
      descripcion,
      fechaInicio,
      fechaFin
    } = req.body;

    const acuerdo = await prisma.acuerdoIndividual.update({
      where: { id: parseInt(id) },
      data: {
        tipoAcuerdo,
        valor,
        centroId: centroId || null,
        descripcion,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : null
      },
      include: {
        trabajador: {
          select: {
            nombre: true,
            apellidos: true
          }
        },
        centro: {
          select: {
            nombre: true
          }
        }
      }
    });

    res.json(acuerdo);
  } catch (error) {
    console.error('Error actualizando acuerdo:', error);
    res.status(500).json({ error: 'Error al actualizar acuerdo' });
  }
});

// DELETE desactivar acuerdo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const acuerdo = await prisma.acuerdoIndividual.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json(acuerdo);
  } catch (error) {
    console.error('Error eliminando acuerdo:', error);
    res.status(500).json({ error: 'Error al eliminar acuerdo' });
  }
});

module.exports = router;