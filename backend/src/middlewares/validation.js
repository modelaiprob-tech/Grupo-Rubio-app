function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} es obligatorio`);
        continue;
      }

      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`${field} debe ser de tipo ${rules.type}`);
          continue;
        }
      }

      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} debe ser mayor o igual a ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} debe ser menor o igual a ${rules.max}`);
        }
      }

      if (rules.type === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`${field} debe tener al menos ${rules.minLength} caracteres`);
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`${field} debe tener máximo ${rules.maxLength} caracteres`);
        }
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} tiene un formato inválido`);
      }

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
