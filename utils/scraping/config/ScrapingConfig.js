/**
 * Comprehensive Scraping Configuration Management
 * 
 * This configuration manager provides:
 * - Centralized provider configuration
 * - Environment-specific settings
 * - Dynamic configuration updates
 * - Configuration validation
 * - Default configurations for all providers
 * - Best practice configurations
 * - Development vs Production settings
 * 
 * Features:
 * - Smart defaults for all providers
 * - Environment-based configuration
 * - Configuration validation and sanitization
 * - Performance optimization settings
 * - Cost optimization configurations
 * - Security and rate limiting settings
 */

import { PROVIDER_TYPES, ERROR_TYPES, RETRY_STRATEGIES, DEFAULT_CONFIG } from '../types.js';

/**
 * Comprehensive scraping configuration manager
 */
export class ScrapingConfig {
  /**
   * Create a new scraping configuration manager
   * @param {Object} config - Initial configuration
   */
  constructor(config = {}) {
    this.environment = config.environment || process.env.NODE_ENV || 'development';
    this.configs = new Map();
    this.globalConfig = {};
    this.validationRules = new Map();
    
    // Initialize default configurations
    this.initializeDefaults();
    
    // Apply environment-specific overrides
    this.applyEnvironmentOverrides();
    
    // Apply user configuration
    if (config) {
      this.updateConfiguration(config);
    }
    
    // Validate final configuration
    this.validateConfiguration();
  }

  /**
   * Initialize default configurations for all providers and orchestrator
   * @private
   */
  initializeDefaults() {
    // Global orchestrator configuration
    this.globalConfig = {
      orchestrator: {
        retryConfig: {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          strategy: RETRY_STRATEGIES.EXPONENTIAL,
          retriableStatusCodes: [429, 500, 502, 503, 504],
          retriableErrors: [
            ERROR_TYPES.NETWORK_ERROR,
            ERROR_TYPES.TIMEOUT_ERROR,
            ERROR_TYPES.RATE_LIMIT_ERROR
          ]
        },
        cacheConfig: {
          enabled: true,
          ttl: 3600, // 1 hour
          maxSize: 1000,
          keyPrefix: 'scraping:'
        },
        confidenceThreshold: 70,
        aiConfidenceThreshold: 75,
        minConfidenceForSuccess: 60,
        parallelProviders: false,
        timeout: 30000,
        costTracking: {
          enabled: true,
          dailyBudget: 10,
          monthlyBudget: 100,
          warningThreshold: 0.8,
          stopOnBudgetExceeded: true
        },
        providerStrategy: {
          useSmartFallback: true,
          adaptiveTimeout: true,
          costOptimization: true,
          performanceOptimization: true
        },
        progressReporting: {
          enabled: true,
          detailedCallbacks: true,
          performanceMetrics: true
        }
      },

      usageTracker: {
        budgets: {
          daily: 10,
          weekly: 50,
          monthly: 200,
          yearly: 2000
        },
        alerts: {
          warning: 0.8,
          critical: 0.95,
          quotaWarning: 0.9,
          stopOnBudgetExceeded: true
        },
        tracking: {
          enabled: true,
          detailedMetrics: true,
          historicalData: true,
          maxHistoryDays: 365,
          aggregationIntervals: ['hour', 'day', 'week', 'month']
        },
        notifications: {
          enabled: false,
          email: null,
          webhook: null,
          slack: null
        }
      }
    };

    // ScraperAPI provider configuration
    this.configs.set('ScraperAPI', {
      name: 'ScraperAPI',
      type: PROVIDER_TYPES.API,
      priority: 8,
      rateLimit: 100,
      timeout: 30000,
      enabled: true,
      supportedDomains: ['realtor.com', '*.realtor.com'],
      credentials: {
        apiKey: process.env.SCRAPERAPI_KEY || null,
        baseUrl: 'http://api.scraperapi.com'
      },
      options: {
        render: true,
        keepHeaders: true,
        countryCode: 'us',
        premium: false,
        deviceType: 'desktop',
        autoparse: false
      },
      quotas: {
        monthly: 5000,
        daily: 200
      },
      costPerRequest: 0.001,
      fallbackEnabled: true,
      fallbackPriority: 1
    });

    // Gemini provider configuration
    this.configs.set('gemini-flash', {
      name: 'gemini-flash',
      type: PROVIDER_TYPES.AI_VISION,
      priority: 6,
      rateLimit: 60,
      timeout: 8000,
      enabled: true,
      supportedDomains: ['*'],
      credentials: {
        apiKey: process.env.GEMINI_API_KEY || null,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
      },
      aiConfig: {
        modelName: 'gemini-1.5-flash',
        maxTokens: 2048,
        temperature: 0.1,
        confidenceThreshold: 0.7,
        inputType: 'html'
      },
      quotas: {
        requestsPerDay: 1500,
        requestsPerMinute: 60,
        tokensPerDay: 50000,
        tokensPerMinute: 32000
      },
      costPerRequest: 0.0005,
      monthlyCostLimit: 10,
      fallbackEnabled: true,
      fallbackPriority: 2,
      freeTierLimits: {
        requestsPerMinute: 60,
        requestsPerDay: 1500,
        tokensPerMinute: 32000,
        tokensPerDay: 50000
      }
    });

    // OpenAI provider configuration
    this.configs.set('openai-gpt4-vision', {
      name: 'openai-gpt4-vision',
      type: PROVIDER_TYPES.AI_VISION,
      priority: 4,
      rateLimit: 20,
      timeout: 15000,
      enabled: true,
      supportedDomains: ['*'],
      credentials: {
        apiKey: process.env.OPENAI_API_KEY || null,
        organization: process.env.OPENAI_ORGANIZATION || null,
        endpoint: 'https://api.openai.com/v1/chat/completions'
      },
      aiConfig: {
        modelName: 'gpt-4-vision-preview',
        maxTokens: 1000,
        temperature: 0.1,
        confidenceThreshold: 0.8,
        inputType: 'screenshot'
      },
      quotas: {
        requestsPerMinute: 20,
        tokensPerMinute: 10000,
        requestsPerDay: 500,
        tokensPerDay: 150000
      },
      costPerRequest: 0.01,
      monthlyCostLimit: 100,
      fallbackEnabled: true,
      fallbackPriority: 3,
      pricing: {
        inputTokens: 0.01 / 1000,
        outputTokens: 0.03 / 1000,
        imageTokens: 0.00765 / 1000
      }
    });

    // Setup validation rules
    this.setupValidationRules();
  }

