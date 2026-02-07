const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

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
      // CÁLCULO ECONÓMICO
      porcentajeCobro,
      usaTramos,
      tramosJson,
      baseCalculo,
      diasCarencia,
      topeDiarioEuros,
      // QUIÉN PAGA
      pagador,
      // CÓMPUTO DÍAS
      incluyeDomingos,
      incluyeFestivos,
      diasMaximo,
      // DOCUMENTACIÓN
      requiereJustificante,
      tipoJustificante,
      requiereAltaMedica,
      // METADATA
      colorHex
    } = req.body;

    const tipo = await prisma.tipoAusencia.create({
      data: {
        codigo,
        nombre,
        descripcion,
        restaVacaciones: restaVacaciones || false,
        restaAsuntos: restaAsuntos || false,
        pagada: pagada !== undefined ? pagada : true,
        // CÁLCULO ECONÓMICO
        porcentajeCobro: porcentajeCobro || 100,
        usaTramos: usaTramos || false,
        tramosJson: tramosJson || null,
        baseCalculo: baseCalculo || 'SALARIO_BASE',
        diasCarencia: diasCarencia || 0,
        topeDiarioEuros: topeDiarioEuros || null,
        // QUIÉN PAGA
        pagador: pagador || 'EMPRESA',
        // CÓMPUTO DÍAS
        incluyeDomingos: incluyeDomingos !== undefined ? incluyeDomingos : true,
        incluyeFestivos: incluyeFestivos !== undefined ? incluyeFestivos : true,
        diasMaximo: diasMaximo || null,
        // DOCUMENTACIÓN
        requiereJustificante: requiereJustificante || false,
        tipoJustificante: tipoJustificante || 'MEDICO',
        requiereAltaMedica: requiereAltaMedica || false,
        // METADATA
        colorHex: colorHex || '#6B7280',
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
    
    // Construir objeto data con conversiones de tipos
    const data = {};
    
    // Campos básicos
    if (req.body.codigo !== undefined) data.codigo = req.body.codigo;
    if (req.body.nombre !== undefined) data.nombre = req.body.nombre;
    if (req.body.descripcion !== undefined) data.descripcion = req.body.descripcion;
    if (req.body.restaVacaciones !== undefined) data.restaVacaciones = Boolean(req.body.restaVacaciones);
    if (req.body.restaAsuntos !== undefined) data.restaAsuntos = Boolean(req.body.restaAsuntos);
    if (req.body.pagada !== undefined) data.pagada = Boolean(req.body.pagada);
    
    // CÁLCULO ECONÓMICO - Convertir strings a números
    if (req.body.porcentajeCobro !== undefined) {
      data.porcentajeCobro = parseFloat(req.body.porcentajeCobro);
    }
    if (req.body.usaTramos !== undefined) {
      data.usaTramos = Boolean(req.body.usaTramos);
    }
    if (req.body.tramosJson !== undefined) {
      data.tramosJson = req.body.tramosJson || null;
    }
    if (req.body.baseCalculo !== undefined) {
      data.baseCalculo = req.body.baseCalculo;
    }
    if (req.body.diasCarencia !== undefined) {
      data.diasCarencia = parseInt(req.body.diasCarencia) || 0;
    }
    if (req.body.topeDiarioEuros !== undefined) {
      data.topeDiarioEuros = req.body.topeDiarioEuros ? parseFloat(req.body.topeDiarioEuros) : null;
    }
    
    // QUIÉN PAGA
    if (req.body.pagador !== undefined) {
      data.pagador = req.body.pagador;
    }
    
    // CÓMPUTO DÍAS
    if (req.body.incluyeDomingos !== undefined) {
      data.incluyeDomingos = Boolean(req.body.incluyeDomingos);
    }
    if (req.body.incluyeFestivos !== undefined) {
      data.incluyeFestivos = Boolean(req.body.incluyeFestivos);
    }
    if (req.body.diasMaximo !== undefined) {
      data.diasMaximo = req.body.diasMaximo ? parseInt(req.body.diasMaximo) : null;
    }
    
    // DOCUMENTACIÓN
    if (req.body.requiereJustificante !== undefined) {
      data.requiereJustificante = Boolean(req.body.requiereJustificante);
    }
    if (req.body.tipoJustificante !== undefined) {
      data.tipoJustificante = req.body.tipoJustificante;
    }
    if (req.body.requiereAltaMedica !== undefined) {
      data.requiereAltaMedica = Boolean(req.body.requiereAltaMedica);
    }
    
    // METADATA
    if (req.body.colorHex !== undefined) {
      data.colorHex = req.body.colorHex;
    }

    const tipo = await prisma.tipoAusencia.update({
      where: { id: parseInt(id) },
      data: data
    });

    res.json(tipo);
  } catch (error) {
    console.error('Error actualizando tipo de ausencia:', error);
    res.status(500).json({ 
      error: 'Error al actualizar tipo de ausencia',
      detalle: error.message 
    });
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
