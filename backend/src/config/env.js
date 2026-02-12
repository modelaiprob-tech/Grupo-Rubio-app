/**
 * Configuración centralizada de variables de entorno.
 * Valida que las variables críticas estén definidas al arrancar.
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

// En producción, JWT_SECRET DEBE estar definido como variable de entorno
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && NODE_ENV === 'production') {
  console.error('❌ FATAL: JWT_SECRET no está definido en las variables de entorno.');
  console.error('   Defínelo en .env o como variable de entorno del sistema.');
  process.exit(1);
}

module.exports = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 3001,
  JWT_SECRET: JWT_SECRET || 'dev-only-secret-cambiar-en-produccion',
  DATABASE_URL: process.env.DATABASE_URL,
};
