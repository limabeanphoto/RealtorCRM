/**
 * TypeScript-style interfaces and types for the scraping system
 * These JSDoc comments provide type definitions for the scraping service architecture
 */

/**
 * @typedef {Object} ScrapingRequest
 * @property {string} url - The URL to scrape
 * @property {Object} options - Provider-specific options
 * @property {string} provider - Preferred provider name (optional)
 * @property {number} timeout - Request timeout in milliseconds
 * @property {boolean} retries - Whether to enable retry logic
 * @property {Object} metadata - Additional metadata for the request
 */

/**
 * @typedef {Object} ScrapingResponse
 * @property {boolean} success - Whether the scraping was successful
 * @property {ContactData|null} data - The extracted contact data
 * @property {number} confidence - Confidence score (0-100)
 * @property {string} provider - Provider that was used
 * @property {number} duration - Time taken in milliseconds
 * @property {ScrapingMetadata} metadata - Additional metadata
 * @property {Error|null} error - Error if scraping failed
 */

/**
 * @typedef {Object} ContactData
 * @property {string} name - Full name
 * @property {string} company - Company/brokerage name
 * @property {string} phone - Phone number
 * @property {string} email - Email address
 * @property {string} description - Bio/description
 * @property {string} profilePicture - Profile picture URL
 * @property {string} profileLink - Original profile URL
 * @property {Object} socialLinks - Social media links
 * @property {string} title - Professional title
 * @property {string} location - Location/address
 * @property {Array<string>} specialties - Areas of expertise
 * @property {ContactConfidence} confidence - Field-level confidence scores
 */

/**
 * @typedef {Object} ContactConfidence
 * @property {number} name - Confidence score for name (0-100)
 * @property {number} company - Confidence score for company (0-100)
 * @property {number} phone - Confidence score for phone (0-100)
 * @property {number} email - Confidence score for email (0-100)
 * @property {number} overall - Overall confidence score (0-100)
 */

/**
 * @typedef {Object} ScrapingMetadata
 * @property {string} timestamp - ISO timestamp of the scraping
 * @property {string} userAgent - User agent used for scraping
 * @property {Array<string>} providersAttempted - List of providers attempted
 * @property {number} totalAttempts - Total number of attempts made
 * @property {boolean} cacheHit - Whether the result was from cache
 * @property {Object} performance - Performance metrics
 */

/**
 * @typedef {Object} ProviderConfig
 * @property {string} name - Provider name
 * @property {string} type - Provider type ('api', 'selenium', 'ai')
 * @property {number} priority - Priority level (1-10, higher is better)
 * @property {number} rateLimit - Requests per minute limit
 * @property {number} timeout - Default timeout in milliseconds
 * @property {Object} credentials - API credentials
 * @property {boolean} enabled - Whether the provider is enabled
 * @property {Array<string>} supportedDomains - Domains this provider can handle
 * @property {Object} options - Provider-specific options
 */

/**
 * @typedef {Object} UsageMetrics
 * @property {number} totalRequests - Total requests made
 * @property {number} successfulRequests - Successful requests
 * @property {number} failedRequests - Failed requests
 * @property {number} cacheHits - Cache hits
 * @property {number} quotaUsed - Quota used (for API providers)
 * @property {number} averageResponseTime - Average response time in ms
 * @property {Date} lastRequest - Timestamp of last request
 * @property {Date} lastSuccess - Timestamp of last successful request
 */

/**
 * @typedef {Object} RetryConfig
 * @property {number} maxAttempts - Maximum retry attempts
 * @property {number} baseDelay - Base delay in milliseconds
 * @property {number} maxDelay - Maximum delay in milliseconds
 * @property {string} strategy - Retry strategy ('fixed', 'exponential', 'linear')
 * @property {Array<number>} retriableStatusCodes - HTTP status codes to retry on
 * @property {Array<string>} retriableErrors - Error types to retry on
 */

/**
 * @typedef {Object} CacheConfig
 * @property {boolean} enabled - Whether caching is enabled
 * @property {number} ttl - Time to live in seconds
 * @property {string} strategy - Cache strategy ('memory', 'redis', 'file')
 * @property {number} maxSize - Maximum cache size
 * @property {string} keyPrefix - Prefix for cache keys
 */

/**
 * @typedef {Object} ProgressCallback
 * @property {function(ProgressUpdate): void} onProgress - Progress callback function
 */

/**
 * @typedef {Object} ProgressUpdate
 * @property {string} stage - Current stage of scraping
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} message - Human-readable progress message
 * @property {Object} details - Stage-specific details
 */

