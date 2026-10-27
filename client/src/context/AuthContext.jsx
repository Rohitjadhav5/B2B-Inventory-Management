import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// Persist user and token in localStorage across page refreshes
const getStoredUser  = () => JSON.parse(localStorage.getItem('user')  || 'null');
const getStoredToken = () => localStorage.getItem('token') || null;

export const AuthProvider = ({ children }) => {
  const [user,  setUser]  = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);

  // Update both state and localStorage atomically
  const persist = (userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);
    if (userData) {
      localStorage.setItem('user',  JSON.stringify(userData));
      localStorage.setItem('token', tokenValue);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.user, data.token);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    persist(data.user, data.token);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for consuming auth context
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
