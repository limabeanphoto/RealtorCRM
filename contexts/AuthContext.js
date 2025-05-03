// contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { refreshToken, isTokenExpired, initAuthListener } from '../utils/tokenRefresh';

// Create the auth context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshAuth: async () => {},
});

// AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        
        // Check if we have both token and user data
        if (token && userData) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            // Try to refresh token
            const refreshed = await refreshToken();
            if (!refreshed) {
              // Clear data if refresh failed
              setUser(null);
              return;
            }
          }
          
          // Set user data from localStorage
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
    
    // Set up auth listener for auto refresh
    const cleanupListener = initAuthListener();
    
    // Clean up auth listener on unmount
    return cleanupListener;
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        // Save token and user data
        localStorage.setItem('token', data.data.token);
        
        // Save user data without token
        const { token, ...userData } = data.data;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setUser(userData);
        return { success: true };
      }
      
      return { 
        success: false, 
        message: data.message || 'Login failed' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Login failed due to an error' 
      };
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear state
    setUser(null);
    
    // Redirect to login
    router.push('/login');
  };

  // Refresh auth state function
  const refreshAuth = async () => {
    try {
      const refreshed = await refreshToken();
      
      if (refreshed) {
        // Update user data after refresh
        const userData = JSON.parse(localStorage.getItem('user') || 'null');
        if (userData) {
          setUser(userData);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      return false;
    }
  };

  // Compute derived state
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  // Context value
  const value = {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export the context for consumers
export default AuthContext;