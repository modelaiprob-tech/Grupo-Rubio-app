const crearAusenciaSchema = {
  trabajadorId: {
    required: true,
    type: 'number',
    min: 1
  },
  tipoAusenciaId: {
    required: true,
    type: 'number',
    min: 1
  },
  fechaInicio: {
    required: true,
    type: 'string',
    custom: (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'fechaInicio debe ser una fecha válida';
      }
      return null;
    }
  },
  fechaFin: {
    required: true,
    type: 'string',
    custom: (value, data) => {
      const inicio = new Date(data.fechaInicio);
      const fin = new Date(value);
      if (isNaN(fin.getTime())) {
        return 'fechaFin debe ser una fecha válida';
      }
      if (fin < inicio) {
        return 'fechaFin debe ser posterior a fechaInicio';
      }
      return null;
    }
  },
  motivo: {
    required: false,
    type: 'string',
    maxLength: 500
  }
};

const actualizarAusenciaSchema = {
  ...crearAusenciaSchema,
  fechaAltaReal: {
    required: false,
    type: 'string',
    custom: (value) => {
      if (!value) return null;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'fechaAltaReal debe ser una fecha válida';
      }
      return null;
    }
  },
  observaciones: {
    required: false,
    type: 'string',
    maxLength: 1000
  },
  numeroParte: {
    required: false,
    type: 'string',
    maxLength: 50
  }
};

module.exports = {
  crearAusenciaSchema,
  actualizarAusenciaSchema
};