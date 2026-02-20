export const getEstadoTrabajadores = (api, fecha) =>
  api.get(`/informes/estado-trabajadores?fecha=${fecha}`);

export const getHorasTrabajador = (api, trabajadorId, mes, año) =>
  api.get(`/informes/horas-trabajador?trabajadorId=${trabajadorId}&mes=${mes}&año=${año}`);

export const getHorasCliente = (api, clienteId, mes, año) =>
  api.get(`/informes/horas-cliente?clienteId=${clienteId}&mes=${mes}&año=${año}`);

export const getResumenAusencias = (api, mes, año) =>
  api.get(`/informes/resumen-ausencias?mes=${mes}&año=${año}`);

export const getCalendarioEmpresa = (api, clienteId, fechaInicio, fechaFin) =>
  api.get(`/informes/calendario-empresa?clienteId=${clienteId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
