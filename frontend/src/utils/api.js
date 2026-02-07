import { useState } from 'react';

// ✅ Usa variable de entorno con fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useApi() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const get = async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, { headers });
    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    return data;
  };

  const post = async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    return data;
  };

  const put = async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    return data;
  };

  const del = async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      ...(body && { body: JSON.stringify(body) })
    });
    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    return data;
  };

  return { token, login, logout, get, post, put, del };
}