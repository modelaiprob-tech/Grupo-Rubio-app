/**
 * Middleware de manejo centralizado de errores
 * Debe ir AL FINAL de todas las rutas en server.js
 */
function errorHandler(err, req, res, next) {
  // Log del error completo en consola (para debugging)
  console.error('❌ Error capturado:', {
    message: err.message,
    stack: err.stack,
    status: err.status,
    path: req.path,
    method: req.method
  });

  // Si ya se envió respuesta, delegar a Express
  if (res.headersSent) {
    return next(err);
  }

  // Errores de validación Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Ya existe un registro con esos datos únicos',
      campo: err.meta?.target
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro no encontrado'
    });
  }

  // Errores personalizados (de services)
  if (err.status) {
    return res.status(err.status).json({
      error: err.error || err.message,
      detalles: err.detalles,
      ausenciasSolapadas: err.ausenciasSolapadas
    });
  }

  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}

/**
 * Wrapper para funciones async en rutas
 * Evita tener try/catch en cada endpoint
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
