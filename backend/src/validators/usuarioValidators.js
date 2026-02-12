const crearUsuarioSchema = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'email debe tener un formato válido',
    maxLength: 255
  },
  password: {
    required: true,
    type: 'string',
    minLength: 6,
    maxLength: 255
  },
  nombre: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  rol: {
    required: true,
    type: 'string',
    enum: ['ADMIN', 'GESTOR', 'VISUALIZADOR']
  }
};

const actualizarUsuarioSchema = {
  email: {
    required: false,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'email debe tener un formato válido',
    maxLength: 255
  },
  nombre: {
    required: false,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  rol: {
    required: false,
    type: 'string',
    enum: ['ADMIN', 'GESTOR', 'VISUALIZADOR']
  },
  password: {
    required: false,
    type: 'string',
    minLength: 6,
    maxLength: 255
  }
};

module.exports = { crearUsuarioSchema, actualizarUsuarioSchema };
