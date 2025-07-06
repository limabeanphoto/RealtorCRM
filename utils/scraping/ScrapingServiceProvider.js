/**
 * Abstract base class for scraping service providers
 * This defines the interface that all scraping providers must implement
 */

import { 
  PROVIDER_CAPABILITIES, 
  SCRAPING_STATUS, 
  CONFIDENCE_LEVELS, 
  ERROR_TYPES,
  DEFAULT_CONFIG 
} from './types.js';

/**
 * Abstract base class for all scraping service providers
 */
export class ScrapingServiceProvider {
  /**
   * Create a new scraping service provider
   * @param {ProviderConfig} config - Provider configuration
   */
  constructor(config) {
    if (this.constructor === ScrapingServiceProvider) {
      throw new Error('ScrapingServiceProvider is an abstract class and cannot be instantiated directly');
    }

    this.config = {
      name: config.name || 'unknown',
      type: config.type || 'custom',
      priority: config.priority || 1,
      rateLimit: config.rateLimit || DEFAULT_CONFIG.RATE_LIMIT,
      timeout: config.timeout || DEFAULT_CONFIG.TIMEOUT,
      enabled: config.enabled !== false,
      supportedDomains: config.supportedDomains || [],
      options: config.options || {},
      credentials: config.credentials || {},
      ...config
    };

    // Initialize usage metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      quotaUsed: 0,
      averageResponseTime: 0,
      lastRequest: null,
      lastSuccess: null,
      responseTimeHistory: []
    };

    // Rate limiting state
    this.rateLimitState = {
      requestCount: 0,
      windowStart: Date.now(),
      windowSize: 60000 // 1 minute
    };

    // Provider capabilities
    this.capabilities = new Set();
    
