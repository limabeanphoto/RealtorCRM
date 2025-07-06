// pages/api/scraping/providers.js - Provider management endpoint
import withAuth from '../../../utils/withAuth';
import { ScrapingOrchestrator } from '../../../utils/scraping/ScrapingOrchestrator';
import { ScraperAPIProvider } from '../../../utils/scraping/providers/ScraperAPIProvider';
import { ERROR_TYPES, PROVIDER_TYPES } from '../../../utils/scraping/types';

// Global orchestrator instance for provider management
let globalOrchestrator = null;

/**
 * Get or create the global orchestrator instance
 */
function getOrchestrator() {
  if (!globalOrchestrator) {
    globalOrchestrator = new ScrapingOrchestrator({
      maxAttempts: 3,
      retryStrategy: 'exponential',
      baseDelay: 1000,
      cacheEnabled: true,
      confidenceThreshold: 70,
      useSmartFallback: true,
      costOptimization: true,
      progressReportingEnabled: true
    });
    
    // Initialize default providers
    initializeDefaultProviders();
  }
  return globalOrchestrator;
}

/**
 * Initialize default providers based on environment configuration
 */
function initializeDefaultProviders() {
  const orchestrator = globalOrchestrator;
  
  // ScraperAPI Provider
  if (process.env.SCRAPER_API_KEY && process.env.SCRAPER_API_ENABLED !== 'false') {
    const scraperAPIProvider = new ScraperAPIProvider({
      apiKey: process.env.SCRAPER_API_KEY,
      timeout: parseInt(process.env.SCRAPER_API_TIMEOUT) || 15000,
      retryAttempts: parseInt(process.env.SCRAPER_API_RETRY_ATTEMPTS) || 2,
      rateLimitPerMinute: parseInt(process.env.SCRAPER_API_RATE_LIMIT) || 60,
      priority: parseInt(process.env.SCRAPER_API_PRIORITY) || 100,
      supportedDomains: ['realtor.com'],
      selectors: {
        name: [
          '.profile-details h2.base__StyledType-rui__sc-108xfm0-0.dQAzyh',
          'h2:contains("Justin")',
          '.profile-info h2',
          '.agent-name',
          '[data-testid="agent-name"]'
        ],
        company: [
          '.profile-details p.base__StyledType-rui__sc-108xfm0-0.GLfFQ',
          '.profile-info p:first-of-type',
          '.agent-company'
        ],
        phone: [
          'a[data-linkname="realtors:_details:top:phone_number"]',
          'a[href^="tel:"]',
          '.agent-phone'
        ],
        description: [
          '#agent-description',
          '.profile-description',
          '.agent-bio'
        ]
      }
    });
    
    orchestrator.registerProvider(scraperAPIProvider);
  }
  
  // TODO: Add Gemini and OpenAI providers when available
  // if (process.env.GEMINI_API_KEY && process.env.GEMINI_ENABLED === 'true') {
  //   const geminiProvider = new GeminiProvider({...});
  //   orchestrator.registerProvider(geminiProvider);
  // }
  
  // if (process.env.OPENAI_API_KEY && process.env.OPENAI_ENABLED === 'true') {
  //   const openaiProvider = new OpenAIProvider({...});
  //   orchestrator.registerProvider(openaiProvider);
  // }
}

/**
 * API endpoint for provider management
 * 
 * Supported operations:
 * - GET: List providers and their status
 * - POST: Add or update a provider
 * - PUT: Update provider configuration
 * - DELETE: Remove a provider
 */
