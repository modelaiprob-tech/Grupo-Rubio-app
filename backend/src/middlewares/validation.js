/**
 * Middleware de validación genérico.
 * Valida req[source] contra un schema declarativo.
 *
 * Reglas soportadas:
 *   required, type, min, max, minLength, maxLength,
 *   pattern, enum, custom
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} es obligatorio`);
        continue;
      }

      // Skip optional absent fields
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type check
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`${field} debe ser de tipo ${rules.type}`);
          continue;
        }
      }

      // Number constraints
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} debe ser mayor o igual a ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} debe ser menor o igual a ${rules.max}`);
        }
      }

      // String constraints
      if (rules.type === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`${field} debe tener al menos ${rules.minLength} caracteres`);
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`${field} debe tener máximo ${rules.maxLength} caracteres`);
        }
      }

      // Regex pattern
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(rules.patternMessage || `${field} tiene un formato inválido`);
      }

      // Enum (lista de valores permitidos)
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} debe ser uno de: ${rules.enum.join(', ')}`);
      }

      // Custom validator function
      if (rules.custom) {
        const customError = rules.custom(value, data);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Errores de validación',
        detalles: errors
      });
    }

    next();
  };
}

module.exports = { validate };
