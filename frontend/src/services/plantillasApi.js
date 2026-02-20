export const getAll = (api) => api.get('/plantillas');

export const crearDesdeSemana = (api, data) =>
  api.post('/plantillas/crear-desde-semana', data);

export const aplicar = (api, id, data) =>
  api.post(`/plantillas/${id}/aplicar`, data);

export const eliminar = (api, id) => api.del(`/plantillas/${id}`);