  /**
   * Setup validation rules for configuration
   * @private
   */
  setupValidationRules() {
    this.validationRules.set('required_credentials', (config) => {
      if (config.enabled && config.credentials) {
        if (config.type === PROVIDER_TYPES.API && !config.credentials.apiKey) {
          return { valid: false, message: `${config.name}: API key is required` };
        }
        if (config.type === PROVIDER_TYPES.AI_VISION && !config.credentials.apiKey) {
          return { valid: false, message: `${config.name}: AI API key is required` };
        }
      }
      return { valid: true };
    });

    this.validationRules.set('valid_priority', (config) => {
      if (typeof config.priority !== 'number' || config.priority < 1 || config.priority > 10) {
        return { valid: false, message: `${config.name}: Priority must be between 1 and 10` };
      }
      return { valid: true };
    });

    this.validationRules.set('valid_timeout', (config) => {
      if (typeof config.timeout !== 'number' || config.timeout < 1000 || config.timeout > 300000) {
        return { valid: false, message: `${config.name}: Timeout must be between 1000ms and 300000ms` };
      }
      return { valid: true };
    });

    this.validationRules.set('valid_rate_limit', (config) => {
      if (typeof config.rateLimit !== 'number' || config.rateLimit < 1 || config.rateLimit > 1000) {
        return { valid: false, message: `${config.name}: Rate limit must be between 1 and 1000 requests per minute` };
      }
      return { valid: true };
    });
  }

