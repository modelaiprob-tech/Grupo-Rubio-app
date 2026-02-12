const timePattern = /^\d{2}:\d{2}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const crearAsignacionSchema = {
  trabajadorId: {
    required: true,
    type: 'number',
    min: 1
  },
  centroId: {
    required: true,
    type: 'number',
    min: 1
  },
  fecha: {
    required: true,
    type: 'string',
    pattern: datePattern,
    patternMessage: 'fecha debe tener formato YYYY-MM-DD',
    custom: (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'fecha debe ser una fecha válida';
      }
      return null;
    }
  },
  horaInicio: {
    required: true,
    type: 'string',
    pattern: timePattern,
    patternMessage: 'horaInicio debe tener formato HH:MM'
  },
  horaFin: {
    required: true,
    type: 'string',
    pattern: timePattern,
    patternMessage: 'horaFin debe tener formato HH:MM'
  },
  tipoServicio: {
    required: false,
    type: 'string',
    maxLength: 50
  },
  notas: {
    required: false,
    type: 'string',
    maxLength: 500
  }
};

const copiarSemanaSchema = {
  fechaOrigenInicio: {
    required: true,
    type: 'string',
    pattern: datePattern,
    patternMessage: 'fechaOrigenInicio debe tener formato YYYY-MM-DD'
  },
  fechaOrigenFin: {
    required: true,
    type: 'string',
    pattern: datePattern,
    patternMessage: 'fechaOrigenFin debe tener formato YYYY-MM-DD'
  },
  fechaDestinoInicio: {
    required: true,
    type: 'string',
    pattern: datePattern,
    patternMessage: 'fechaDestinoInicio debe tener formato YYYY-MM-DD'
  }
};

module.exports = { crearAsignacionSchema, copiarSemanaSchema };
