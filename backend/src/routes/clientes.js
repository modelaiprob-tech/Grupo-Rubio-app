const express = require('express');
const router = express.Router();
const { validate } = require('../middlewares/validation');
const { crearClienteSchema } = require('../validators/clienteValidators');
const controller = require('../controllers/clientesController');

router.get('/', controller.listar);
router.post('/', validate(crearClienteSchema), controller.crear);
router.put('/:id/dar-baja', controller.darBaja);
router.put('/:id/reactivar', controller.reactivar);

module.exports = router;
