const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET todos los tipos de ausencia
router.get('/', async (req, res) => {
  try {
    const tipos = await prisma.tipoAusencia.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(tipos);
  } catch (error) {
    console.error('Error obteniendo tipos de ausencia:', error);
    res.status(500).json({ error: 'Error al obtener tipos de ausencia' });
  }
});

// POST crear tipo de ausencia
router.post('/', async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      restaVacaciones,
      restaAsuntos,
      pagada,
      porcentajeCobro,
      colorHex,
      diasMaximo,
      requiereJustificante
    } = req.body;

    const tipo = await prisma.tipoAusencia.create({
      data: {
        codigo,
        nombre,
        descripcion,
        restaVacaciones: restaVacaciones || false,
        restaAsuntos: restaAsuntos || false,
        pagada: pagada !== undefined ? pagada : true,
        porcentajeCobro: porcentajeCobro || 100,
        colorHex: colorHex || '#6B7280',
        diasMaximo,
        requiereJustificante: requiereJustificante || false,
        activo: true
      }
    });

    res.json(tipo);
  } catch (error) {
    console.error('Error creando tipo de ausencia:', error);
    res.status(500).json({ error: 'Error al crear tipo de ausencia' });
  }
});

// PUT actualizar tipo de ausencia
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      nombre,
      descripcion,
      restaVacaciones,
      restaAsuntos,
      pagada,
      porcentajeCobro,
      colorHex,
      diasMaximo,
      requiereJustificante
    } = req.body;

    const tipo = await prisma.tipoAusencia.update({
      where: { id: parseInt(id) },
      data: {
        codigo,
        nombre,
        descripcion,
        restaVacaciones,
        restaAsuntos,
        pagada,
        porcentajeCobro,
        colorHex,
        diasMaximo,
        requiereJustificante
      }
    });

    res.json(tipo);
  } catch (error) {
    console.error('Error actualizando tipo de ausencia:', error);
    res.status(500).json({ error: 'Error al actualizar tipo de ausencia' });
  }
});

// DELETE desactivar tipo de ausencia
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay ausencias usando este tipo
    const ausencias = await prisma.ausencia.count({
      where: { tipoAusenciaId: parseInt(id) }
    });

    if (ausencias > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar. Hay ${ausencias} ausencia(s) registrada(s) con este tipo.` 
      });
    }

    const tipo = await prisma.tipoAusencia.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json(tipo);
  } catch (error) {
    console.error('Error eliminando tipo de ausencia:', error);
    res.status(500).json({ error: 'Error al eliminar tipo de ausencia' });
  }
});

module.exports = router;