    // Initialize provider-specific setup
    this.initialize();
  }

  /**
   * Initialize the provider (to be implemented by subclasses)
   * @protected
   */
  initialize() {
    // Override in subclasses
  }

  /**
   * Get provider capabilities
   * @returns {Set<string>} - Set of capability strings
   */
  getCapabilities() {
    return this.capabilities;
  }

  /**
   * Check if provider has a specific capability
   * @param {string} capability - Capability to check
   * @returns {boolean} - Whether provider has the capability
   */
  hasCapability(capability) {
    return this.capabilities.has(capability);
  }

  /**
   * Add a capability to the provider
   * @param {string} capability - Capability to add
   * @protected
   */
  addCapability(capability) {
    this.capabilities.add(capability);
  }

  /**
   * Check if provider can handle a specific URL
   * @param {string} url - URL to check
   * @returns {boolean} - Whether provider can handle the URL
   */
  canHandle(url) {
    if (!this.config.enabled) {
      return false;
    }

    if (this.config.supportedDomains.length === 0) {
      return true; // Universal provider
    }

    try {
      const parsedUrl = new URL(url);
      return this.config.supportedDomains.some(domain => 
        parsedUrl.hostname.includes(domain)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if provider is within rate limits
   * @returns {boolean} - Whether provider can make another request
   */
  checkRateLimit() {
    const now = Date.now();
    const windowElapsed = now - this.rateLimitState.windowStart;

    // Reset window if it's been more than windowSize
    if (windowElapsed >= this.rateLimitState.windowSize) {
      this.rateLimitState.requestCount = 0;
      this.rateLimitState.windowStart = now;
    }

    return this.rateLimitState.requestCount < this.config.rateLimit;
  }

  /**
   * Increment rate limit counter
   * @protected
   */
  incrementRateLimit() {
    this.rateLimitState.requestCount++;
  }

  /**
   * Get current usage metrics
   * @returns {UsageMetrics} - Current usage metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Update metrics after a request
   * @param {boolean} success - Whether the request was successful
   * @param {number} duration - Request duration in milliseconds
   * @param {boolean} cacheHit - Whether this was a cache hit
   * @protected
   */
  updateMetrics(success, duration, cacheHit = false) {
    this.metrics.totalRequests++;
    this.metrics.lastRequest = new Date();

    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.lastSuccess = new Date();
    } else {
      this.metrics.failedRequests++;
    }

    if (cacheHit) {
      this.metrics.cacheHits++;
    }

    // Update average response time
    this.metrics.responseTimeHistory.push(duration);
    if (this.metrics.responseTimeHistory.length > 100) {
      this.metrics.responseTimeHistory.shift();
    }

    this.metrics.averageResponseTime = 
      this.metrics.responseTimeHistory.reduce((sum, time) => sum + time, 0) / 
      this.metrics.responseTimeHistory.length;
  }

  /**
   * Abstract method to scrape content from a URL
   * Must be implemented by subclasses
   * @param {ScrapingRequest} request - The scraping request
   * @param {ProgressCallback} onProgress - Progress callback
   * @returns {Promise<ScrapingResponse>} - The scraping response
   * @abstract
   */
  async scrape(request, onProgress = null) {
    throw new Error('scrape() method must be implemented by subclasses');
  }

  /**
   * Abstract method to extract contact data from HTML
   * Must be implemented by subclasses
   * @param {string} html - HTML content to extract from
   * @param {string} url - Original URL for context
   * @returns {Promise<ContactData>} - Extracted contact data
   * @abstract
   */
  async extractContactData(html, url) {
    throw new Error('extractContactData() method must be implemented by subclasses');
  }

  /**
   * Validate extracted contact data
   * @param {ContactData} data - Contact data to validate
   * @returns {boolean} - Whether the data is valid
   * @protected
   */
  validateContactData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = ['name', 'profileLink'];
    for (const field of requiredFields) {
      if (!data[field] || typeof data[field] !== 'string' || data[field].trim().length === 0) {
        return false;
      }
    }

    // At least one contact method should be present
    const contactMethods = ['phone', 'email'];
    const hasContactMethod = contactMethods.some(method => 
      data[method] && typeof data[method] === 'string' && data[method].trim().length > 0
    );

    return hasContactMethod;
  }

  /**
   * Calculate confidence score for extracted data
   * @param {ContactData} data - Contact data to score
   * @returns {number} - Confidence score (0-100)
   * @protected
   */
  calculateConfidence(data) {
    if (!data) return 0;

    let score = 0;
    const weights = {
      name: 30,
      phone: 25,
      email: 20,
      company: 15,
      description: 10
    };

    // Add points for each field present
    Object.entries(weights).forEach(([field, weight]) => {
      if (data[field] && typeof data[field] === 'string' && data[field].trim().length > 0) {
        score += weight;
      }
    });

    // Bonus points for specific quality indicators
    if (data.phone && /^\(\d{3}\) \d{3}-\d{4}$/.test(data.phone)) {
      score += 5; // Well-formatted phone number
    }

    if (data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      score += 5; // Valid email format
    }

    if (data.description && data.description.length > 50) {
      score += 5; // Substantial description
    }

    return Math.min(score, 100);
  }

  /**
   * Handle provider-specific errors
   * @param {Error} error - The error that occurred
   * @param {string} context - Context where the error occurred
   * @returns {Error} - Processed error with additional context
   * @protected
   */
  handleError(error, context = '') {
    const errorMessage = `${this.config.name} Provider Error${context ? ` (${context})` : ''}: ${error.message}`;
    
    // Determine error type
    let errorType = ERROR_TYPES.UNKNOWN_ERROR;
    
    if (error.message.includes('timeout')) {
      errorType = ERROR_TYPES.TIMEOUT_ERROR;
    } else if (error.message.includes('rate limit')) {
      errorType = ERROR_TYPES.RATE_LIMIT_ERROR;
    } else if (error.message.includes('network')) {
      errorType = ERROR_TYPES.NETWORK_ERROR;
    } else if (error.message.includes('validation')) {
      errorType = ERROR_TYPES.VALIDATION_ERROR;
    }

    const processedError = new Error(errorMessage);
    processedError.type = errorType;
    processedError.provider = this.config.name;
    processedError.originalError = error;
    
    return processedError;
  }

  /**
   * Create a standardized response object
   * @param {boolean} success - Whether the operation was successful
   * @param {ContactData|null} data - The extracted data
   * @param {Error|null} error - Any error that occurred
   * @param {number} duration - Operation duration in milliseconds
   * @param {Object} additionalMetadata - Additional metadata
   * @returns {ScrapingResponse} - Standardized response
   * @protected
   */
  createResponse(success, data = null, error = null, duration = 0, additionalMetadata = {}) {
    const confidence = success && data ? this.calculateConfidence(data) : 0;
    
    return {
      success,
      data,
      confidence,
      provider: this.config.name,
      duration,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: 'RealtorCRM-ScrapingService/1.0',
        providersAttempted: [this.config.name],
        totalAttempts: 1,
        cacheHit: false,
        performance: {
          duration,
          confidence,
          provider: this.config.name
        },
        ...additionalMetadata
      },
      error
    };
  }

  /**
   * Get provider status and health information
   * @returns {Object} - Provider status
   */
  getStatus() {
    const now = Date.now();
    const isHealthy = this.config.enabled && 
                     this.checkRateLimit() && 
                     (!this.metrics.lastRequest || now - this.metrics.lastRequest.getTime() < 300000); // 5 minutes

    return {
      name: this.config.name,
      type: this.config.type,
      enabled: this.config.enabled,
      healthy: isHealthy,
      capabilities: Array.from(this.capabilities),
      metrics: this.getMetrics(),
      rateLimit: {
        current: this.rateLimitState.requestCount,
        limit: this.config.rateLimit,
        windowStart: this.rateLimitState.windowStart,
        windowSize: this.rateLimitState.windowSize
      }
    };
  }

  /**
   * Test the provider connectivity and functionality
   * @returns {Promise<boolean>} - Whether the provider is working
   */
  async testConnection() {
    // Default implementation - can be overridden by subclasses
    return this.config.enabled;
  }

  /**
   * Cleanup resources when provider is no longer needed
   */
  async cleanup() {
    // Override in subclasses if needed
  }
}

export default ScrapingServiceProvider;