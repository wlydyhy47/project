import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { validateToken, refreshToken } from '../services/api'; // ✅ إضافة validateToken و refreshToken
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        // ✅ استخدام validateToken المستوردة من api
        const isValid = await validateToken();
        
        if (isValid) {
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            try {
              const response = await api.get('/users/me');
              const userData = response.data.data || response.data;
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              setIsAuthenticated(true);
            } catch (error) {
              console.error('Failed to fetch user data:', error);
              logout();
            }
          }
        } else {
          // ✅ محاولة تجديد التوكن
          try {
            await refreshToken();
            const response = await api.get('/users/me');
            const userData = response.data.data || response.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setIsAuthenticated(true);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            logout();
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login/complete', credentials);
      
      const responseData = response.data;
      
      if (responseData.success) {
        const { accessToken, refreshToken: newRefreshToken, user } = responseData.data;
        
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        localStorage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        toast.success(responseData.message || 'تم تسجيل الدخول بنجاح');
        
        return { success: true, user };
      } else {
        throw new Error(responseData.message || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.data?.message || 
                          error.message || 
                          'فشل تسجيل الدخول';
      
      toast.error(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setUser(null);
      setIsAuthenticated(false);
      
      toast.success('تم تسجيل الخروج بنجاح');
      window.location.href = '/login';
    }
  };

  const hasPermission = (requiredRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      'admin': 4,
      'restaurant_owner': 3,
      'driver': 2,
      'client': 1
    };
    
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};