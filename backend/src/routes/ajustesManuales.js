const express = require('express');
const router = express.Router();
const controller = require('../controllers/ajustesManualesController');

router.post('/', controller.crearOActualizar);

module.exports = router;
