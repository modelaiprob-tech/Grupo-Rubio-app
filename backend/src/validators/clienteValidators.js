const cifPattern = /^[A-Z]\d{7,8}[A-Z0-9]$/i;

const crearClienteSchema = {
  nombre: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 200
  },
  cif: {
    required: true,
    type: 'string',
    pattern: cifPattern,
    patternMessage: 'CIF inválido. Debe ser letra + 7-8 números + número/letra (ej: B12345678)'
  },
  direccion: {
    required: false,
    type: 'string',
    maxLength: 255
  },
  codigoPostal: {
    required: false,
    type: 'string',
    maxLength: 10
  },
  localidad: {
    required: false,
    type: 'string',
    maxLength: 100
  },
  provincia: {
    required: false,
    type: 'string',
    maxLength: 100
  },
  telefono: {
    required: false,
    type: 'string',
    maxLength: 20
  },
  email: {
    required: false,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'email debe tener un formato válido',
    maxLength: 255
  },
  contactoNombre: {
    required: false,
    type: 'string',
    maxLength: 100
  },
  contactoTelefono: {
    required: false,
    type: 'string',
    maxLength: 20
  },
  contactoEmail: {
    required: false,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'contactoEmail debe tener un formato válido',
    maxLength: 255
  },
  tipoCliente: {
    required: false,
    type: 'string',
    maxLength: 50
  },
  notas: {
    required: false,
    type: 'string',
    maxLength: 2000
  }
};

module.exports = { crearClienteSchema };
