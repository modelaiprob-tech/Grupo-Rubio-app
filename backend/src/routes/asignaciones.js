const express = require('express');
const router = express.Router();
const { validate } = require('../middlewares/validation');
const { crearAsignacionSchema, copiarSemanaSchema } = require('../validators/asignacionValidators');
const controller = require('../controllers/asignacionesController');

router.get('/', controller.listar);
router.post('/', validate(crearAsignacionSchema), controller.crear);
router.post('/copiar-semana', validate(copiarSemanaSchema), controller.copiarSemana);
router.delete('/:id', controller.eliminar);

module.exports = router;
