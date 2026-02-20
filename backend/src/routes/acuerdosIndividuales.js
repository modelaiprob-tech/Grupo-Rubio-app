const express = require('express');
const router = express.Router();
const controller = require('../controllers/acuerdosIndividualesController');

router.get('/', controller.listar);
router.get('/trabajador/:trabajadorId', controller.listarPorTrabajador);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.desactivar);

module.exports = router;