  /**
   * Apply environment-specific configuration overrides
   * @private
   */
  applyEnvironmentOverrides() {
    if (this.environment === 'development') {
      this.applyDevelopmentOverrides();
    } else if (this.environment === 'test') {
      this.applyTestOverrides();
    } else if (this.environment === 'production') {
      this.applyProductionOverrides();
    }
  }

  /**
   * Apply development environment overrides
   * @private
   */
  applyDevelopmentOverrides() {
    // Lower budgets for development
    this.globalConfig.orchestrator.costTracking.dailyBudget = 1;
    this.globalConfig.orchestrator.costTracking.monthlyBudget = 10;
    this.globalConfig.usageTracker.budgets.daily = 1;
    this.globalConfig.usageTracker.budgets.monthly = 10;

    // More detailed logging and tracking
    this.globalConfig.orchestrator.progressReporting.detailedCallbacks = true;
    this.globalConfig.usageTracker.tracking.detailedMetrics = true;

    // Shorter cache TTL for faster development iteration
    this.globalConfig.orchestrator.cacheConfig.ttl = 300; // 5 minutes

    // Shorter timeouts for faster failure detection
    this.configs.get('ScraperAPI').timeout = 15000;
    this.configs.get('gemini-flash').timeout = 5000;
    this.configs.get('openai-gpt4-vision').timeout = 10000;

    // Lower rate limits to avoid hitting quotas during development
    this.configs.get('ScraperAPI').rateLimit = 30;
    this.configs.get('gemini-flash').rateLimit = 20;
    this.configs.get('openai-gpt4-vision').rateLimit = 5;
  }

  /**
   * Apply test environment overrides
   * @private
   */
  applyTestOverrides() {
    // Disable external API calls in test environment
    this.configs.get('ScraperAPI').enabled = false;
    this.configs.get('gemini-flash').enabled = false;
    this.configs.get('openai-gpt4-vision').enabled = false;

    // Disable cost tracking and notifications
    this.globalConfig.orchestrator.costTracking.enabled = false;
    this.globalConfig.usageTracker.notifications.enabled = false;

    // Very short cache TTL for testing
    this.globalConfig.orchestrator.cacheConfig.ttl = 1;

    // Fast timeouts for testing
    this.configs.get('ScraperAPI').timeout = 1000;
    this.configs.get('gemini-flash').timeout = 1000;
    this.configs.get('openai-gpt4-vision').timeout = 1000;
  }

  /**
   * Apply production environment overrides
   * @private
   */
  applyProductionOverrides() {
    // Higher budgets for production
    this.globalConfig.orchestrator.costTracking.dailyBudget = 50;
    this.globalConfig.orchestrator.costTracking.monthlyBudget = 1000;
    this.globalConfig.usageTracker.budgets.daily = 50;
    this.globalConfig.usageTracker.budgets.monthly = 1000;

    // Enable notifications in production
    this.globalConfig.usageTracker.notifications.enabled = true;

    // Longer cache TTL for better performance
    this.globalConfig.orchestrator.cacheConfig.ttl = 7200; // 2 hours

    // Optimize for performance and reliability
    this.globalConfig.orchestrator.providerStrategy.performanceOptimization = true;
    this.globalConfig.orchestrator.retryConfig.maxAttempts = 5;

    // Production rate limits (more conservative)
    this.configs.get('ScraperAPI').rateLimit = 50;
    this.configs.get('gemini-flash').rateLimit = 40;
    this.configs.get('openai-gpt4-vision').rateLimit = 15;

    // Longer timeouts for stability
    this.configs.get('ScraperAPI').timeout = 60000;
    this.configs.get('gemini-flash').timeout = 15000;
    this.configs.get('openai-gpt4-vision').timeout = 30000;
  }

