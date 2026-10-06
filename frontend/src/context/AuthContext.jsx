import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('watchtogether_token') || null);
  const [loading, setLoading] = useState(true);

  // Check saved token on mount
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMeApi();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Auth verification token invalid or expired:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    verifyAuth();
  }, []);

  const handleLogin = async (email, password) => {
    const res = await loginApi(email, password);
    if (res.success && res.token) {
      localStorage.setItem('watchtogether_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.error || 'Login failed');
  };

  const handleRegister = async (username, email, password) => {
    const res = await registerApi(username, email, password);
    if (res.success && res.token) {
      localStorage.setItem('watchtogether_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.error || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('watchtogether_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login: handleLogin, register: handleRegister, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
