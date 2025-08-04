// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { authApi } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is authenticated on component mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await authApi.getCurrentUser();
                if (response.success) {
                    setUser(response.data);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Register a new user
    const register = async (userData) => {
        setLoading(true);
        const response = await authApi.register(userData);

        if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
            setError(null);
        } else {
            setError(response.error);
        }

        setLoading(false);
        return response;
    };

    // Login user
    const login = async (credentials) => {
        setLoading(true);
        const response = await authApi.login(credentials);

        if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
            setError(null);
        } else {
            setError(response.error);
        }

        setLoading(false);
        return response;
    };

    // Logout user
    const logout = () => {
        authApi.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    // Clear error state
    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                loading,
                error,
                register,
                login,
                logout,
                clearError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};