  /**
   * Update configuration with new values
   * @param {Object} newConfig - New configuration to apply
   */
  updateConfiguration(newConfig) {
    // Update global configuration
    if (newConfig.orchestrator) {
      this.mergeConfig(this.globalConfig.orchestrator, newConfig.orchestrator);
    }

    if (newConfig.usageTracker) {
      this.mergeConfig(this.globalConfig.usageTracker, newConfig.usageTracker);
    }

    // Update provider configurations
    if (newConfig.providers) {
      for (const [providerName, providerConfig] of Object.entries(newConfig.providers)) {
        if (this.configs.has(providerName)) {
          this.mergeConfig(this.configs.get(providerName), providerConfig);
        } else {
          this.configs.set(providerName, { ...providerConfig });
        }
      }
    }

    // Apply individual provider configurations
    if (newConfig.scraperapi) {
      this.mergeConfig(this.configs.get('ScraperAPI'), newConfig.scraperapi);
    }

    if (newConfig.gemini) {
      this.mergeConfig(this.configs.get('gemini-flash'), newConfig.gemini);
    }

    if (newConfig.openai) {
      this.mergeConfig(this.configs.get('openai-gpt4-vision'), newConfig.openai);
    }
  }

  /**
   * Deep merge two configuration objects
   * @param {Object} target - Target configuration object
   * @param {Object} source - Source configuration object
   * @private
   */
  mergeConfig(target, source) {
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.mergeConfig(target[key], value);
      } else {
        target[key] = value;
      }
    }
  }

  /**
   * Validate the current configuration
   * @returns {Object} - Validation result
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];

    // Validate each provider configuration
    for (const [providerName, config] of this.configs) {
      for (const [ruleName, rule] of this.validationRules) {
        const result = rule(config);
        if (!result.valid) {
          errors.push(result.message);
        }
      }

      // Check for missing credentials
      if (config.enabled && config.type === PROVIDER_TYPES.API && !config.credentials.apiKey) {
        warnings.push(`${providerName}: No API key provided - provider will be disabled`);
        config.enabled = false;
      }

      if (config.enabled && config.type === PROVIDER_TYPES.AI_VISION && !config.credentials.apiKey) {
        warnings.push(`${providerName}: No AI API key provided - provider will be disabled`);
        config.enabled = false;
      }
    }

    // Validate global configuration
    const enabledProviders = Array.from(this.configs.values()).filter(c => c.enabled);
    if (enabledProviders.length === 0) {
      errors.push('No providers are enabled - at least one provider must be configured');
    }

    // Check budget configuration
    if (this.globalConfig.orchestrator.costTracking.enabled) {
      if (this.globalConfig.orchestrator.costTracking.dailyBudget <= 0) {
        warnings.push('Daily budget is 0 or negative - cost tracking may not work properly');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      enabledProviders: enabledProviders.length,
      totalProviders: this.configs.size
    };
  }

  /**
   * Get configuration for a specific provider
   * @param {string} providerName - Provider name
   * @returns {Object|null} - Provider configuration
   */
  getProviderConfig(providerName) {
    return this.configs.get(providerName) || null;
  }

  /**
   * Get orchestrator configuration
   * @returns {Object} - Orchestrator configuration
   */
  getOrchestratorConfig() {
    return this.globalConfig.orchestrator;
  }

  /**
   * Get usage tracker configuration
   * @returns {Object} - Usage tracker configuration
   */
  getUsageTrackerConfig() {
    return this.globalConfig.usageTracker;
  }

  /**
   * Get all provider configurations
   * @returns {Map} - All provider configurations
   */
  getAllProviderConfigs() {
    return new Map(this.configs);
  }

  /**
   * Get enabled provider configurations
   * @returns {Map} - Enabled provider configurations
   */
  getEnabledProviderConfigs() {
    const enabled = new Map();
    for (const [name, config] of this.configs) {
      if (config.enabled) {
        enabled.set(name, config);
      }
    }
    return enabled;
  }

  /**
   * Enable or disable a provider
   * @param {string} providerName - Provider name
   * @param {boolean} enabled - Whether to enable the provider
   * @returns {boolean} - Whether the operation was successful
   */
  setProviderEnabled(providerName, enabled) {
    const config = this.configs.get(providerName);
    if (!config) {
      return false;
    }

    config.enabled = enabled;
    return true;
  }

  /**
   * Update provider priority
   * @param {string} providerName - Provider name
   * @param {number} priority - New priority (1-10)
   * @returns {boolean} - Whether the operation was successful
   */
  setProviderPriority(providerName, priority) {
    const config = this.configs.get(providerName);
    if (!config || priority < 1 || priority > 10) {
      return false;
    }

    config.priority = priority;
    return true;
  }

  /**
   * Update provider rate limit
   * @param {string} providerName - Provider name
   * @param {number} rateLimit - New rate limit (requests per minute)
   * @returns {boolean} - Whether the operation was successful
   */
  setProviderRateLimit(providerName, rateLimit) {
    const config = this.configs.get(providerName);
    if (!config || rateLimit < 1) {
      return false;
    }

    config.rateLimit = rateLimit;
    return true;
  }

  /**
   * Get configuration summary for monitoring
   * @returns {Object} - Configuration summary
   */
  getConfigurationSummary() {
    const enabledProviders = Array.from(this.configs.values()).filter(c => c.enabled);
    const totalBudget = this.globalConfig.orchestrator.costTracking.monthlyBudget;
    
    return {
      environment: this.environment,
      totalProviders: this.configs.size,
      enabledProviders: enabledProviders.length,
      providerTypes: {
        api: enabledProviders.filter(p => p.type === PROVIDER_TYPES.API).length,
        ai: enabledProviders.filter(p => p.type === PROVIDER_TYPES.AI_VISION).length
      },
      budget: {
        daily: this.globalConfig.orchestrator.costTracking.dailyBudget,
        monthly: totalBudget,
        tracking: this.globalConfig.orchestrator.costTracking.enabled
      },
      features: {
        caching: this.globalConfig.orchestrator.cacheConfig.enabled,
        smartFallback: this.globalConfig.orchestrator.providerStrategy.useSmartFallback,
        costOptimization: this.globalConfig.orchestrator.providerStrategy.costOptimization,
        performanceOptimization: this.globalConfig.orchestrator.providerStrategy.performanceOptimization
      },
      validation: this.validateConfiguration()
    };
  }

  /**
   * Export configuration for backup or sharing
   * @param {Object} options - Export options
   * @returns {Object} - Exported configuration
   */
  exportConfiguration(options = {}) {
    const {
      includeCredentials = false,
      format = 'json',
      providerNames = null
    } = options;

    const exported = {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      orchestrator: { ...this.globalConfig.orchestrator },
      usageTracker: { ...this.globalConfig.usageTracker },
      providers: {}
    };

    // Export provider configurations
    const providersToExport = providerNames ? 
      providerNames.filter(name => this.configs.has(name)) :
      Array.from(this.configs.keys());

    for (const providerName of providersToExport) {
      const config = { ...this.configs.get(providerName) };
      
      // Remove credentials if not requested
      if (!includeCredentials && config.credentials) {
        config.credentials = Object.keys(config.credentials).reduce((acc, key) => {
          acc[key] = '***REDACTED***';
          return acc;
        }, {});
      }
      
      exported.providers[providerName] = config;
    }

    return exported;
  }

  /**
   * Import configuration from exported data
   * @param {Object} configData - Configuration data to import
   * @param {Object} options - Import options
   * @returns {Object} - Import result
   */
  importConfiguration(configData, options = {}) {
    const {
      overwriteExisting = false,
      validateOnly = false
    } = options;

    const errors = [];
    const warnings = [];

    try {
      // Validate imported data structure
      if (!configData.orchestrator || !configData.providers) {
        errors.push('Invalid configuration format');
        return { success: false, errors, warnings };
      }

      if (validateOnly) {
        // Only validate, don't actually import
        const tempConfig = new ScrapingConfig(configData);
        const validation = tempConfig.validateConfiguration();
        return {
          success: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          preview: tempConfig.getConfigurationSummary()
        };
      }

      // Import orchestrator configuration
      if (overwriteExisting || !this.globalConfig.orchestrator) {
        this.globalConfig.orchestrator = { ...configData.orchestrator };
      }

      // Import usage tracker configuration
      if (overwriteExisting || !this.globalConfig.usageTracker) {
        this.globalConfig.usageTracker = { ...configData.usageTracker };
      }

      // Import provider configurations
      for (const [providerName, providerConfig] of Object.entries(configData.providers)) {
        if (overwriteExisting || !this.configs.has(providerName)) {
          this.configs.set(providerName, { ...providerConfig });
        } else {
          warnings.push(`Provider ${providerName} already exists - skipped (use overwriteExisting option)`);
        }
      }

      // Validate imported configuration
      const validation = this.validateConfiguration();
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);

      return {
        success: validation.valid,
        errors,
        warnings,
        imported: {
          providers: Object.keys(configData.providers).length,
          enabledProviders: Object.values(configData.providers).filter(p => p.enabled).length
        }
      };

    } catch (error) {
      errors.push(`Import failed: ${error.message}`);
      return { success: false, errors, warnings };
    }
  }

  /**
   * Create optimized configuration based on usage patterns
   * @param {Object} usageData - Historical usage data
   * @returns {Object} - Optimization suggestions
   */
  optimizeConfiguration(usageData) {
    const suggestions = [];
    const optimizations = {};

    // Analyze provider performance
    if (usageData.providers) {
      for (const [providerName, data] of Object.entries(usageData.providers)) {
        const config = this.configs.get(providerName);
        if (!config) continue;

        // Suggest priority adjustments based on success rate
        if (data.successRate < 0.7 && config.priority > 3) {
          suggestions.push({
            type: 'priority',
            provider: providerName,
            current: config.priority,
            suggested: Math.max(1, config.priority - 2),
            reason: `Low success rate: ${(data.successRate * 100).toFixed(1)}%`
          });
        }

        // Suggest rate limit adjustments based on usage
        if (data.averageResponseTime > 10000 && config.rateLimit > 20) {
          suggestions.push({
            type: 'rateLimit',
            provider: providerName,
            current: config.rateLimit,
            suggested: Math.max(10, Math.floor(config.rateLimit * 0.7)),
            reason: `High response time: ${data.averageResponseTime}ms`
          });
        }

        // Suggest timeout adjustments
        if (data.averageResponseTime > config.timeout * 0.8) {
          suggestions.push({
            type: 'timeout',
            provider: providerName,
            current: config.timeout,
            suggested: Math.min(60000, data.averageResponseTime * 1.5),
            reason: `Response time close to timeout threshold`
          });
        }
      }
    }

    // Analyze cost efficiency
    if (usageData.costTracking) {
      const { dailyCost, monthlyCost } = usageData.costTracking;
      const dailyBudget = this.globalConfig.orchestrator.costTracking.dailyBudget;
      const monthlyBudget = this.globalConfig.orchestrator.costTracking.monthlyBudget;

      if (dailyCost > dailyBudget * 0.9) {
        suggestions.push({
          type: 'budget',
          metric: 'daily',
          current: dailyBudget,
          suggested: Math.ceil(dailyCost * 1.2),
          reason: 'Approaching daily budget limit'
        });
      }

      if (monthlyCost > monthlyBudget * 0.9) {
        suggestions.push({
          type: 'budget',
          metric: 'monthly',
          current: monthlyBudget,
          suggested: Math.ceil(monthlyCost * 1.2),
          reason: 'Approaching monthly budget limit'
        });
      }
    }

    return {
      suggestions,
      optimizations,
      summary: `Generated ${suggestions.length} optimization suggestions based on usage data`
    };
  }

  /**
   * Apply optimization suggestions
   * @param {Array} suggestions - Optimization suggestions to apply
   * @returns {Object} - Application result
   */
  applyOptimizations(suggestions) {
    const applied = [];
    const failed = [];

    for (const suggestion of suggestions) {
      try {
        switch (suggestion.type) {
          case 'priority':
            if (this.setProviderPriority(suggestion.provider, suggestion.suggested)) {
              applied.push(suggestion);
            } else {
              failed.push({ ...suggestion, reason: 'Failed to set priority' });
            }
            break;

          case 'rateLimit':
            if (this.setProviderRateLimit(suggestion.provider, suggestion.suggested)) {
              applied.push(suggestion);
            } else {
              failed.push({ ...suggestion, reason: 'Failed to set rate limit' });
            }
            break;

          case 'timeout':
            const config = this.configs.get(suggestion.provider);
            if (config) {
              config.timeout = suggestion.suggested;
              applied.push(suggestion);
            } else {
              failed.push({ ...suggestion, reason: 'Provider not found' });
            }
            break;

          case 'budget':
            if (suggestion.metric === 'daily') {
              this.globalConfig.orchestrator.costTracking.dailyBudget = suggestion.suggested;
              applied.push(suggestion);
            } else if (suggestion.metric === 'monthly') {
              this.globalConfig.orchestrator.costTracking.monthlyBudget = suggestion.suggested;
              applied.push(suggestion);
            }
            break;

          default:
            failed.push({ ...suggestion, reason: 'Unknown optimization type' });
        }
      } catch (error) {
        failed.push({ ...suggestion, reason: error.message });
      }
    }

    return {
      applied: applied.length,
      failed: failed.length,
      details: { applied, failed }
    };
  }
}

