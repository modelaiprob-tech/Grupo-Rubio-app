const express = require('express');
const router = express.Router();
const { auditLogger } = require('../middlewares/auditLogger');
const { validate } = require('../middlewares/validation');
const { crearTrabajadorSchema, actualizarTrabajadorSchema, trabajadorCentroSchema } = require('../validators/trabajadorValidators');
const controller = require('../controllers/trabajadoresController');

// GET endpoints (disponibles ANTES de :id para evitar colision)
router.get('/', controller.listar);
router.get('/disponibles', controller.disponibles);
router.get('/:id', controller.obtenerPorId);
router.get('/:id/completo', controller.obtenerCompleto);

// Mutaciones con audit y validacion
router.post('/', auditLogger('trabajadores'), validate(crearTrabajadorSchema), controller.crear);
router.put('/:id', auditLogger('trabajadores'), validate(actualizarTrabajadorSchema), controller.actualizar);
router.put('/:id/dar-baja', controller.darDeBaja);
router.put('/:id/reactivar', controller.reactivar);

// Relacion trabajador-centro
router.post('/trabajador-centro', validate(trabajadorCentroSchema), controller.asignarCentro);
router.delete('/trabajador-centro/:id', controller.eliminarCentro);

module.exports = router;
