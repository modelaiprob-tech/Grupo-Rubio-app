const express = require('express');
const router = express.Router();
const { validate } = require('../middlewares/validation');
const { crearAusenciaSchema, actualizarAusenciaSchema } = require('../validators/ausenciaValidators');
const { auditLogger } = require('../middlewares/auditLogger');
const controller = require('../controllers/ausenciasController');

router.get('/', controller.listar);
router.post('/', auditLogger('ausencias'), validate(crearAusenciaSchema), controller.crear);
router.get('/:id/calcular-importe', controller.calcularImporte);
router.put('/:id', auditLogger('ausencias'), validate(actualizarAusenciaSchema), controller.actualizar);
router.put('/:id/rechazar', controller.rechazar);
router.put('/:id/aprobar', auditLogger('ausencias'), controller.aprobar);
router.put('/:id/archivar', controller.archivar);

module.exports = router;
