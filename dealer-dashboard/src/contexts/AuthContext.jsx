import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('stl_token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('stl_token', token);
      fetchUser();
    } else {
      localStorage.removeItem('stl_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.dealer);
    } catch (err) {
      console.error('Failed to fetch user', err);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.dealer);
      return res.data;
    }
    throw new Error(res.data.error || 'Login failed');
  };

  const register = async (data) => {
    const res = await axios.post(`${API_URL}/auth/register`, data);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.dealer);
      return res.data;
    }
    throw new Error(res.data.error || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
