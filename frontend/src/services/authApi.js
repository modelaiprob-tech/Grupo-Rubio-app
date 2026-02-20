// Auth se maneja directamente en AuthContext (login, logout, checkAuth).
// Este fichero expone solo la llamada a /auth/me para uso externo si se necesita.

export const getMe = (api) => api.get('/auth/me');
