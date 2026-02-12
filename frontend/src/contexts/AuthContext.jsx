import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useApiClient() {
  const { api } = useAuth();
  return api;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Build headers with current token
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }), [token]);

  // Generic request handler with 401 auto-logout
  const request = useCallback(async (method, endpoint, body) => {
    const options = {
      method,
      headers: getHeaders(),
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_URL}${endpoint}`, options);

    // Auto-logout on 401
    if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/me') {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw { error: 'Sesión expirada', status: 401 };
    }

    const data = await res.json();
    if (!res.ok) {
      throw data;
    }
    return data;
  }, [getHeaders]);

  // API methods
  const api = useMemo(() => ({
    get: (endpoint) => request('GET', endpoint),
    post: (endpoint, body) => request('POST', endpoint, body),
    put: (endpoint, body) => request('PUT', endpoint, body),
    del: (endpoint, body) => request('DELETE', endpoint, body),
    token,
  }), [request, token]);

  // Login
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const userData = await res.json();
            if (userData.id) {
              setUser(userData);
            }
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setChecking(false);
    };
    checkAuth();
  }, []); // Only on mount, not on token change

  const value = useMemo(() => ({
    user,
    token,
    checking,
    api,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'ADMIN',
  }), [user, token, checking, api, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
