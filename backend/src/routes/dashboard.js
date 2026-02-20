const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');

router.get('/stats', controller.stats);
router.get('/centros-sin-cubrir', controller.centrosSinCubrir);
router.get('/ejecutivo', controller.ejecutivo);

module.exports = router;
