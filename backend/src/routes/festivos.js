// ============================================
// RUTAS: FESTIVOS
// GET accesible por todos los autenticados
// POST/PUT/DELETE solo ADMIN
// ============================================
const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middlewares/adminOnly');
const { validate } = require('../middlewares/validation');
const controller = require('../controllers/festivosController');

const crearFestivoSchema = {
  fecha: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, patternMessage: 'fecha debe tener formato YYYY-MM-DD' },
  nombre: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  ambito: { required: true, type: 'string', enum: ['Nacional', 'Navarra', 'Local'] }
};

const actualizarFestivoSchema = {
  fecha: { required: false, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/, patternMessage: 'fecha debe tener formato YYYY-MM-DD' },
  nombre: { required: false, type: 'string', minLength: 2, maxLength: 100 },
  ambito: { required: false, type: 'string', enum: ['Nacional', 'Navarra', 'Local'] }
};

// Listar festivos (todos los autenticados)
router.get('/', controller.listar);

// Crear festivo (solo ADMIN)
router.post('/', adminOnly, validate(crearFestivoSchema), controller.crear);

// Carga masiva de festivos (solo ADMIN)
router.post('/carga-masiva', adminOnly, controller.cargaMasiva);

// Actualizar festivo (solo ADMIN)
router.put('/:id', adminOnly, validate(actualizarFestivoSchema), controller.actualizar);

// Eliminar festivo (solo ADMIN)
router.delete('/:id', adminOnly, controller.eliminar);

module.exports = router;
