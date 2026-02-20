const express = require('express');
const router = express.Router();
const controller = require('../controllers/informesController');

router.get('/estado-trabajadores', controller.estadoTrabajadores);
router.get('/horas-trabajador', controller.horasTrabajador);
router.get('/horas-cliente', controller.horasCliente);
router.get('/calendario-empresa', controller.calendarioEmpresa);

module.exports = router;
