const loginSchema = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'email debe tener un formato válido (ej: usuario@dominio.com)',
    maxLength: 255
  },
  password: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255
  }
};

module.exports = { loginSchema };
