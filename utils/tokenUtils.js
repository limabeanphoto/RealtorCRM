// utils/tokenUtils.js
/**
 * Utility functions for handling JWT token expiration and cleanup
 * This module provides safe token management without breaking existing functionality
 */

/**
 * Decodes a JWT token to extract payload information
 * @param {string} token - The JWT token to decode
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export function decodeToken(token) {
    if (!token || typeof token !== 'string') {
      return null;
    }
  
    try {
      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
  
      // The payload is the second part (index 1)
      const payload = parts[1];
      
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      
      // Decode base64 and parse JSON
      const decodedPayload = JSON.parse(atob(paddedPayload));
      
      return decodedPayload;
    } catch (error) {
      console.warn('Failed to decode token:', error);
      return null;
    }
  }
  
  /**
   * Checks if a JWT token is expired
   * @param {string} token - The JWT token to check
   * @returns {boolean} - True if token is expired or invalid, false otherwise
   */
  export function isTokenExpired(token) {
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      // If we can't decode the token or it has no expiration, consider it expired
      return true;
    }
  
    // JWT exp is in seconds, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    
    return decoded.exp < currentTime;
  }
  
  /**
   * Gets the current token from localStorage
   * @returns {string|null} - The stored token or null if not found
   */
  export function getCurrentToken() {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      // Handle cases where localStorage might not be available
      console.warn('Failed to access localStorage:', error);
      return null;
    }
  }
  
  /**
   * Checks if the current stored token is expired
   * @returns {boolean} - True if current token is expired or doesn't exist
   */
  export function isCurrentTokenExpired() {
    const token = getCurrentToken();
    return isTokenExpired(token);
  }
  
  /**
   * Cleans up expired authentication data
   * This removes both token and user data from localStorage
   */
  export function cleanupExpiredAuth() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('Cleaned up expired authentication data');
    } catch (error) {
      console.warn('Failed to cleanup auth data:', error);
    }
  }
  
  /**
   * Gets the expiration time of the current token
   * @returns {Date|null} - Expiration date or null if token is invalid
   */
  export function getTokenExpiration() {
    const token = getCurrentToken();
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.exp) {
      return null;
    }
  
    // Convert from seconds to milliseconds
    return new Date(decoded.exp * 1000);
  }
  
  /**
   * Gets time remaining until token expires
   * @returns {number} - Milliseconds until expiration, or 0 if expired/invalid
   */
  export function getTimeUntilExpiration() {
    const expiration = getTokenExpiration();
    
    if (!expiration) {
      return 0;
    }
  
    const timeRemaining = expiration.getTime() - Date.now();
    return Math.max(0, timeRemaining);
  }
  
  /**
   * Checks if token will expire within a given timeframe
   * @param {number} minutesFromNow - Minutes to check ahead
   * @returns {boolean} - True if token expires within the timeframe
   */
  export function willTokenExpireSoon(minutesFromNow = 5) {
    const timeRemaining = getTimeUntilExpiration();
    const millisecondsThreshold = minutesFromNow * 60 * 1000;
    
    return timeRemaining <= millisecondsThreshold;
  }
  
  /**
   * Main function to check auth status and handle expired tokens
   * This is the primary function other components should use
   * @returns {Object} - Auth status information
   */
  export function checkAuthStatus() {
    const token = getCurrentToken();
    
    if (!token) {
      return {
        isAuthenticated: false,
        isExpired: true,
        token: null,
        shouldRedirect: true
      };
    }
  
    const expired = isTokenExpired(token);
    
    if (expired) {
      cleanupExpiredAuth();
      return {
        isAuthenticated: false,
        isExpired: true,
        token: null,
        shouldRedirect: true
      };
    }
  
    return {
      isAuthenticated: true,
      isExpired: false,
      token: token,
      shouldRedirect: false,
      expiresAt: getTokenExpiration(),
      timeRemaining: getTimeUntilExpiration()
    };
  }
  
  // Default export for convenience
  export default {
    decodeToken,
    isTokenExpired,
    getCurrentToken,
    isCurrentTokenExpired,
    cleanupExpiredAuth,
    getTokenExpiration,
    getTimeUntilExpiration,
    willTokenExpireSoon,
    checkAuthStatus
  };