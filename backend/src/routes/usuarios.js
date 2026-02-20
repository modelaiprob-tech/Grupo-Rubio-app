const express = require('express');
const router = express.Router();
const { validate } = require('../middlewares/validation');
const { crearUsuarioSchema, actualizarUsuarioSchema } = require('../validators/usuarioValidators');
const { adminOnly } = require('../middlewares/adminOnly');
const controller = require('../controllers/usuariosController');

router.get('/', adminOnly, controller.listar);
router.post('/', adminOnly, validate(crearUsuarioSchema), controller.crear);
router.put('/:id', adminOnly, validate(actualizarUsuarioSchema), controller.actualizar);
router.put('/:id/toggle-activo', adminOnly, controller.toggleActivo);

module.exports = router;
