/**
 * Enhanced Main Orchestrator for Hybrid Scraping with AI Integration
 * 
 * This comprehensive orchestrator manages multiple scraping providers including:
 * - ScraperAPI (fast, free up to 5000/month)
 * - Gemini Flash (generous free tier, 1-2 seconds)
 * - OpenAI GPT-4 Vision (high quality, small cost)
 * 
 * Features:
 * - Intelligent provider selection based on confidence thresholds
 * - Real-time progress reporting with detailed callbacks
 * - Comprehensive usage tracking and cost optimization
 * - Advanced fallback logic with confidence scoring
 * - Quota management across all providers
 * - Performance monitoring and optimization
 * - Cost tracking and budget management
 * - Rate limiting with provider-specific strategies
 */

import { 
  SCRAPING_STATUS, 
  ERROR_TYPES, 
  RETRY_STRATEGIES, 
  DEFAULT_CONFIG,
  TypeValidators,
  PROVIDER_TYPES,
  CONFIDENCE_LEVELS
} from './types.js';

/**
 * Enhanced Main Orchestrator for Hybrid Scraping with AI Integration
 */
export class ScrapingOrchestrator {
  /**
   * Create a new enhanced scraping orchestrator
   * @param {Object} config - Orchestrator configuration
   */
  constructor(config = {}) {
    this.config = {
      // Enhanced retry configuration
      retryConfig: {
        maxAttempts: config.maxAttempts || DEFAULT_CONFIG.MAX_RETRIES,
        baseDelay: config.baseDelay || DEFAULT_CONFIG.RETRY_DELAY,
        maxDelay: config.maxDelay || 30000,
        strategy: config.retryStrategy || RETRY_STRATEGIES.EXPONENTIAL,
        retriableStatusCodes: config.retriableStatusCodes || [429, 500, 502, 503, 504],
        retriableErrors: config.retriableErrors || [
          ERROR_TYPES.NETWORK_ERROR,
          ERROR_TYPES.TIMEOUT_ERROR,
          ERROR_TYPES.RATE_LIMIT_ERROR
        ]
      },
      // Enhanced cache configuration
      cacheConfig: {
        enabled: config.cacheEnabled !== false,
        ttl: config.cacheTtl || DEFAULT_CONFIG.CACHE_TTL,
        maxSize: config.cacheMaxSize || 1000,
        keyPrefix: config.cacheKeyPrefix || 'scraping:'
      },
      // AI and confidence configuration
      confidenceThreshold: config.confidenceThreshold || DEFAULT_CONFIG.CONFIDENCE_THRESHOLD,
      aiConfidenceThreshold: config.aiConfidenceThreshold || 70,
      minConfidenceForSuccess: config.minConfidenceForSuccess || 60,
      parallelProviders: config.parallelProviders || false,
      timeout: config.timeout || DEFAULT_CONFIG.TIMEOUT,
      
      // Cost and quota management
      costTracking: {
        enabled: config.costTrackingEnabled !== false,
        dailyBudget: config.dailyBudget || 10, // $10 daily budget
        monthlyBudget: config.monthlyBudget || 100, // $100 monthly budget
        warningThreshold: config.warningThreshold || 0.8, // 80% budget warning
        stopOnBudgetExceeded: config.stopOnBudgetExceeded !== false
      },
      
      // Provider strategy configuration
      providerStrategy: {
        useSmartFallback: config.useSmartFallback !== false,
        adaptiveTimeout: config.adaptiveTimeout !== false,
        costOptimization: config.costOptimization !== false,
        performanceOptimization: config.performanceOptimization !== false
      },
      
      // Real-time progress configuration
      progressReporting: {
        enabled: config.progressReportingEnabled !== false,
        detailedCallbacks: config.detailedCallbacks !== false,
        performanceMetrics: config.performanceMetrics !== false
      },
      
      ...config
    };

    // Initialize provider registry with enhanced tracking
    this.providers = new Map();
    this.providersByPriority = [];
    this.providersByType = new Map();
    this.aiProviders = new Map();
    this.apiProviders = new Map();
    
    // Initialize cache
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Enhanced metrics tracking
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      providerUsage: new Map(),
      errorCounts: new Map(),
      responseTimeHistory: [],
      
      // Cost and usage tracking
      costTracking: {
        totalCost: 0,
        dailyCost: 0,
        monthlyCost: 0,
        costByProvider: new Map(),
        lastResetDate: new Date().toISOString().split('T')[0]
      },
      
      // Provider performance metrics
      providerPerformance: new Map(),
      
      // AI-specific metrics
      aiMetrics: {
        totalAIRequests: 0,
        successfulAIRequests: 0,
        averageAIConfidence: 0,
        averageAIResponseTime: 0,
        aiCostSavings: 0
      },
      
      // Success rate by confidence level
      confidenceMetrics: new Map(),
      
      // Fallback chain statistics
      fallbackStats: {
        totalFallbacks: 0,
        successfulFallbacks: 0,
        averageFallbackChainLength: 0,
        mostEffectiveProvider: null
      }
    };

    // Initialize usage tracker
    this.usageTracker = null;
    
    // Initialize session tracking
    this.sessionMetrics = {
      startTime: Date.now(),
      requestCount: 0,
      successRate: 0,
      averageConfidence: 0,
      totalCost: 0,
      providersUsed: new Set(),
      fallbackChains: []
    };

    // Initialize logger
    this.logger = config.logger || console;
    