/**
 * Create a default scraping configuration for quick setup
 * @param {string} environment - Environment (development, test, production)
 * @returns {ScrapingConfig} - Configured scraping config instance
 */
export function createDefaultConfig(environment = 'development') {
  return new ScrapingConfig({ environment });
}

/**
 * Create a configuration for specific providers only
 * @param {Array<string>} enabledProviders - Providers to enable
 * @param {string} environment - Environment
 * @returns {ScrapingConfig} - Configured scraping config instance
 */
export function createProviderConfig(enabledProviders, environment = 'development') {
  const config = new ScrapingConfig({ environment });
  
  // Disable all providers first
  for (const [providerName] of config.getAllProviderConfigs()) {
    config.setProviderEnabled(providerName, false);
  }
  
  // Enable only specified providers
  for (const providerName of enabledProviders) {
    config.setProviderEnabled(providerName, true);
  }
  
  return config;
}

/**
 * Create a cost-optimized configuration
 * @param {number} dailyBudget - Daily budget limit
 * @param {string} environment - Environment
 * @returns {ScrapingConfig} - Cost-optimized configuration
 */
export function createCostOptimizedConfig(dailyBudget = 5, environment = 'development') {
  const configData = {
    environment,
    orchestrator: {
      costTracking: {
        enabled: true,
        dailyBudget,
        monthlyBudget: dailyBudget * 30,
        warningThreshold: 0.7,
        stopOnBudgetExceeded: true
      },
      providerStrategy: {
        costOptimization: true,
        useSmartFallback: true
      }
    },
    providers: {
      'ScraperAPI': { priority: 9 }, // Highest priority for free tier
      'gemini-flash': { priority: 7 }, // Second priority for generous free tier
      'openai-gpt4-vision': { priority: 3 } // Lower priority due to cost
    }
  };
  
  return new ScrapingConfig(configData);
}

/**
 * Create a performance-optimized configuration
 * @param {string} environment - Environment
 * @returns {ScrapingConfig} - Performance-optimized configuration
 */
export function createPerformanceOptimizedConfig(environment = 'development') {
  const configData = {
    environment,
    orchestrator: {
      parallelProviders: true,
      providerStrategy: {
        performanceOptimization: true,
        adaptiveTimeout: true
      },
      cacheConfig: {
        enabled: true,
        ttl: 7200, // Longer cache for better performance
        maxSize: 2000
      }
    },
    providers: {
      'ScraperAPI': { 
        timeout: 20000,
        rateLimit: 80
      },
      'gemini-flash': { 
        timeout: 6000,
        rateLimit: 50
      },
      'openai-gpt4-vision': { 
        timeout: 12000,
        rateLimit: 15
      }
    }
  };
  
  return new ScrapingConfig(configData);
}

export default ScrapingConfig;