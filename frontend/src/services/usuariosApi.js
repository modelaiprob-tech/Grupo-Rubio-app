export const getAll = (api) => api.get('/usuarios');

export const crear = (api, data) => api.post('/usuarios', data);

export const actualizar = (api, id, data) => api.put(`/usuarios/${id}`, data);

export const toggleActivo = (api, id) => api.put(`/usuarios/${id}/toggle-activo`);