/**
 * @typedef {Object} ExtractionRule
 * @property {string} field - Field name to extract
 * @property {Array<string>} selectors - CSS selectors to try
 * @property {string} attribute - Attribute to extract (default: 'text')
 * @property {function} transform - Transform function for the extracted value
 * @property {boolean} required - Whether this field is required
 * @property {RegExp} validation - Validation regex pattern
 * @property {number} confidence - Base confidence score for this extraction
 */

/**
 * @typedef {Object} ExtractionStrategy
 * @property {string} name - Strategy name
 * @property {Array<ExtractionRule>} rules - Extraction rules
 * @property {function} validator - Custom validation function
 * @property {number} priority - Strategy priority
 */

/**
 * Provider capability flags
 */
export const PROVIDER_CAPABILITIES = {
  JAVASCRIPT_RENDERING: 'javascript_rendering',
  PROXY_SUPPORT: 'proxy_support',
  RATE_LIMITING: 'rate_limiting',
  CACHING: 'caching',
  MOBILE_EMULATION: 'mobile_emulation',
  CAPTCHA_SOLVING: 'captcha_solving',
  CUSTOM_HEADERS: 'custom_headers',
  COOKIES: 'cookies',
  SESSION_MANAGEMENT: 'session_management',
  STRUCTURED_DATA: 'structured_data',
  AI_EXTRACTION: 'ai_extraction',
  AI_VISION: 'ai_vision',
  STRUCTURED_EXTRACTION: 'structured_extraction',
  CONFIDENCE_SCORING: 'confidence_scoring',
  SCREENSHOT_ANALYSIS: 'screenshot_analysis',
  COST_TRACKING: 'cost_tracking'
};

/**
 * Scraping result status codes
 */
export const SCRAPING_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  RATE_LIMITED: 'rate_limited',
  BLOCKED: 'blocked',
  INVALID_URL: 'invalid_url',
  NO_DATA: 'no_data',
  QUOTA_EXCEEDED: 'quota_exceeded',
  PROVIDER_ERROR: 'provider_error',
  VALIDATION_FAILED: 'validation_failed'
};

/**
 * Extraction confidence levels
 */
export const CONFIDENCE_LEVELS = {
  VERY_LOW: 0,
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  VERY_HIGH: 90,
  PERFECT: 100
};

/**
 * Provider types
 */
export const PROVIDER_TYPES = {
  API: 'api',
  SELENIUM: 'selenium',
  PUPPETEER: 'puppeteer',
  AI: 'ai',
  AI_VISION: 'ai-vision',
  CUSTOM: 'custom'
};

/**
 * Retry strategies
 */
export const RETRY_STRATEGIES = {
  FIXED: 'fixed',
  EXPONENTIAL: 'exponential',
  LINEAR: 'linear',
  CUSTOM: 'custom'
};

/**
 * Cache strategies
 */
export const CACHE_STRATEGIES = {
  MEMORY: 'memory',
  REDIS: 'redis',
  FILE: 'file',
  NONE: 'none'
};

/**
 * Default configurations
 */
export const DEFAULT_CONFIG = {
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 3600,
  RATE_LIMIT: 60,
  CONFIDENCE_THRESHOLD: 50
};

/**
 * Error types
 */
export const ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  VALIDATION_ERROR: 'validation_error',
  PROVIDER_ERROR: 'provider_error',
  EXTRACTION_ERROR: 'extraction_error',
  CONFIGURATION_ERROR: 'configuration_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  API_ERROR: 'api_error',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * Utility functions for type validation
 */
export const TypeValidators = {
  /**
   * Validates a scraping request object
   * @param {any} obj - Object to validate
   * @returns {boolean} - Whether the object is a valid ScrapingRequest
   */
  isScrapingRequest: (obj) => {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.url === 'string' && 
           obj.url.length > 0;
  },

  /**
   * Validates a contact data object
   * @param {any} obj - Object to validate
   * @returns {boolean} - Whether the object is valid ContactData
   */
  isContactData: (obj) => {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.name === 'string' && 
           typeof obj.profileLink === 'string';
  },

  /**
   * Validates a provider config object
   * @param {any} obj - Object to validate
   * @returns {boolean} - Whether the object is a valid ProviderConfig
   */
  isProviderConfig: (obj) => {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.name === 'string' && 
           typeof obj.type === 'string' && 
           Object.values(PROVIDER_TYPES).includes(obj.type);
  },

  /**
   * Validates a confidence score
   * @param {any} score - Score to validate
   * @returns {boolean} - Whether the score is valid
   */
  isValidConfidence: (score) => {
    return typeof score === 'number' && score >= 0 && score <= 100;
  }
};

export default {
  PROVIDER_CAPABILITIES,
  SCRAPING_STATUS,
  CONFIDENCE_LEVELS,
  PROVIDER_TYPES,
  RETRY_STRATEGIES,
  CACHE_STRATEGIES,
  DEFAULT_CONFIG,
  ERROR_TYPES,
  TypeValidators
};