// utils/apiUtils.js
// Utilities for making authenticated API requests

import { getValidToken } from './tokenRefresh';

/**
 * Perform authenticated API request with automatic token refresh
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response data
 */
export const authFetch = async (url, options = {}) => {
  try {
    // Get a valid token (refreshed if needed)
    const token = await getValidToken();
    
    if (!token) {
      // No valid token available, handle this case
      if (typeof window !== 'undefined') {
        // We're in the browser
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
    
    // Set up headers with auth token
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };
    
    // Make the API request
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle various response statuses
    if (response.status === 401 || response.status === 403) {
      // Authentication error
      if (typeof window !== 'undefined') {
        // Clear storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error('Authentication failed');
    }
    
    if (!response.ok) {
      // Other API errors
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API error: ${response.status} ${response.statusText}`
      );
    }
    
    // Parse and return successful response
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
};

/**
 * Helper for GET requests
 * @param {string} url - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} API response data
 */
export const authGet = (url, options = {}) => {
  return authFetch(url, {
    method: 'GET',
    ...options
  });
};

/**
 * Helper for POST requests
 * @param {string} url - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} API response data
 */
export const authPost = (url, data, options = {}) => {
  return authFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
};

/**
 * Helper for PUT requests
 * @param {string} url - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} API response data
 */
export const authPut = (url, data, options = {}) => {
  return authFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  });
};

/**
 * Helper for DELETE requests
 * @param {string} url - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} API response data
 */
export const authDelete = (url, options = {}) => {
  return authFetch(url, {
    method: 'DELETE',
    ...options
  });
};