async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    const orchestrator = getOrchestrator();
    
    switch (req.method) {
      case 'GET':
        return handleListProviders(req, res, orchestrator, startTime);
      
      case 'POST':
        return handleAddProvider(req, res, orchestrator, startTime);
      
      case 'PUT':
        return handleUpdateProvider(req, res, orchestrator, startTime);
      
      case 'DELETE':
        return handleRemoveProvider(req, res, orchestrator, startTime);
      
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
    console.error('Error in provider management endpoint:', error);
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
 * Handle GET request - list providers and their status
 */
async function handleListProviders(req, res, orchestrator, startTime) {
  try {
    const { detailed, includeMetrics, includeStatus } = req.query;
    
    // Get basic provider information
    const providers = Array.from(orchestrator.providers.values()).map(provider => ({
      name: provider.config.name,
      type: provider.config.type,
      enabled: provider.config.enabled,
      priority: provider.config.priority,
      supportedDomains: provider.config.supportedDomains || [],
      rateLimitPerMinute: provider.config.rateLimitPerMinute || 0
    }));
    
    const response = {
      success: true,
      data: {
        providers,
        totalProviders: providers.length,
        enabledProviders: providers.filter(p => p.enabled).length,
        providersByType: {
          api: providers.filter(p => p.type === PROVIDER_TYPES.API).length,
          ai: providers.filter(p => p.type === PROVIDER_TYPES.AI).length,
          aiVision: providers.filter(p => p.type === PROVIDER_TYPES.AI_VISION).length
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        version: '2.0'
      }
    };
    
    // Add detailed information if requested
    if (detailed === 'true') {
      response.data.providersDetailed = Array.from(orchestrator.providers.values()).map(provider => ({
        name: provider.config.name,
        type: provider.config.type,
        enabled: provider.config.enabled,
        priority: provider.config.priority,
        configuration: {
          timeout: provider.config.timeout,
          retryAttempts: provider.config.retryAttempts,
          rateLimitPerMinute: provider.config.rateLimitPerMinute,
          supportedDomains: provider.config.supportedDomains || [],
          selectors: provider.config.selectors || {}
        },
        capabilities: {
          canHandleJavaScript: provider.config.canHandleJavaScript || false,
          supportsCustomHeaders: provider.config.supportsCustomHeaders || false,
          supportsProxies: provider.config.supportsProxies || false,
          aiPowered: [PROVIDER_TYPES.AI, PROVIDER_TYPES.AI_VISION].includes(provider.config.type)
        }
      }));
    }
    
    // Add usage metrics if requested
    if (includeMetrics === 'true') {
      const metrics = orchestrator.getMetrics();
      response.data.metrics = {
        providerUsage: metrics.providerUsage,
        providerPerformance: Object.fromEntries(metrics.providerPerformance || new Map()),
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        averageResponseTime: metrics.averageResponseTime
      };
    }
    
    // Add real-time status if requested
    if (includeStatus === 'true') {
      const status = orchestrator.getStatus();
      response.data.status = {
        healthy: status.healthy,
        totalProviders: status.totalProviders,
        healthyProviders: status.healthyProviders,
        providerStatuses: status.providers
      };
    }
    
    return res.status(200).json(response);
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve provider information',
      error: {
        type: ERROR_TYPES.DATA_RETRIEVAL_ERROR,
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
 * Handle POST request - add or register a new provider
 */
async function handleAddProvider(req, res, orchestrator, startTime) {
  try {
    const { providerType, configuration } = req.body;
    
    if (!providerType) {
      return res.status(400).json({
        success: false,
        message: 'providerType is required',
        supportedTypes: Object.values(PROVIDER_TYPES),
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    if (!configuration || typeof configuration !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'configuration object is required',
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    // Validate configuration based on provider type
    const validationResult = validateProviderConfiguration(providerType, configuration);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider configuration',
        errors: validationResult.errors,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    // Check if provider with same name already exists
    if (orchestrator.providers.has(configuration.name)) {
      return res.status(409).json({
        success: false,
        message: `Provider with name '${configuration.name}' already exists`,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    // Create and register the provider
    let provider;
    
    switch (providerType) {
      case PROVIDER_TYPES.API:
        if (configuration.providerClass === 'ScraperAPI') {
          provider = new ScraperAPIProvider(configuration);
        } else {
          return res.status(400).json({
            success: false,
            message: `Unsupported API provider class: ${configuration.providerClass}`,
            supportedClasses: ['ScraperAPI'],
            metadata: {
              timestamp: new Date().toISOString(),
              duration: Date.now() - startTime
            }
          });
        }
        break;
      
      case PROVIDER_TYPES.AI:
      case PROVIDER_TYPES.AI_VISION:
        return res.status(501).json({
          success: false,
          message: `AI provider support not yet implemented for type: ${providerType}`,
          metadata: {
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime
          }
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported provider type: ${providerType}`,
          supportedTypes: Object.values(PROVIDER_TYPES),
          metadata: {
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime
          }
        });
    }
    
    // Register the provider
    orchestrator.registerProvider(provider);
    
    return res.status(201).json({
      success: true,
      data: {
        provider: {
          name: provider.config.name,
          type: provider.config.type,
          enabled: provider.config.enabled,
          priority: provider.config.priority
        },
        message: `Provider '${provider.config.name}' registered successfully`
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        version: '2.0',
        operation: 'provider-registration'
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add provider',
      error: {
        type: ERROR_TYPES.PROVIDER_ERROR,
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
 * Handle PUT request - update provider configuration
 */
async function handleUpdateProvider(req, res, orchestrator, startTime) {
  try {
    const { providerName, updates } = req.body;
    
    if (!providerName) {
      return res.status(400).json({
        success: false,
        message: 'providerName is required',
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'updates object is required',
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    // Check if provider exists
    const provider = orchestrator.providers.get(providerName);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: `Provider '${providerName}' not found`,
        availableProviders: Array.from(orchestrator.providers.keys()),
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    // Validate updates
    const validationResult = validateProviderUpdates(provider.config.type, updates);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider updates',
        errors: validationResult.errors,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    // Store original configuration
    const originalConfig = { ...provider.config };
    
    // Apply updates
    Object.assign(provider.config, updates);
    
    // Re-register provider to update priority ordering
    orchestrator.updateProviderPriority();
    
    return res.status(200).json({
      success: true,
      data: {
        provider: providerName,
        originalConfig,
        updatedConfig: provider.config,
        updatedFields: Object.keys(updates)
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        version: '2.0',
        operation: 'provider-update'
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update provider',
      error: {
        type: ERROR_TYPES.PROVIDER_ERROR,
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
 * Handle DELETE request - remove a provider
 */
async function handleRemoveProvider(req, res, orchestrator, startTime) {
  try {
    const { providerName } = req.query;
    
    if (!providerName) {
      return res.status(400).json({
        success: false,
        message: 'providerName query parameter is required',
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    // Check if provider exists
    const provider = orchestrator.providers.get(providerName);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: `Provider '${providerName}' not found`,
        availableProviders: Array.from(orchestrator.providers.keys()),
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    // Check if this is the last enabled provider
    const enabledProviders = Array.from(orchestrator.providers.values()).filter(p => p.config.enabled);
    if (enabledProviders.length === 1 && provider.config.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last enabled provider',
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }
    
    // Store provider info before removal
    const providerInfo = {
      name: provider.config.name,
      type: provider.config.type,
      enabled: provider.config.enabled,
      priority: provider.config.priority
    };
    
    // Remove the provider
    orchestrator.unregisterProvider(providerName);
    
    return res.status(200).json({
      success: true,
      data: {
        removedProvider: providerInfo,
        remainingProviders: Array.from(orchestrator.providers.keys())
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        version: '2.0',
        operation: 'provider-removal'
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove provider',
      error: {
        type: ERROR_TYPES.PROVIDER_ERROR,
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
 * Validate provider configuration based on type
 */
function validateProviderConfiguration(providerType, configuration) {
  const errors = [];
  
  // Common validation
  if (!configuration.name || typeof configuration.name !== 'string') {
    errors.push('name is required and must be a string');
  }
  
  if (configuration.priority !== undefined && (!Number.isInteger(configuration.priority) || configuration.priority < 0)) {
    errors.push('priority must be a non-negative integer');
  }
  
  if (configuration.timeout !== undefined && (!Number.isInteger(configuration.timeout) || configuration.timeout < 1000)) {
    errors.push('timeout must be an integer >= 1000ms');
  }
  
  // Type-specific validation
  switch (providerType) {
    case PROVIDER_TYPES.API:
      if (!configuration.apiKey || typeof configuration.apiKey !== 'string') {
        errors.push('apiKey is required for API providers');
      }
      
      if (configuration.rateLimitPerMinute !== undefined && (!Number.isInteger(configuration.rateLimitPerMinute) || configuration.rateLimitPerMinute < 1)) {
        errors.push('rateLimitPerMinute must be a positive integer');
      }
      break;
    
    case PROVIDER_TYPES.AI:
    case PROVIDER_TYPES.AI_VISION:
      if (!configuration.apiKey || typeof configuration.apiKey !== 'string') {
        errors.push('apiKey is required for AI providers');
      }
      
      if (!configuration.model || typeof configuration.model !== 'string') {
        errors.push('model is required for AI providers');
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate provider configuration updates
 */
function validateProviderUpdates(providerType, updates) {
  const errors = [];
  
  // Only validate provided fields
  if (updates.priority !== undefined && (!Number.isInteger(updates.priority) || updates.priority < 0)) {
    errors.push('priority must be a non-negative integer');
  }
  
  if (updates.timeout !== undefined && (!Number.isInteger(updates.timeout) || updates.timeout < 1000)) {
    errors.push('timeout must be an integer >= 1000ms');
  }
  
  if (updates.enabled !== undefined && typeof updates.enabled !== 'boolean') {
    errors.push('enabled must be a boolean');
  }
  
  if (updates.rateLimitPerMinute !== undefined && (!Number.isInteger(updates.rateLimitPerMinute) || updates.rateLimitPerMinute < 1)) {
    errors.push('rateLimitPerMinute must be a positive integer');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default withAuth(handler);
export { 
  getOrchestrator, 
  initializeDefaultProviders, 
  validateProviderConfiguration, 
  validateProviderUpdates 
};