export const getAll = (api) => api.get('/trabajadores');

export const getActivos = (api) => api.get('/trabajadores?activo=true');

export const getById = (api, id) => api.get(`/trabajadores/${id}`);

export const crear = (api, data) => api.post('/trabajadores', data);

export const actualizar = (api, id, data) => api.put(`/trabajadores/${id}`, data);

export const darBaja = (api, id, data) => api.put(`/trabajadores/${id}/dar-baja`, data);

export const reactivar = (api, id) => api.put(`/trabajadores/${id}/reactivar`);

export const vincularCentro = (api, data) => api.post('/trabajador-centro', data);

export const desvincularCentro = (api, relId) => api.del(`/trabajador-centro/${relId}`);
