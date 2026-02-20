const express = require('express');
const router = express.Router();
const controller = require('../controllers/horariosFijosController');

router.get('/trabajador/:trabajadorId', controller.obtenerPorTrabajador);
router.get('/centro/:centroId', controller.obtenerPorCentro);
router.post('/generar-asignaciones', controller.generarAsignaciones);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.desactivar);

module.exports = router;
