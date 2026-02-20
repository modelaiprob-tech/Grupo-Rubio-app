const express = require('express');
const router = express.Router();
const { validate } = require('../middlewares/validation');
const { crearCentroSchema, actualizarCentroSchema } = require('../validators/centroValidators');
const controller = require('../controllers/centrosController');

router.get('/', controller.listar);
router.post('/', validate(crearCentroSchema), controller.crear);
router.put('/:id', validate(actualizarCentroSchema), controller.actualizar);
router.put('/:id/dar-baja', controller.darDeBaja);
router.put('/:id/reactivar', controller.reactivar);
router.get('/:id/horarios-limpieza', controller.obtenerHorariosLimpieza);
router.post('/:id/horarios-limpieza', controller.actualizarHorariosLimpieza);

module.exports = router;