    // Initialize cost tracking
    this.initializeCostTracking();
  }

  /**
   * Initialize cost tracking system
   * @private
   */
  initializeCostTracking() {
    // Reset daily costs if needed
    const today = new Date().toISOString().split('T')[0];
    if (this.metrics.costTracking.lastResetDate !== today) {
      this.metrics.costTracking.dailyCost = 0;
      this.metrics.costTracking.lastResetDate = today;
    }
    
    // Initialize provider cost tracking
    if (!this.metrics.costTracking.costByProvider) {
      this.metrics.costTracking.costByProvider = new Map();
    }
  }

  /**
   * Set usage tracker for centralized usage and cost management
   * @param {UsageTracker} usageTracker - The usage tracker instance
   */
  setUsageTracker(usageTracker) {
    this.usageTracker = usageTracker;
    this.logger.info('Usage tracker attached to orchestrator');
  }

  /**
   * Check if budget limits allow for more requests
   * @returns {Object} - Budget status and available budget
   * @private
   */
  checkBudgetLimits() {
    if (!this.config.costTracking.enabled) {
      return { allowed: true, reason: 'cost tracking disabled' };
    }

    const { dailyBudget, monthlyBudget, warningThreshold, stopOnBudgetExceeded } = this.config.costTracking;
    const { dailyCost, monthlyCost } = this.metrics.costTracking;

    // Check daily budget
    if (dailyCost >= dailyBudget && stopOnBudgetExceeded) {
      return { 
        allowed: false, 
        reason: 'daily budget exceeded',
        dailyCost,
        dailyBudget,
        remaining: 0
      };
    }

    // Check monthly budget
    if (monthlyCost >= monthlyBudget && stopOnBudgetExceeded) {
      return { 
        allowed: false, 
        reason: 'monthly budget exceeded',
        monthlyCost,
        monthlyBudget,
        remaining: 0
      };
    }

    // Check warning thresholds
    const dailyWarning = dailyCost >= (dailyBudget * warningThreshold);
    const monthlyWarning = monthlyCost >= (monthlyBudget * warningThreshold);

    return {
      allowed: true,
      warnings: {
        daily: dailyWarning,
        monthly: monthlyWarning
      },
      remaining: {
        daily: Math.max(0, dailyBudget - dailyCost),
        monthly: Math.max(0, monthlyBudget - monthlyCost)
      }
    };
  }

  /**
   * Track cost for a provider request
   * @param {string} providerName - Provider name
   * @param {number} cost - Cost incurred
   * @private
   */
  trackCost(providerName, cost) {
    if (!this.config.costTracking.enabled || !cost) return;

    // Update total costs
    this.metrics.costTracking.totalCost += cost;
    this.metrics.costTracking.dailyCost += cost;
    this.metrics.costTracking.monthlyCost += cost;

    // Update provider-specific costs
    const providerCost = this.metrics.costTracking.costByProvider.get(providerName) || 0;
    this.metrics.costTracking.costByProvider.set(providerName, providerCost + cost);

    // Update session cost
    this.sessionMetrics.totalCost += cost;

    // Update usage tracker if available
    if (this.usageTracker) {
      this.usageTracker.trackCost(providerName, cost);
    }

    // Log cost warnings
    const budgetStatus = this.checkBudgetLimits();
    if (budgetStatus.warnings) {
      if (budgetStatus.warnings.daily) {
        this.logger.warn(`Daily budget warning: $${this.metrics.costTracking.dailyCost.toFixed(4)} of $${this.config.costTracking.dailyBudget}`);
      }
      if (budgetStatus.warnings.monthly) {
        this.logger.warn(`Monthly budget warning: $${this.metrics.costTracking.monthlyCost.toFixed(4)} of $${this.config.costTracking.monthlyBudget}`);
      }
    }
  }

  /**
   * Enhanced provider registration with type classification
   * @param {ScrapingServiceProvider} provider - The provider to register
   * @throws {Error} - If provider is invalid
   */
  registerProvider(provider) {
    if (!provider || typeof provider.scrape !== 'function') {
      throw new Error('Invalid provider: must implement scrape() method');
    }

    this.providers.set(provider.config.name, provider);
    
    // Classify providers by type for intelligent routing
    const providerType = provider.config.type || PROVIDER_TYPES.API;
    if (!this.providersByType.has(providerType)) {
      this.providersByType.set(providerType, new Map());
    }
    this.providersByType.get(providerType).set(provider.config.name, provider);
    
    // Special classification for AI providers
    if (providerType === PROVIDER_TYPES.AI || providerType === PROVIDER_TYPES.AI_VISION) {
      this.aiProviders.set(provider.config.name, provider);
    } else if (providerType === PROVIDER_TYPES.API) {
      this.apiProviders.set(provider.config.name, provider);
    }
    
    this.updateProviderPriority();
    
    // Initialize enhanced provider metrics
    if (!this.metrics.providerUsage.has(provider.config.name)) {
      this.metrics.providerUsage.set(provider.config.name, {
        requests: 0,
        successes: 0,
        failures: 0,
        averageTime: 0,
        averageConfidence: 0,
        costPerRequest: 0,
        totalCost: 0,
        successRate: 0,
        lastUsed: null,
        consecutiveFailures: 0,
        bestPerformanceWindow: null
      });
    }
    
    // Initialize provider performance tracking
    if (!this.metrics.providerPerformance.has(provider.config.name)) {
      this.metrics.providerPerformance.set(provider.config.name, {
        responseTimeHistory: [],
        confidenceHistory: [],
        successRateHistory: [],
        costHistory: [],
        performanceScore: 100, // Start with perfect score
        reliabilityScore: 100,
        costEfficiencyScore: 100,
        lastPerformanceUpdate: Date.now()
      });
    }

    this.logger.info(`Registered ${providerType} scraping provider: ${provider.config.name}`);
  }

  /**
   * Unregister a scraping provider
   * @param {string} providerName - Name of the provider to unregister
   */
  unregisterProvider(providerName) {
    if (this.providers.has(providerName)) {
      this.providers.delete(providerName);
      this.updateProviderPriority();
      this.logger.info(`Unregistered scraping provider: ${providerName}`);
    }
  }

  /**
   * Update the provider priority list
   * @private
   */
  updateProviderPriority() {
    this.providersByPriority = Array.from(this.providers.values())
      .filter(provider => provider.config.enabled)
      .sort((a, b) => b.config.priority - a.config.priority);
  }

  /**
   * Get providers that can handle a specific URL
   * @param {string} url - URL to check
   * @returns {Array<ScrapingServiceProvider>} - Providers that can handle the URL
   */
  getProvidersForUrl(url) {
    return this.providersByPriority.filter(provider => 
      provider.canHandle(url) && provider.checkRateLimit()
    );
  }

  /**
   * Generate cache key for a request
   * @param {ScrapingRequest} request - The scraping request
   * @returns {string} - Cache key
   * @private
   */
  generateCacheKey(request) {
    const keyData = {
      url: request.url,
      options: request.options || {}
    };
    const keyString = JSON.stringify(keyData);
    return `${this.config.cacheConfig.keyPrefix}${Buffer.from(keyString).toString('base64')}`;
  }

  /**
   * Get cached result if available and not expired
   * @param {string} cacheKey - Cache key
   * @returns {ScrapingResponse|null} - Cached result or null
   * @private
   */
  getCachedResult(cacheKey) {
    if (!this.config.cacheConfig.enabled) {
      return null;
    }

    const result = this.cache.get(cacheKey);
    const timestamp = this.cacheTimestamps.get(cacheKey);

    if (result && timestamp) {
      const age = (Date.now() - timestamp) / 1000;
      if (age < this.config.cacheConfig.ttl) {
        return result;
      } else {
        // Clean up expired cache entry
        this.cache.delete(cacheKey);
        this.cacheTimestamps.delete(cacheKey);
      }
    }

    return null;
  }

  /**
   * Cache a result
   * @param {string} cacheKey - Cache key
   * @param {ScrapingResponse} result - Result to cache
   * @private
   */
  cacheResult(cacheKey, result) {
    if (!this.config.cacheConfig.enabled || !result.success) {
      return;
    }

    // Clean up old cache entries if we're at the limit
    if (this.cache.size >= this.config.cacheConfig.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }

    // Mark as cached for the response
    const cachedResult = {
      ...result,
      metadata: {
        ...result.metadata,
        cacheHit: false // Original result, not a cache hit
      }
    };

    this.cache.set(cacheKey, cachedResult);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  /**
   * Calculate retry delay based on strategy
   * @param {number} attempt - Current attempt number
   * @returns {number} - Delay in milliseconds
   * @private
   */
  calculateRetryDelay(attempt) {
    const { baseDelay, maxDelay, strategy } = this.config.retryConfig;

    switch (strategy) {
      case RETRY_STRATEGIES.FIXED:
        return Math.min(baseDelay, maxDelay);
      
      case RETRY_STRATEGIES.LINEAR:
        return Math.min(baseDelay * attempt, maxDelay);
      
      case RETRY_STRATEGIES.EXPONENTIAL:
        return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      
      default:
        return baseDelay;
    }
  }

  /**
   * Check if an error is retriable
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether the error is retriable
   * @private
   */
  isRetriableError(error) {
    if (!error) return false;

    // Check error type
    if (error.type && this.config.retryConfig.retriableErrors.includes(error.type)) {
      return true;
    }

    // Check status code if available
    if (error.statusCode && this.config.retryConfig.retriableStatusCodes.includes(error.statusCode)) {
      return true;
    }

    return false;
  }

  /**
   * Intelligent provider selection based on multiple factors
   * @param {string} url - URL to scrape
   * @param {Object} options - Request options
   * @returns {Array<ScrapingServiceProvider>} - Ordered list of providers
   * @private
   */
  selectOptimalProviders(url, options = {}) {
    const availableProviders = this.getProvidersForUrl(url);
    
    if (availableProviders.length === 0) {
      return [];
    }

    // Score providers based on multiple factors
    const scoredProviders = availableProviders.map(provider => {
      const metrics = this.metrics.providerUsage.get(provider.config.name);
      const performance = this.metrics.providerPerformance.get(provider.config.name);
      
      let score = provider.config.priority * 10; // Base score from priority
      
      // Factor in success rate
      if (metrics && metrics.requests > 0) {
        score += metrics.successRate * 5;
      }
      
      // Factor in response time (faster is better)
      if (metrics && metrics.averageTime > 0) {
        const timeScore = Math.max(0, 100 - (metrics.averageTime / 100));
        score += timeScore * 3;
      }
      
      // Factor in cost efficiency
      if (this.config.providerStrategy.costOptimization && metrics.costPerRequest > 0) {
        const costScore = Math.max(0, 100 - (metrics.costPerRequest * 1000));
        score += costScore * 2;
      }
      
      // Factor in consecutive failures (penalize unreliable providers)
      if (metrics && metrics.consecutiveFailures > 0) {
        score -= metrics.consecutiveFailures * 20;
      }
      
      // Factor in confidence scores
      if (metrics && metrics.averageConfidence > 0) {
        score += metrics.averageConfidence * 2;
      }
      
      // Boost AI providers if API providers have been failing
      if (this.shouldPreferAIProviders() && this.aiProviders.has(provider.config.name)) {
        score += 50;
      }
      
      return { provider, score };
    });

    // Sort by score (highest first) and return providers
    return scoredProviders
      .sort((a, b) => b.score - a.score)
      .map(item => item.provider);
  }

  /**
   * Determine if AI providers should be preferred based on recent performance
   * @returns {boolean} - Whether to prefer AI providers
   * @private
   */
  shouldPreferAIProviders() {
    // Check if API providers have been consistently failing
    let apiFailureRate = 0;
    let apiProviderCount = 0;
    
    for (const [providerName, provider] of this.apiProviders) {
      const metrics = this.metrics.providerUsage.get(providerName);
      if (metrics && metrics.requests > 0) {
        apiFailureRate += (1 - metrics.successRate);
        apiProviderCount++;
      }
    }
    
    if (apiProviderCount > 0) {
      const avgApiFailureRate = apiFailureRate / apiProviderCount;
      return avgApiFailureRate > 0.3; // If API providers failing >30%, prefer AI
    }
    
    return false;
  }

  /**
   * Get optimal fallback chain based on cost, performance, and reliability
   * @param {string} url - URL to scrape
   * @param {Object} options - Request options
   * @returns {Array<ScrapingServiceProvider>} - Optimal provider chain
   * @private
   */
  getOptimalFallbackChain(url, options = {}) {
    const providers = this.selectOptimalProviders(url, options);
    
    if (!this.config.providerStrategy.useSmartFallback) {
      return providers;
    }

    // Intelligent fallback strategy:
    // 1. Fast, cheap providers first (ScraperAPI)
    // 2. AI providers for fallback (Gemini, then OpenAI)
    // 3. Cost-aware ordering
    
    const apiProviders = providers.filter(p => this.apiProviders.has(p.config.name));
    const aiProviders = providers.filter(p => this.aiProviders.has(p.config.name));
    
    // Sort AI providers by cost (cheapest first)
    const sortedAIProviders = aiProviders.sort((a, b) => {
      const aCost = this.metrics.providerUsage.get(a.config.name)?.costPerRequest || 0;
      const bCost = this.metrics.providerUsage.get(b.config.name)?.costPerRequest || 0;
      return aCost - bCost;
    });
    
    // Create optimal chain: API first, then AI by cost
    return [...apiProviders, ...sortedAIProviders];
  }

  /**
   * Update provider performance scores based on recent results
   * @param {string} providerName - Provider name
   * @param {Object} result - Scraping result
   * @param {number} duration - Request duration
   * @param {number} cost - Request cost
   * @private
   */
  updateProviderPerformance(providerName, result, duration, cost = 0) {
    const metrics = this.metrics.providerUsage.get(providerName);
    const performance = this.metrics.providerPerformance.get(providerName);
    
    if (!metrics || !performance) return;

    // Update usage metrics
    metrics.requests++;
    metrics.lastUsed = Date.now();
    
    if (result.success) {
      metrics.successes++;
      metrics.consecutiveFailures = 0;
      
      // Update confidence tracking
      if (result.confidence) {
        const totalConfidence = metrics.averageConfidence * (metrics.successes - 1) + result.confidence;
        metrics.averageConfidence = totalConfidence / metrics.successes;
      }
    } else {
      metrics.failures++;
      metrics.consecutiveFailures++;
    }
    
    // Update success rate
    metrics.successRate = metrics.successes / metrics.requests;
    
    // Update timing
    const totalTime = metrics.averageTime * (metrics.requests - 1) + duration;
    metrics.averageTime = totalTime / metrics.requests;
    
    // Update cost tracking
    if (cost > 0) {
      const totalCost = metrics.totalCost + cost;
      metrics.totalCost = totalCost;
      metrics.costPerRequest = totalCost / metrics.requests;
    }
    
    // Update performance history (keep last 50 results)
    performance.responseTimeHistory.push(duration);
    if (performance.responseTimeHistory.length > 50) {
      performance.responseTimeHistory.shift();
    }
    
    if (result.confidence) {
      performance.confidenceHistory.push(result.confidence);
      if (performance.confidenceHistory.length > 50) {
        performance.confidenceHistory.shift();
      }
    }
    
    performance.successRateHistory.push(result.success ? 1 : 0);
    if (performance.successRateHistory.length > 50) {
      performance.successRateHistory.shift();
    }
    
    if (cost > 0) {
      performance.costHistory.push(cost);
      if (performance.costHistory.length > 50) {
        performance.costHistory.shift();
      }
    }
    
    // Calculate performance scores
    this.calculatePerformanceScores(providerName);
  }

  /**
   * Calculate comprehensive performance scores for a provider
   * @param {string} providerName - Provider name
   * @private
   */
  calculatePerformanceScores(providerName) {
    const metrics = this.metrics.providerUsage.get(providerName);
    const performance = this.metrics.providerPerformance.get(providerName);
    
    if (!metrics || !performance) return;

    // Reliability score (based on success rate and consecutive failures)
    let reliabilityScore = metrics.successRate * 100;
    reliabilityScore -= Math.min(metrics.consecutiveFailures * 10, 50);
    performance.reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));
    
    // Performance score (based on response time)
    const avgResponseTime = performance.responseTimeHistory.length > 0 ?
      performance.responseTimeHistory.reduce((a, b) => a + b, 0) / performance.responseTimeHistory.length :
      metrics.averageTime;
    
    const performanceScore = Math.max(0, 100 - (avgResponseTime / 100));
    performance.performanceScore = Math.max(0, Math.min(100, performanceScore));
    
    // Cost efficiency score
    if (performance.costHistory.length > 0) {
      const avgCost = performance.costHistory.reduce((a, b) => a + b, 0) / performance.costHistory.length;
      const costEfficiencyScore = Math.max(0, 100 - (avgCost * 1000));
      performance.costEfficiencyScore = Math.max(0, Math.min(100, costEfficiencyScore));
    }
    
    performance.lastPerformanceUpdate = Date.now();
  }

  /**
   * Estimate the cost for a request based on URL and available providers
   * @param {string} url - URL to scrape
   * @returns {number} - Estimated cost in dollars
   * @private
   */
  estimateRequestCost(url) {
    const providers = this.getOptimalFallbackChain(url);
    if (providers.length === 0) return 0;
    
    // Return cost of the first (cheapest) provider
    const firstProvider = providers[0];
    const metrics = this.metrics.providerUsage.get(firstProvider.config.name);
    return metrics?.costPerRequest || 0.001; // Default small cost
  }

  /**
   * Estimate cost for a specific provider
   * @param {string} providerName - Provider name
   * @returns {number} - Estimated cost in dollars
   * @private
   */
  estimateProviderCost(providerName) {
    const metrics = this.metrics.providerUsage.get(providerName);
    return metrics?.costPerRequest || 0.001; // Default small cost
  }

  /**
   * Enhanced scrape method with intelligent provider selection and comprehensive tracking
   * @param {ScrapingRequest} request - The scraping request
   * @param {ProgressCallback} onProgress - Progress callback
   * @returns {Promise<ScrapingResponse>} - The scraping response
   */
  async scrape(request, onProgress = null) {
    const startTime = Date.now();
    this.sessionMetrics.requestCount++;
    
    // Validate request
    if (!TypeValidators.isScrapingRequest(request)) {
      throw new Error('Invalid scraping request');
    }

    // Check budget limits
    const budgetStatus = this.checkBudgetLimits();
    if (!budgetStatus.allowed) {
      const error = new Error(`Budget limit exceeded: ${budgetStatus.reason}`);
      error.type = ERROR_TYPES.RATE_LIMIT_ERROR;
      return this.createFailureResponse(request, error, Date.now() - startTime, {
        budgetExceeded: true,
        budgetStatus
      });
    }

    // Enhanced progress reporting
    if (onProgress && this.config.progressReporting.enabled) {
      onProgress({
        stage: 'initialization',
        progress: 5,
        message: 'Initializing scraping request',
        details: { 
          url: request.url,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionMetrics.startTime,
          budgetRemaining: budgetStatus.remaining
        }
      });
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cachedResult = this.getCachedResult(cacheKey);
    
    if (cachedResult) {
      this.metrics.cacheHits++;
      this.updateMetrics(true, Date.now() - startTime, true);
      
      // Mark as cache hit
      const cacheHitResult = {
        ...cachedResult,
        metadata: {
          ...cachedResult.metadata,
          cacheHit: true,
          sessionMetrics: this.sessionMetrics
        }
      };
      
      if (onProgress) {
        onProgress({
          stage: 'cache',
          progress: 100,
          message: 'Result retrieved from cache',
          details: { 
            cacheKey,
            cacheAge: (Date.now() - this.cacheTimestamps.get(cacheKey)) / 1000,
            costSaved: this.estimateRequestCost(request.url)
          }
        });
      }
      
      return cacheHitResult;
    }

    // Get optimal provider chain using intelligent selection
    const optimalProviders = this.getOptimalFallbackChain(request.url, request.options);
    
    if (optimalProviders.length === 0) {
      const error = new Error('No available providers for this URL');
      error.type = ERROR_TYPES.CONFIGURATION_ERROR;
      return this.createFailureResponse(request, error, Date.now() - startTime, {
        providersChecked: this.providers.size,
        supportedDomains: Array.from(this.providers.values()).map(p => p.config.supportedDomains).flat()
      });
    }

    // Enhanced progress tracking
    if (onProgress) {
      const providerDetails = optimalProviders.map(p => ({
        name: p.config.name,
        type: p.config.type,
        priority: p.config.priority,
        estimatedCost: this.estimateProviderCost(p.config.name),
        performance: this.metrics.providerPerformance.get(p.config.name)
      }));

      onProgress({
        stage: 'provider-selection',
        progress: 15,
        message: `Selected ${optimalProviders.length} providers for fallback chain`,
        details: { 
          providers: providerDetails,
          strategy: this.config.providerStrategy.useSmartFallback ? 'smart' : 'priority',
          budgetRemaining: budgetStatus.remaining,
          url: request.url
        }
      });
    }

    // Track fallback chain for analytics
    this.sessionMetrics.fallbackChains.push({
      url: request.url,
      providers: optimalProviders.map(p => p.config.name),
      startTime: Date.now()
    });

    // If parallel providers is enabled and we have multiple providers, try them in parallel
    if (this.config.parallelProviders && optimalProviders.length > 1) {
      return this.scrapeWithParallelProviders(request, optimalProviders, onProgress, startTime);
    }

    // Sequential fallback approach with enhanced tracking
    return this.scrapeWithEnhancedSequentialFallback(request, optimalProviders, onProgress, startTime);
  }

  /**
   * Scrape using parallel providers (race condition)
   * @param {ScrapingRequest} request - The scraping request
   * @param {Array<ScrapingServiceProvider>} providers - Available providers
   * @param {ProgressCallback} onProgress - Progress callback
   * @param {number} startTime - Start time
   * @returns {Promise<ScrapingResponse>} - The scraping response
   * @private
   */
  async scrapeWithParallelProviders(request, providers, onProgress, startTime) {
    const promises = providers.map(provider => 
      this.scrapeWithProvider(request, provider, onProgress)
    );

    try {
      // Wait for the first successful result
      const result = await Promise.race(promises);
      
      if (result.success) {
        this.cacheResult(this.generateCacheKey(request), result);
        this.updateMetrics(true, Date.now() - startTime, false);
        return result;
      }
    } catch (error) {
      // If all parallel attempts fail, fall back to sequential
      this.logger.warn('Parallel scraping failed, falling back to sequential');
    }

    // Fallback to sequential if parallel fails
    return this.scrapeWithSequentialFallback(request, providers, onProgress, startTime);
  }

  /**
   * Enhanced sequential fallback with comprehensive tracking and intelligent decisions
   * @param {ScrapingRequest} request - The scraping request
   * @param {Array<ScrapingServiceProvider>} providers - Available providers
   * @param {ProgressCallback} onProgress - Progress callback
   * @param {number} startTime - Start time
   * @returns {Promise<ScrapingResponse>} - The scraping response
   * @private
   */
  async scrapeWithEnhancedSequentialFallback(request, providers, onProgress, startTime) {
    let lastError = null;
    const attemptedProviders = [];
    const fallbackChain = {
      url: request.url,
      startTime: Date.now(),
      providers: providers.map(p => p.config.name),
      results: []
    };

    // Track fallback statistics
    this.metrics.fallbackStats.totalFallbacks++;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const providerStartTime = Date.now();
      attemptedProviders.push(provider.config.name);

      // Check budget before each provider attempt
      const budgetStatus = this.checkBudgetLimits();
      if (!budgetStatus.allowed) {
        const error = new Error(`Budget limit exceeded during fallback: ${budgetStatus.reason}`);
        error.type = ERROR_TYPES.RATE_LIMIT_ERROR;
        lastError = error;
        break;
      }

      try {
        // Enhanced progress reporting
        if (onProgress) {
          const progressPercent = 20 + (i * 60 / providers.length);
          const estimatedCost = this.estimateProviderCost(provider.config.name);
          const providerMetrics = this.metrics.providerUsage.get(provider.config.name);

          onProgress({
            stage: 'provider-attempt',
            progress: progressPercent,
            message: `Attempting provider: ${provider.config.name} (${i + 1}/${providers.length})`,
            details: { 
              provider: {
                name: provider.config.name,
                type: provider.config.type,
                priority: provider.config.priority,
                estimatedCost,
                successRate: providerMetrics?.successRate || 0,
                averageTime: providerMetrics?.averageTime || 0
              },
              fallbackChain: {
                attempted: attemptedProviders.length,
                remaining: providers.length - i - 1,
                totalProviders: providers.length
              },
              session: {
                requestCount: this.sessionMetrics.requestCount,
                totalCost: this.sessionMetrics.totalCost,
                successRate: this.sessionMetrics.successRate
              },
              budgetRemaining: budgetStatus.remaining
            }
          });
        }

        // Track providers used in session
        this.sessionMetrics.providersUsed.add(provider.config.name);

        const result = await this.scrapeWithRetry(request, provider, onProgress);
        const duration = Date.now() - providerStartTime;
        
        // Enhanced result tracking
        const resultData = {
          provider: provider.config.name,
          success: result.success,
          confidence: result.confidence || 0,
          duration,
          cost: result.metadata?.cost || 0,
          error: result.error?.message
        };
        
        fallbackChain.results.push(resultData);

        // Update provider performance with cost tracking
        this.updateProviderPerformance(provider.config.name, result, duration, result.metadata?.cost);
        
        // Track cost if available
        if (result.metadata?.cost) {
          this.trackCost(provider.config.name, result.metadata.cost);
        }

        // Check if result meets our confidence threshold
        const confidenceThreshold = this.aiProviders.has(provider.config.name) 
          ? this.config.aiConfidenceThreshold 
          : this.config.confidenceThreshold;
        
        if (result.success && result.confidence >= confidenceThreshold) {
          // Success! Cache the result and return
          this.cacheResult(this.generateCacheKey(request), result);
          this.updateMetrics(true, Date.now() - startTime, false);
          
          // Update session metrics
          this.sessionMetrics.successRate = this.metrics.successfulRequests / this.metrics.totalRequests;
          this.sessionMetrics.averageConfidence = 
            (this.sessionMetrics.averageConfidence * (this.sessionMetrics.requestCount - 1) + result.confidence) / 
            this.sessionMetrics.requestCount;
          
          // Update fallback statistics
          this.metrics.fallbackStats.successfulFallbacks++;
          const chainLength = attemptedProviders.length;
          this.metrics.fallbackStats.averageFallbackChainLength = 
            (this.metrics.fallbackStats.averageFallbackChainLength * (this.metrics.fallbackStats.successfulFallbacks - 1) + chainLength) / 
            this.metrics.fallbackStats.successfulFallbacks;
          
          // Track most effective provider
          if (!this.metrics.fallbackStats.mostEffectiveProvider || 
              chainLength < this.getProviderPosition(this.metrics.fallbackStats.mostEffectiveProvider, providers)) {
            this.metrics.fallbackStats.mostEffectiveProvider = provider.config.name;
          }
          
          // Update result metadata with enhanced information
          result.metadata = {
            ...result.metadata,
            providersAttempted: attemptedProviders,
            totalAttempts: attemptedProviders.length,
            fallbackChain,
            sessionMetrics: this.sessionMetrics,
            costTracking: {
              sessionCost: this.sessionMetrics.totalCost,
              dailyCost: this.metrics.costTracking.dailyCost,
              budgetRemaining: budgetStatus.remaining
            },
            performanceOptimization: {
              intelligentSelection: this.config.providerStrategy.useSmartFallback,
              costOptimization: this.config.providerStrategy.costOptimization,
              adaptiveTimeout: this.config.providerStrategy.adaptiveTimeout
            }
          };
          
          // Final progress update
          if (onProgress) {
            onProgress({
              stage: 'success',
              progress: 100,
              message: `Successfully extracted data using ${provider.config.name}`,
              details: {
                provider: provider.config.name,
                confidence: result.confidence,
                duration: Date.now() - startTime,
                cost: result.metadata?.cost || 0,
                fallbackPosition: i + 1,
                totalProviders: providers.length
              }
            });
          }
          
          return result;
        } else if (result.success && result.confidence < confidenceThreshold) {
          // Low confidence result - continue to next provider but keep as backup
          this.logger.warn(`Provider ${provider.config.name} returned low confidence result: ${result.confidence}%, threshold: ${confidenceThreshold}%`);
          lastError = new Error(`Low confidence result: ${result.confidence}%`);
        } else {
          lastError = result.error;
        }

      } catch (error) {
        const duration = Date.now() - providerStartTime;
        lastError = error;
        
        // Track failed attempt
        fallbackChain.results.push({
          provider: provider.config.name,
          success: false,
          confidence: 0,
          duration,
          cost: 0,
          error: error.message
        });
        
        // Update provider performance for failure
        this.updateProviderPerformance(provider.config.name, { success: false, confidence: 0 }, duration);
        
        this.logger.warn(`Provider ${provider.config.name} failed:`, error.message);
        
        // Progress update for failure
        if (onProgress) {
          onProgress({
            stage: 'provider-failed',
            progress: 20 + ((i + 0.5) * 60 / providers.length),
            message: `Provider ${provider.config.name} failed: ${error.message}`,
            details: {
              provider: provider.config.name,
              error: error.message,
              remainingProviders: providers.length - i - 1,
              fallbackStrategy: 'continuing'
            }
          });
        }
      }
    }

    // All providers failed
    fallbackChain.endTime = Date.now();
    fallbackChain.totalDuration = fallbackChain.endTime - fallbackChain.startTime;
    
    const finalError = lastError || new Error('All providers failed');
    const response = this.createFailureResponse(request, finalError, Date.now() - startTime, {
      providersAttempted: attemptedProviders,
      totalAttempts: attemptedProviders.length,
      fallbackChain,
      sessionMetrics: this.sessionMetrics,
      enhancedTracking: true
    });
    
    this.updateMetrics(false, Date.now() - startTime, false);
    
    // Update session failure tracking
    this.sessionMetrics.successRate = this.metrics.successfulRequests / this.metrics.totalRequests;
    
    // Final progress update for complete failure
    if (onProgress) {
      onProgress({
        stage: 'complete-failure',
        progress: 100,
        message: `All ${attemptedProviders.length} providers failed`,
        details: {
          attemptedProviders,
          totalDuration: Date.now() - startTime,
          finalError: finalError.message,
          fallbackChain
        }
      });
    }
    
    return response;
  }

  /**
   * Get the position of a provider in the provider list
   * @param {string} providerName - Provider name
   * @param {Array} providers - Provider list
   * @returns {number} - Position (1-based)
   * @private
   */
  getProviderPosition(providerName, providers) {
    for (let i = 0; i < providers.length; i++) {
      if (providers[i].config.name === providerName) {
        return i + 1;
      }
    }
    return Infinity;
  }

  /**
   * Legacy sequential fallback for backward compatibility
   * @param {ScrapingRequest} request - The scraping request
   * @param {Array<ScrapingServiceProvider>} providers - Available providers
   * @param {ProgressCallback} onProgress - Progress callback
   * @param {number} startTime - Start time
   * @returns {Promise<ScrapingResponse>} - The scraping response
   * @private
   */
  async scrapeWithSequentialFallback(request, providers, onProgress, startTime) {
    let lastError = null;
    const attemptedProviders = [];

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      attemptedProviders.push(provider.config.name);

      try {
        if (onProgress) {
          onProgress({
            stage: 'scraping',
            progress: 20 + (i * 60 / providers.length),
            message: `Trying provider: ${provider.config.name}`,
            details: { 
              provider: provider.config.name,
              attempt: i + 1,
              total: providers.length
            }
          });
        }

        const result = await this.scrapeWithRetry(request, provider, onProgress);
        
        if (result.success && result.confidence >= this.config.confidenceThreshold) {
          // Success! Cache the result and return
          this.cacheResult(this.generateCacheKey(request), result);
          this.updateMetrics(true, Date.now() - startTime, false);
          
          // Update result metadata
          result.metadata.providersAttempted = attemptedProviders;
          result.metadata.totalAttempts = attemptedProviders.length;
          
          return result;
        }

        lastError = result.error;
      } catch (error) {
        lastError = error;
        this.logger.warn(`Provider ${provider.config.name} failed:`, error.message);
      }
    }

    // All providers failed
    const finalError = lastError || new Error('All providers failed');
    const response = this.createFailureResponse(request, finalError, Date.now() - startTime);
    response.metadata.providersAttempted = attemptedProviders;
    response.metadata.totalAttempts = attemptedProviders.length;
    
    this.updateMetrics(false, Date.now() - startTime, false);
    return response;
  }

  /**
   * Scrape with a specific provider and retry logic
   * @param {ScrapingRequest} request - The scraping request
   * @param {ScrapingServiceProvider} provider - The provider to use
   * @param {ProgressCallback} onProgress - Progress callback
   * @returns {Promise<ScrapingResponse>} - The scraping response
   * @private
   */
  async scrapeWithRetry(request, provider, onProgress) {
    const { maxAttempts } = this.config.retryConfig;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (onProgress && attempt > 1) {
          onProgress({
            stage: 'retry',
            progress: 50 + (attempt * 10),
            message: `Retry attempt ${attempt} with ${provider.config.name}`,
            details: { 
              provider: provider.config.name,
              attempt,
              maxAttempts
            }
          });
        }

        const result = await this.scrapeWithProvider(request, provider, onProgress);
        
        // Update provider metrics
        const providerMetrics = this.metrics.providerUsage.get(provider.config.name);
        if (providerMetrics) {
          providerMetrics.requests++;
          if (result.success) {
            providerMetrics.successes++;
          } else {
            providerMetrics.failures++;
          }
        }

        if (result.success) {
          return result;
        }

        lastError = result.error;
        
        // Check if we should retry
        if (attempt < maxAttempts && this.isRetriableError(lastError)) {
          const delay = this.calculateRetryDelay(attempt);
          this.logger.info(`Retrying in ${delay}ms... (attempt ${attempt}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts && this.isRetriableError(error)) {
          const delay = this.calculateRetryDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Scrape with a specific provider
   * @param {ScrapingRequest} request - The scraping request
   * @param {ScrapingServiceProvider} provider - The provider to use
   * @param {ProgressCallback} onProgress - Progress callback
   * @returns {Promise<ScrapingResponse>} - The scraping response
   * @private
   */
  async scrapeWithProvider(request, provider, onProgress) {
    const providerStartTime = Date.now();
    
    try {
      const result = await provider.scrape(request, onProgress);
      const duration = Date.now() - providerStartTime;
      
      // Update provider timing
      const providerMetrics = this.metrics.providerUsage.get(provider.config.name);
      if (providerMetrics) {
        providerMetrics.averageTime = 
          (providerMetrics.averageTime * (providerMetrics.requests - 1) + duration) / 
          providerMetrics.requests;
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - providerStartTime;
      
      // Track error
      const errorKey = `${provider.config.name}:${error.type || 'unknown'}`;
      this.metrics.errorCounts.set(errorKey, (this.metrics.errorCounts.get(errorKey) || 0) + 1);
      
      throw error;
    }
  }

  /**
   * Create a failure response with enhanced metadata
   * @param {ScrapingRequest} request - The original request
   * @param {Error} error - The error that occurred
   * @param {number} duration - Operation duration
   * @param {Object} additionalMetadata - Additional metadata to include
   * @returns {ScrapingResponse} - Failure response
   * @private
   */
  createFailureResponse(request, error, duration, additionalMetadata = {}) {
    return {
      success: false,
      data: null,
      confidence: 0,
      provider: 'orchestrator',
      duration,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: 'RealtorCRM-ScrapingOrchestrator/1.0',
        providersAttempted: [],
        totalAttempts: 0,
        cacheHit: false,
        sessionMetrics: this.sessionMetrics,
        costTracking: {
          dailyCost: this.metrics.costTracking.dailyCost,
          totalCost: this.metrics.costTracking.totalCost
        },
        performance: {
          duration,
          confidence: 0,
          provider: 'orchestrator'
        },
        ...additionalMetadata
      },
      error
    };
  }

  /**
   * Update orchestrator metrics
   * @param {boolean} success - Whether the operation was successful
   * @param {number} duration - Operation duration
   * @param {boolean} cacheHit - Whether this was a cache hit
   * @private
   */
  updateMetrics(success, duration, cacheHit) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (cacheHit) {
      this.metrics.cacheHits++;
    }

    // Update response time
    this.metrics.responseTimeHistory.push(duration);
    if (this.metrics.responseTimeHistory.length > 100) {
      this.metrics.responseTimeHistory.shift();
    }

    this.metrics.averageResponseTime = 
      this.metrics.responseTimeHistory.reduce((sum, time) => sum + time, 0) / 
      this.metrics.responseTimeHistory.length;
  }

  /**
   * Get orchestrator metrics
   * @returns {Object} - Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      providerUsage: Object.fromEntries(this.metrics.providerUsage),
      errorCounts: Object.fromEntries(this.metrics.errorCounts),
      cacheStats: {
        size: this.cache.size,
        maxSize: this.config.cacheConfig.maxSize,
        hitRate: this.metrics.totalRequests > 0 ? 
          (this.metrics.cacheHits / this.metrics.totalRequests) * 100 : 0
      }
    };
  }

  /**
   * Get orchestrator status
   * @returns {Object} - Current status
   */
  getStatus() {
    const providerStatuses = Array.from(this.providers.values()).map(p => p.getStatus());
    const healthyProviders = providerStatuses.filter(p => p.healthy).length;
    
    return {
      healthy: healthyProviders > 0,
      totalProviders: this.providers.size,
      healthyProviders,
      metrics: this.getMetrics(),
      config: {
        retryConfig: this.config.retryConfig,
        cacheConfig: this.config.cacheConfig,
        confidenceThreshold: this.config.confidenceThreshold
      },
      providers: providerStatuses
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // Cleanup all providers
    for (const provider of this.providers.values()) {
      try {
        await provider.cleanup();
      } catch (error) {
        this.logger.warn(`Error cleaning up provider ${provider.config.name}:`, error);
      }
    }

    // Clear cache
    this.clearCache();
    
    this.logger.info('Scraping orchestrator cleanup completed');
  }
}

export default ScrapingOrchestrator;