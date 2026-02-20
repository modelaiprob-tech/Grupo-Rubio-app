export const getByFiltros = (api, params) => api.get(`/asignaciones?${params}`);

export const crear = (api, data) => api.post('/asignaciones', data);

export const eliminar = (api, id) => api.del(`/asignaciones/${id}`);

export const copiarSemana = (api, data) => api.post('/asignaciones/copiar-semana', data);
