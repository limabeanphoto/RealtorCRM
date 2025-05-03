// utils/tokenRefresh.js
// Service to handle token refresh and authentication management

// Set token lifetime to 30 days (in seconds)
const TOKEN_LIFETIME = 30 * 24 * 60 * 60; // 30 days
// Set refresh threshold to 1 day before expiration (in seconds)
const REFRESH_THRESHOLD = 24 * 60 * 60; // 1 day

/**
 * Parse JWT token to get payload without validation
 * @param {string} token - JWT token
 * @returns {Object|null} Parsed token payload or null if invalid
 */
export const parseJwt = (token) => {
  try {
    // Split the token and get the payload part (second segment)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

/**
 * Check if a token needs to be refreshed based on expiration time
 * @param {string} token - JWT token
 * @returns {boolean} True if token needs refresh, false otherwise
 */
export const needsRefresh = (token) => {
  if (!token) return true;
  
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    
    // Calculate when the token should be refreshed (exp - REFRESH_THRESHOLD)
    const refreshTime = payload.exp - REFRESH_THRESHOLD;
    // Compare with current time
    const now = Math.floor(Date.now() / 1000);
    
    // Return true if current time is past the refresh time
    return now >= refreshTime;
  } catch (error) {
    console.error('Error checking token refresh:', error);
    return true;
  }
};

/**
 * Check if a token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return now >= payload.exp;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Refresh the auth token
 * @returns {Promise<boolean>} True if refresh successful, false otherwise
 */
export const refreshToken = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    // Call token refresh API
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // If refresh fails, clear token and return false
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
    
    const data = await response.json();
    
    if (data.success && data.data.token) {
      // Save the new token
      localStorage.setItem('token', data.data.token);
      return true;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

/**
 * Initialize authentication listener
 * Sets up periodic checks to refresh token before it expires
 */
export const initAuthListener = () => {
  // Check token immediately on initialization
  const checkAndRefreshToken = async () => {
    const token = localStorage.getItem('token');
    
    if (token && needsRefresh(token)) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        // If refresh failed and token is expired, redirect to login
        if (isTokenExpired(token)) {
          window.location.href = '/login';
        }
      }
    }
  };
  
  // Initial check
  checkAndRefreshToken();
  
  // Set up interval to check every hour
  const interval = setInterval(checkAndRefreshToken, 60 * 60 * 1000);
  
  // Return cleanup function
  return () => clearInterval(interval);
};

/**
 * Get token and refresh if needed before making API requests
 * @returns {Promise<string|null>} Valid token or null if unavailable
 */
export const getValidToken = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }
  
  // If token needs refresh, attempt to refresh it
  if (needsRefresh(token)) {
    const refreshed = await refreshToken();
    if (!refreshed) {
      if (isTokenExpired(token)) {
        return null;
      }
    }
    // Get the fresh token after refresh
    return localStorage.getItem('token');
  }
  
  return token;
};