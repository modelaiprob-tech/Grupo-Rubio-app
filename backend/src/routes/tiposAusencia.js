const express = require('express');
const router = express.Router();
const controller = require('../controllers/tiposAusenciaController');

router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.desactivar);

module.exports = router;
