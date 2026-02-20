const express = require('express');
const router = express.Router();
const controller = require('../controllers/controlHorasController');

router.get('/', controller.obtenerMatriz);
router.get('/nomina', controller.obtenerNomina);

module.exports = router;
