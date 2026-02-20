const express = require('express');
const router = express.Router();
const controller = require('../controllers/plantillasController');

router.get('/', controller.listar);
router.post('/crear-desde-semana', controller.crearDesdeSemana);
router.post('/:id/aplicar', controller.aplicar);
router.delete('/:id', controller.eliminar);

module.exports = router;
