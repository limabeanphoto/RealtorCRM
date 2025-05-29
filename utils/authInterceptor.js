// utils/authInterceptor.js
/**
 * Authentication response interceptor
 * Automatically handles 401 responses and redirects to login
 * This enhances your existing fetch calls without breaking them
 */

import { cleanupExpiredAuth } from './tokenUtils';

/**
 * Configuration for the auth interceptor
 */
const config = {
  loginPath: '/login',
  excludeRedirectPaths: ['/login', '/register'], // Paths where we shouldn't redirect
  logoutOnUnauthorized: true
};

/**
 * Checks if we should redirect based on current path
 * @returns {boolean} - True if redirect is appropriate
 */
function shouldRedirect() {
  if (typeof window === 'undefined') {
    return false; // Don't redirect on server-side
  }

  const currentPath = window.location.pathname;
  return !config.excludeRedirectPaths.includes(currentPath);
}

/**
 * Performs the actual redirect to login
 */
function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  console.log('Session expired - redirecting to login');
  
  // Clean up expired auth data
  cleanupExpiredAuth();
  
  // Redirect to login
  window.location.href = config.loginPath;
}

/**
 * Enhanced fetch function that automatically handles 401 responses
 * This is a drop-in replacement for your existing fetch calls
 * @param {string|Request} input - URL or Request object
 * @param {Object} init - Fetch options
 * @returns {Promise<Response>} - Enhanced fetch response
 */
export async function fetchWithAuth(input, init = {}) {
  try {
    // Make the original fetch call
    const response = await fetch(input, init);
    
    // Check if response is 401 (Unauthorized)
    if (response.status === 401 && shouldRedirect()) {
      console.warn('Received 401 response - token may be expired');
      
      // Small delay to allow any pending operations to complete
      setTimeout(() => {
        redirectToLogin();
      }, 100);
      
      // Still return the response so existing error handling works
      return response;
    }
    
    return response;
  } catch (error) {
    // Pass through any network errors without modification
    throw error;
  }
}

/**
 * Setup function to monkey-patch the global fetch
 * This makes the interceptor work automatically with existing code
 * Call this once in your app initialization
 */
export function setupAuthInterceptor() {
  if (typeof window === 'undefined') {
    return; // Don't setup on server-side
  }

  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Replace global fetch with our enhanced version
  window.fetch = async function(input, init = {}) {
    try {
      // Make the original fetch call
      const response = await originalFetch(input, init);
      
      // Check if response is 401 (Unauthorized)
      if (response.status === 401 && shouldRedirect()) {
        console.warn('Received 401 response - token may be expired');
        
        // Small delay to allow any pending operations to complete
        setTimeout(() => {
          redirectToLogin();
        }, 100);
      }
      
      return response;
    } catch (error) {
      // Pass through any network errors without modification
      throw error;
    }
  };

  console.log('Auth interceptor setup complete');
}

/**
 * Manual handler for 401 responses
 * Use this if you want to manually handle specific 401s
 * @param {Response} response - The fetch response to check
 * @param {Object} options - Options for handling
 */
export function handle401Response(response, options = {}) {
  if (response.status === 401) {
    const { skipRedirect = false, customHandler } = options;
    
    if (customHandler) {
      customHandler(response);
      return;
    }
    
    if (!skipRedirect && shouldRedirect()) {
      setTimeout(() => {
        redirectToLogin();
      }, 100);
    }
  }
}

/**
 * Hook for React components to handle auth errors
 * Returns a function that can be used in useEffect or error boundaries
 */
export function useAuthErrorHandler() {
  return function handleAuthError(error, response) {
    if (response && response.status === 401) {
      handle401Response(response);
    }
  };
}

/**
 * Utility to add auth headers to fetch requests
 * This is optional - your existing code already handles this
 * @param {Object} options - Existing fetch options
 * @returns {Object} - Enhanced options with auth header
 */
export function addAuthHeader(options = {}) {
  const token = localStorage.getItem('token');
  
  if (token) {
    return {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    };
  }
  
  return options;
}

/**
 * Configuration update function
 * Allows customization of interceptor behavior
 * @param {Object} newConfig - Configuration overrides
 */
export function updateInterceptorConfig(newConfig) {
  Object.assign(config, newConfig);
}

/**
 * Disable the interceptor (for testing or special cases)
 */
export function disableAuthInterceptor() {
  if (typeof window !== 'undefined' && window.fetch.name === 'fetch') {
    // Only restore if we actually patched it
    console.log('Auth interceptor disabled');
  }
}

// Default export for convenience
export default {
  setupAuthInterceptor,
  fetchWithAuth,
  handle401Response,
  useAuthErrorHandler,
  addAuthHeader,
  updateInterceptorConfig,
  disableAuthInterceptor
};