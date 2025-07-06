/**
 * Scraping Service Abstraction Layer
 * Main entry point for the scraping service architecture
 */

// Core abstractions
export { ScrapingServiceProvider } from './ScrapingServiceProvider.js';
export { ScrapingOrchestrator } from './ScrapingOrchestrator.js';
export { ContactExtractor } from './ContactExtractor.js';

// Types and constants
export {
  PROVIDER_CAPABILITIES,
  SCRAPING_STATUS,
  CONFIDENCE_LEVELS,
  PROVIDER_TYPES,
  RETRY_STRATEGIES,
  CACHE_STRATEGIES,
  DEFAULT_CONFIG,
  ERROR_TYPES,
  TypeValidators
} from './types.js';

// Utility functions for quick access
export const ScrapingUtils = {
  /**
   * Create a new scraping orchestrator with providers
   * @param {Object} config - Configuration
   * @param {Array<ScrapingServiceProvider>} providers - Initial providers
   * @returns {ScrapingOrchestrator} - Configured orchestrator
   */
  createOrchestrator(config = {}, providers = []) {
    const orchestrator = new ScrapingOrchestrator(config);
    
    providers.forEach(provider => {
      orchestrator.registerProvider(provider);
    });
    
    return orchestrator;
  },

  /**
   * Create a contact extractor with custom rules
   * @param {Object} config - Configuration
   * @returns {ContactExtractor} - Configured extractor
   */
  createExtractor(config = {}) {
    return new ContactExtractor(config);
  },

  /**
   * Validate a provider configuration
   * @param {Object} config - Provider configuration
   * @returns {boolean} - Whether the configuration is valid
   */
  validateProviderConfig(config) {
    return TypeValidators.isProviderConfig(config);
  },

  /**
   * Create a standardized error for scraping operations
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {Error} - Standardized error
   */
  createScrapingError(type, message, details = {}) {
    const error = new Error(message);
    error.type = type;
    error.details = details;
    error.timestamp = new Date().toISOString();
    return error;
  }
};

// Default export for convenience
export default {
  ScrapingServiceProvider,
  ScrapingOrchestrator,
  ContactExtractor,
  ScrapingUtils,
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