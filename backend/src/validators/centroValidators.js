const timePattern = /^\d{2}:\d{2}$/;

const crearCentroSchema = {
  nombre: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 200
  },
  clienteId: {
    required: true,
    type: 'number',
    min: 1
  },
  direccion: {
    required: false,
    type: 'string',
    maxLength: 255
  },
  horarioApertura: {
    required: false,
    type: 'string',
    pattern: timePattern,
    patternMessage: 'horarioApertura debe tener formato HH:MM'
  },
  horarioCierre: {
    required: false,
    type: 'string',
    pattern: timePattern,
    patternMessage: 'horarioCierre debe tener formato HH:MM'
  },
  tipoHorarioLimpieza: {
    required: false,
    type: 'string',
    enum: ['FIJO', 'FLEXIBLE']
  }
};

const actualizarCentroSchema = {
  nombre: {
    required: false,
    type: 'string',
    minLength: 2,
    maxLength: 200
  },
  direccion: {
    required: false,
    type: 'string',
    maxLength: 255
  },
  horarioApertura: {
    required: false,
    type: 'string',
    pattern: timePattern,
    patternMessage: 'horarioApertura debe tener formato HH:MM'
  },
  horarioCierre: {
    required: false,
    type: 'string',
    pattern: timePattern,
    patternMessage: 'horarioCierre debe tener formato HH:MM'
  },
  tipoHorarioLimpieza: {
    required: false,
    type: 'string',
    enum: ['FIJO', 'FLEXIBLE']
  }
};

module.exports = { crearCentroSchema, actualizarCentroSchema };
