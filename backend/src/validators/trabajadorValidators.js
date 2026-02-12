const dniPattern = /^\d{8}[A-Z]$/i;

const crearTrabajadorSchema = {
  dni: {
    required: true,
    type: 'string',
    pattern: dniPattern,
    patternMessage: 'DNI inválido. Debe ser 8 números + letra (ej: 12345678Z)'
  },
  nombre: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  apellidos: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 150
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
  categoriaId: {
    required: false,
    type: 'number',
    min: 1
  },
  tipoContrato: {
    required: false,
    type: 'string',
    maxLength: 50
  },
  horasContrato: {
    required: false,
    type: 'number',
    min: 0,
    max: 60
  },
  costeHora: {
    required: false,
    type: 'number',
    min: 0
  },
  diasVacacionesAnuales: {
    required: false,
    type: 'number',
    min: 0,
    max: 365
  },
  diasAsuntosPropios: {
    required: false,
    type: 'number',
    min: 0,
    max: 365
  },
  notas: {
    required: false,
    type: 'string',
    maxLength: 2000
  }
};

// Para update todo es opcional (excepto se valida DNI si se envía)
const actualizarTrabajadorSchema = {
  ...Object.fromEntries(
    Object.entries(crearTrabajadorSchema).map(([key, val]) => [key, { ...val, required: false }])
  )
};

const trabajadorCentroSchema = {
  trabajadorId: {
    required: true,
    type: 'number',
    min: 1
  },
  centroId: {
    required: true,
    type: 'number',
    min: 1
  }
};

module.exports = { crearTrabajadorSchema, actualizarTrabajadorSchema, trabajadorCentroSchema };
