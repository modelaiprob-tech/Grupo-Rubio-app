const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware que registra cambios en HistorialCambios
 */
function auditLogger(tabla) {
  return async (req, res, next) => {
    // Guardar método original de res.json
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json para capturar respuesta
    res.json = function(data) {
      // Solo registrar si fue exitoso (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Determinar acción
        let accion = 'READ';
        if (req.method === 'POST') accion = 'CREATE';
        if (req.method === 'PUT') accion = 'UPDATE';
        if (req.method === 'DELETE') accion = 'DELETE';

        // Solo registrar CREATE, UPDATE, DELETE (no READ)
        if (accion !== 'READ') {
          const registroId = data.id || req.params.id || null;

          // Registrar en background (no bloquear respuesta)
          prisma.historialCambios.create({
            data: {
              tablaAfectada: tabla,
              registroId: registroId ? parseInt(registroId) : null,
              accion,
              datosNuevos: data,
              usuarioId: req.user?.id || null,
              ipAddress: req.ip || req.connection.remoteAddress
            }
          }).catch(err => {
            console.error('Error guardando log:', err);
          });
        }
      }

      // Llamar al json original
      return originalJson(data);
    };

    next();
  };
}

module.exports = { auditLogger };
