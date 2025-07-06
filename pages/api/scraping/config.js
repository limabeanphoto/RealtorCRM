// pages/api/scraping/config.js - Scraping configuration management endpoint
import withAuth from '../../../utils/withAuth';
import { ScrapingOrchestrator } from '../../../utils/scraping/ScrapingOrchestrator';
import { UsageTracker } from '../../../utils/scraping/UsageTracker';
import { ERROR_TYPES, PROVIDER_TYPES } from '../../../utils/scraping/types';

/**
 * API endpoint for managing scraping configuration
 * 
 * Supported operations:
 * - GET: Retrieve current configuration
 * - POST: Update configuration
 * - PUT: Replace entire configuration
 * - DELETE: Reset to default configuration
 */
async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    switch (req.method) {
      case 'GET':
        return handleGetConfig(req, res, startTime);
      
      case 'POST':
        return handleUpdateConfig(req, res, startTime);
      
      case 'PUT':
        return handleReplaceConfig(req, res, startTime);
      
      case 'DELETE':
        return handleResetConfig(req, res, startTime);
      
      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
          metadata: {
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime
          }
        });
    }
  } catch (error) {
    console.error('Error in scraping config endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        type: error.type || ERROR_TYPES.UNKNOWN_ERROR,
        message: error.message
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    });
  }
}

/**
 * Handle GET request - retrieve current configuration
 */
async function handleGetConfig(req, res, startTime) {
  try {
    // Get configuration from environment or defaults
    const config = getCurrentConfig();
    
    // Structure response to match frontend component expectations
    const responseData = {
      budgets: {
        daily: config.budget.dailyBudget,
        weekly: config.budget.dailyBudget * 7,
        monthly: config.budget.monthlyBudget,
        yearly: config.budget.monthlyBudget * 12
      },
      providers: config.providers,
      orchestrator: config.orchestrator,
      usageTracking: config.usageTracking,
      progressReporting: config.progressReporting
    };
    
    return res.status(200).json({
      success: true,
      data: responseData,
      config: config,
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        version: '2.0',
        configSource: 'environment'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve configuration',
      error: {
        type: ERROR_TYPES.CONFIGURATION_ERROR,
        message: error.message
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    });
  }
}

/**
 * Handle POST request - update specific configuration values
 */
async function handleUpdateConfig(req, res, startTime) {
  try {
    const updates = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration updates',
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }

    // Validate configuration updates
    const validationResult = validateConfigUpdates(updates);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration values',
        errors: validationResult.errors,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }

    // Get current config and apply updates
    const currentConfig = getCurrentConfig();
    const updatedConfig = mergeConfig(currentConfig, updates);
    
    // Validate the complete configuration
    const completeValidation = validateCompleteConfig(updatedConfig);
    if (!completeValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Configuration update would create invalid state',
        errors: completeValidation.errors,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }

    // Apply configuration (this would typically update environment variables or database)
    const applyResult = await applyConfiguration(updatedConfig);
    
    // Structure response to match frontend expectations
    const responseData = {
      budgets: {
        daily: updatedConfig.budget.dailyBudget,
        weekly: updatedConfig.budget.dailyBudget * 7,
        monthly: updatedConfig.budget.monthlyBudget,
        yearly: updatedConfig.budget.monthlyBudget * 12
      },
      providers: updatedConfig.providers,
      orchestrator: updatedConfig.orchestrator
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      previousConfig: currentConfig,
      updatedConfig: updatedConfig,
      appliedChanges: Object.keys(updates),
      requiresRestart: applyResult.requiresRestart,
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        version: '2.0',
        changeCount: Object.keys(updates).length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: {
        type: ERROR_TYPES.CONFIGURATION_ERROR,
        message: error.message
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    });
  }
}

/**
 * Handle PUT request - replace entire configuration
 */
