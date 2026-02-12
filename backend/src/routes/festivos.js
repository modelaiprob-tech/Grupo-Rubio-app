// ============================================
// RUTAS: FESTIVOS
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// GET /api/festivos
router.get('/', async (req, res) => {
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

module.exports = router;
