/**
 * Middleware que restringe acceso solo a administradores.
 * Requiere que authMiddleware ya haya populado req.user.
 */
const adminOnly = (req, res, next) => {
  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado - Solo administradores' });
  }
  next();
};

module.exports = { adminOnly };
