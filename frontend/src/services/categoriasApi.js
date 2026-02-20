export const getAll = (api) => api.get('/categorias');

export const crear = (api, data) => api.post('/categorias', data);

export const actualizar = (api, id, data) => api.put(`/categorias/${id}`, data);

export const eliminar = (api, id) => api.del(`/categorias/${id}`);
