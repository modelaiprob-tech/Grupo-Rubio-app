const express = require('express');
const router = express.Router();
const controller = require('../controllers/nominasController');

router.get('/calcular/:trabajadorId', controller.calcular);

module.exports = router;
