const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET todas las categorías
router.get('/', async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(categorias);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// POST crear categoría
router.post('/', async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      salarioBase,
      plusConvenio,
      precioHora,
      recargoNocturno,
      recargoFestivo,
      recargoExtra,
      recargoExtraAdicional,
      plusTransporte,
      plusPeligrosidad
    } = req.body;

    const categoria = await prisma.categoria.create({
  data: {
    codigo,
    nombre,
    descripcion,
    salarioBase: parseFloat(salarioBase) || 0,
    plusConvenio: plusConvenio ? parseFloat(plusConvenio) : 0,
    precioHora: parseFloat(precioHora) || 0,
    recargoNocturno: recargoNocturno ? parseFloat(recargoNocturno) : 25,
    recargoFestivo: recargoFestivo ? parseFloat(recargoFestivo) : 75,
    recargoExtra: recargoExtra ? parseFloat(recargoExtra) : 75,
    recargoExtraAdicional: recargoExtraAdicional ? parseFloat(recargoExtraAdicional) : 100,
    plusTransporte: plusTransporte ? parseFloat(plusTransporte) : 0,
    plusPeligrosidad: plusPeligrosidad ? parseFloat(plusPeligrosidad) : 0,
    activo: true
  }
});

    res.json(categoria);
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// PUT actualizar categoría
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      nombre,
      descripcion,
      salarioBase,
      plusConvenio,
      precioHora,
      recargoNocturno,
      recargoFestivo,
      recargoExtra,
      recargoExtraAdicional,
      plusTransporte,
      plusPeligrosidad
    } = req.body;

    const categoria = await prisma.categoria.update({
  where: { id: parseInt(id) },
  data: {
    codigo,
    nombre,
    descripcion,
    salarioBase: parseFloat(salarioBase) || 0,
    plusConvenio: plusConvenio ? parseFloat(plusConvenio) : 0,
    precioHora: parseFloat(precioHora) || 0,
    recargoNocturno: recargoNocturno ? parseFloat(recargoNocturno) : 0,
    recargoFestivo: recargoFestivo ? parseFloat(recargoFestivo) : 0,
    recargoExtra: recargoExtra ? parseFloat(recargoExtra) : 0,
    recargoExtraAdicional: recargoExtraAdicional ? parseFloat(recargoExtraAdicional) : 0,
    plusTransporte: plusTransporte ? parseFloat(plusTransporte) : 0,
    plusPeligrosidad: plusPeligrosidad ? parseFloat(plusPeligrosidad) : 0
  }
});

    res.json(categoria);
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// DELETE desactivar categoría
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay trabajadores usando esta categoría
    const trabajadores = await prisma.trabajador.count({
      where: { categoriaId: parseInt(id), activo: true }
    });

    if (trabajadores > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar. Hay ${trabajadores} trabajador(es) activo(s) con esta categoría.` 
      });
    }

    const categoria = await prisma.categoria.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });

    res.json(categoria);
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

module.exports = router;