async function handleReplaceConfig(req, res, startTime) {
  try {
    const newConfig = req.body;
    
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration object',
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }

    // Validate the complete new configuration
    const validationResult = validateCompleteConfig(newConfig);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration',
        errors: validationResult.errors,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }

    const currentConfig = getCurrentConfig();
    
    // Apply the new configuration
    const applyResult = await applyConfiguration(newConfig);
    
    return res.status(200).json({
      success: true,
      data: {
        previousConfig: currentConfig,
        newConfig: newConfig,
        requiresRestart: applyResult.requiresRestart
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        version: '2.0',
        operation: 'complete-replacement'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to replace configuration',
      error: {
        type: ERROR_TYPES.CONFIGURATION_ERROR,
        message: error.message
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    });
  }
}

/**
 * Handle DELETE request - reset to default configuration
 */
async function handleResetConfig(req, res, startTime) {
  try {
    const currentConfig = getCurrentConfig();
    const defaultConfig = getDefaultConfig();
    
    // Apply default configuration
    const applyResult = await applyConfiguration(defaultConfig);
    
    return res.status(200).json({
      success: true,
      data: {
        previousConfig: currentConfig,
        defaultConfig: defaultConfig,
        requiresRestart: applyResult.requiresRestart
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        version: '2.0',
        operation: 'reset-to-defaults'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset configuration',
      error: {
        type: ERROR_TYPES.CONFIGURATION_ERROR,
        message: error.message
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    });
  }
}

/**
 * Get current configuration from environment variables and defaults
 */
function getCurrentConfig() {
  return {
    // Orchestrator configuration
    orchestrator: {
      maxAttempts: parseInt(process.env.SCRAPING_MAX_ATTEMPTS) || 3,
      retryStrategy: process.env.SCRAPING_RETRY_STRATEGY || 'exponential',
      baseDelay: parseInt(process.env.SCRAPING_BASE_DELAY) || 1000,
      maxDelay: parseInt(process.env.SCRAPING_MAX_DELAY) || 10000,
      timeout: parseInt(process.env.SCRAPING_TIMEOUT) || 30000,
      
      // Cache configuration
      cacheEnabled: process.env.SCRAPING_CACHE_ENABLED !== 'false',
      cacheTtl: parseInt(process.env.SCRAPING_CACHE_TTL) || 3600,
      cacheMaxSize: parseInt(process.env.SCRAPING_CACHE_MAX_SIZE) || 1000,
      
      // Confidence thresholds
      confidenceThreshold: parseInt(process.env.SCRAPING_CONFIDENCE_THRESHOLD) || 70,
      aiConfidenceThreshold: parseInt(process.env.SCRAPING_AI_CONFIDENCE_THRESHOLD) || 80,
      minConfidenceForSuccess: parseInt(process.env.SCRAPING_MIN_CONFIDENCE) || 60,
      
      // Strategy options
      useSmartFallback: process.env.SCRAPING_SMART_FALLBACK !== 'false',
      costOptimization: process.env.SCRAPING_COST_OPTIMIZATION !== 'false',
      performanceOptimization: process.env.SCRAPING_PERFORMANCE_OPTIMIZATION !== 'false',
      parallelProviders: process.env.SCRAPING_PARALLEL_PROVIDERS === 'true'
    },
    
    // Budget and cost configuration
    budget: {
      enabled: process.env.SCRAPING_BUDGET_ENABLED !== 'false',
      dailyBudget: parseFloat(process.env.SCRAPING_DAILY_BUDGET) || 10,
      monthlyBudget: parseFloat(process.env.SCRAPING_MONTHLY_BUDGET) || 100,
      warningThreshold: parseFloat(process.env.SCRAPING_WARNING_THRESHOLD) || 0.8,
      stopOnBudgetExceeded: process.env.SCRAPING_STOP_ON_BUDGET_EXCEEDED !== 'false'
    },
    
    // Provider configurations
    providers: {
      scraperAPI: {
        enabled: process.env.SCRAPER_API_ENABLED !== 'false',
        apiKey: process.env.SCRAPER_API_KEY,
        timeout: parseInt(process.env.SCRAPER_API_TIMEOUT) || 15000,
        retryAttempts: parseInt(process.env.SCRAPER_API_RETRY_ATTEMPTS) || 2,
        rateLimitPerMinute: parseInt(process.env.SCRAPER_API_RATE_LIMIT) || 60,
        priority: parseInt(process.env.SCRAPER_API_PRIORITY) || 100
      },
      
      gemini: {
        enabled: process.env.GEMINI_ENABLED === 'true',
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-flash',
        timeout: parseInt(process.env.GEMINI_TIMEOUT) || 10000,
        rateLimitPerMinute: parseInt(process.env.GEMINI_RATE_LIMIT) || 15,
        priority: parseInt(process.env.GEMINI_PRIORITY) || 80
      },
      
      openai: {
        enabled: process.env.OPENAI_ENABLED === 'true',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4-vision-preview',
        timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000,
        rateLimitPerMinute: parseInt(process.env.OPENAI_RATE_LIMIT) || 3,
        priority: parseInt(process.env.OPENAI_PRIORITY) || 60
      }
    },
    
    // Progress reporting configuration
    progressReporting: {
      enabled: process.env.SCRAPING_PROGRESS_ENABLED !== 'false',
      detailedCallbacks: process.env.SCRAPING_DETAILED_CALLBACKS !== 'false',
      sseEnabled: process.env.SCRAPING_SSE_ENABLED !== 'false',
      performanceMetrics: process.env.SCRAPING_PERFORMANCE_METRICS !== 'false'
    },
    
    // Usage tracking configuration
    usageTracking: {
      enabled: process.env.USAGE_TRACKING_ENABLED !== 'false',
      detailedMetrics: process.env.USAGE_DETAILED_METRICS !== 'false',
      historicalData: process.env.USAGE_HISTORICAL_DATA !== 'false',
      maxHistoryDays: parseInt(process.env.USAGE_MAX_HISTORY_DAYS) || 365,
      
      // Notification configuration
      notifications: {
        enabled: process.env.USAGE_NOTIFICATIONS_ENABLED === 'true',
        email: process.env.USAGE_NOTIFICATION_EMAIL,
        webhook: process.env.USAGE_NOTIFICATION_WEBHOOK,
        slack: process.env.USAGE_SLACK_WEBHOOK
      }
    }
  };
}

/**
 * Get default configuration values
 */
function getDefaultConfig() {
  return {
    orchestrator: {
      maxAttempts: 3,
      retryStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 10000,
      timeout: 30000,
      cacheEnabled: true,
      cacheTtl: 3600,
      cacheMaxSize: 1000,
      confidenceThreshold: 70,
      aiConfidenceThreshold: 80,
      minConfidenceForSuccess: 60,
      useSmartFallback: true,
      costOptimization: true,
      performanceOptimization: true,
      parallelProviders: false
    },
    
    budget: {
      enabled: true,
      dailyBudget: 10,
      monthlyBudget: 100,
      warningThreshold: 0.8,
      stopOnBudgetExceeded: true
    },
    
    providers: {
      scraperAPI: {
        enabled: true,
        apiKey: null,
        timeout: 15000,
        retryAttempts: 2,
        rateLimitPerMinute: 60,
        priority: 100
      },
      
      gemini: {
        enabled: false,
        apiKey: null,
        model: 'gemini-flash',
        timeout: 10000,
        rateLimitPerMinute: 15,
        priority: 80
      },
      
      openai: {
        enabled: false,
        apiKey: null,
        model: 'gpt-4-vision-preview',
        timeout: 30000,
        rateLimitPerMinute: 3,
        priority: 60
      }
    },
    
    progressReporting: {
      enabled: true,
      detailedCallbacks: true,
      sseEnabled: true,
      performanceMetrics: true
    },
    
    usageTracking: {
      enabled: true,
      detailedMetrics: true,
      historicalData: true,
      maxHistoryDays: 365,
      notifications: {
        enabled: false,
        email: null,
        webhook: null,
        slack: null
      }
    }
  };
}

/**
 * Validate configuration updates
 */
function validateConfigUpdates(updates) {
  const errors = [];
  
  // Validate numerical values
  if (updates.orchestrator?.maxAttempts !== undefined) {
    if (!Number.isInteger(updates.orchestrator.maxAttempts) || updates.orchestrator.maxAttempts < 1 || updates.orchestrator.maxAttempts > 10) {
      errors.push('maxAttempts must be an integer between 1 and 10');
    }
  }
  
  if (updates.orchestrator?.confidenceThreshold !== undefined) {
    if (!Number.isInteger(updates.orchestrator.confidenceThreshold) || updates.orchestrator.confidenceThreshold < 0 || updates.orchestrator.confidenceThreshold > 100) {
      errors.push('confidenceThreshold must be an integer between 0 and 100');
    }
  }
  
  if (updates.budget?.dailyBudget !== undefined) {
    if (!Number.isFinite(updates.budget.dailyBudget) || updates.budget.dailyBudget < 0) {
      errors.push('dailyBudget must be a positive number');
    }
  }
  
  if (updates.budget?.monthlyBudget !== undefined) {
    if (!Number.isFinite(updates.budget.monthlyBudget) || updates.budget.monthlyBudget < 0) {
      errors.push('monthlyBudget must be a positive number');
    }
  }
  
  // Validate strategy values
  if (updates.orchestrator?.retryStrategy !== undefined) {
    const validStrategies = ['exponential', 'linear', 'fixed'];
    if (!validStrategies.includes(updates.orchestrator.retryStrategy)) {
      errors.push(`retryStrategy must be one of: ${validStrategies.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate complete configuration
 */
function validateCompleteConfig(config) {
  const errors = [];
  
  // Ensure at least one provider is enabled
  const enabledProviders = Object.values(config.providers || {}).filter(p => p.enabled);
  if (enabledProviders.length === 0) {
    errors.push('At least one provider must be enabled');
  }
  
  // Validate provider API keys
  Object.entries(config.providers || {}).forEach(([name, provider]) => {
    if (provider.enabled && !provider.apiKey) {
      errors.push(`${name} provider is enabled but missing API key`);
    }
  });
  
  // Validate budget relationships
  if (config.budget?.dailyBudget && config.budget?.monthlyBudget) {
    if (config.budget.dailyBudget * 31 > config.budget.monthlyBudget * 2) {
      errors.push('Daily budget seems too high relative to monthly budget');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Merge configuration updates with current configuration
 */
function mergeConfig(current, updates) {
  const merged = JSON.parse(JSON.stringify(current)); // Deep clone
  
  // Deep merge updates
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  deepMerge(merged, updates);
  return merged;
}

/**
 * Apply configuration changes (in a real implementation, this would update environment variables or database)
 */
async function applyConfiguration(config) {
  // In a real implementation, this would:
  // 1. Update environment variables
  // 2. Update database configuration
  // 3. Restart services if needed
  // 4. Validate that changes took effect
  
  console.log('Configuration would be applied:', config);
  
  // For now, just return success with restart requirement for certain changes
  const requiresRestart = hasRestartRequiredChanges(config);
  
  return {
    success: true,
    requiresRestart,
    appliedAt: new Date().toISOString()
  };
}

/**
 * Check if configuration changes require a restart
 */
function hasRestartRequiredChanges(config) {
  // Provider changes typically require restart
  // Budget and threshold changes don't
  return config.providers !== undefined;
}

export default withAuth(handler);
export { getCurrentConfig, getDefaultConfig, validateConfigUpdates, validateCompleteConfig };