export const getByTrabajador = (api, trabajadorId) =>
  api.get(`/horarios-fijos/trabajador/${trabajadorId}`);

export const crear = (api, data) => api.post('/horarios-fijos', data);

export const actualizar = (api, id, data) => api.put(`/horarios-fijos/${id}`, data);

export const eliminar = (api, id, data) => api.del(`/horarios-fijos/${id}`, data);

export const generarAsignaciones = (api, data) =>
  api.post('/horarios-fijos/generar-asignaciones', data);
