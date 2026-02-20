const express = require('express');
const router = express.Router();
const { loginLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validation');
const { loginSchema } = require('../validators/authValidators');
const { authMiddleware } = require('../middlewares/auth');
const controller = require('../controllers/authController');

router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.get('/me', authMiddleware, controller.me);
router.put('/cambiar-password', authMiddleware, controller.cambiarPassword);

module.exports = router;
