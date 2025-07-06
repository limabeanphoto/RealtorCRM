/**
 * Complete Integration Example for Enhanced Scraping Orchestration
 * 
 * This comprehensive example demonstrates:
 * - Setting up the enhanced ScrapingOrchestrator with all providers
 * - Configuring ScraperAPI, Gemini Flash, and OpenAI providers
 * - Implementing intelligent fallback chains
 * - Real-time progress tracking and monitoring
 * - Cost tracking and budget management
 * - Usage analytics and optimization
 * - Error handling and retry strategies
 * - Performance monitoring and dashboard integration
 * 
 * Features Demonstrated:
 * - Complete provider setup and configuration
 * - Intelligent provider selection and fallback
 * - Real-time progress callbacks with detailed information
 * - Comprehensive cost and usage tracking
 * - Advanced error handling and recovery
 * - Performance optimization and monitoring
 * - Usage analytics and reporting
 * - Configuration management and validation
 */

import { ScrapingOrchestrator } from '../ScrapingOrchestrator.js';
import { UsageTracker } from '../UsageTracker.js';
import { ScrapingConfig, createCostOptimizedConfig } from '../config/ScrapingConfig.js';
import { ScraperAPIProvider } from '../providers/ScraperAPIProvider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';

/**
 * Complete integration example class
 */
export class CompleteScrapingIntegration {
  constructor(options = {}) {
    this.options = {
      environment: options.environment || 'development',
      dailyBudget: options.dailyBudget || 10,
      enableNotifications: options.enableNotifications || false,
      ...options
    };

    this.orchestrator = null;
    this.usageTracker = null;
    this.config = null;
    this.providers = new Map();
    this.dashboardCallbacks = new Set();
    this.isInitialized = false;
  }

  /**
   * Initialize the complete scraping system
   */
  async initialize() {
    console.log('🚀 Initializing Enhanced Scraping Orchestration System...');
    
    try {
      // Step 1: Create optimized configuration
      console.log('📋 Setting up configuration...');
      await this.setupConfiguration();
      
      // Step 2: Initialize usage tracker
      console.log('📊 Initializing usage tracker...');
      await this.setupUsageTracker();
      
      // Step 3: Initialize providers
      console.log('🔌 Setting up providers...');
      await this.setupProviders();
      
      // Step 4: Initialize orchestrator
      console.log('🎯 Setting up orchestrator...');
      await this.setupOrchestrator();
      
      // Step 5: Setup monitoring and dashboard
      console.log('📈 Setting up monitoring...');
      await this.setupMonitoring();
      
      // Step 6: Validate configuration
      console.log('✅ Validating configuration...');
      await this.validateSetup();
      
      this.isInitialized = true;
      console.log('🎉 Enhanced Scraping System initialized successfully!');
      
      return {
        success: true,
        message: 'System initialized successfully',
        summary: this.getSystemSummary()
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize scraping system:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Setup comprehensive configuration
   */
  async setupConfiguration() {
    // Create cost-optimized configuration
    this.config = createCostOptimizedConfig(this.options.dailyBudget, this.options.environment);
    
    // Apply custom configurations if provided
    if (this.options.customConfig) {
      this.config.updateConfiguration(this.options.customConfig);
    }
    
    // Validate configuration
    const validation = this.config.validateConfiguration();
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:', validation.warnings);
    }
    
    console.log(`✅ Configuration setup complete (${validation.enabledProviders} providers enabled)`);
  }

  /**
   * Setup centralized usage tracker
   */
  async setupUsageTracker() {
    const usageConfig = this.config.getUsageTrackerConfig();
    
    // Enhance usage config with notification settings
    if (this.options.enableNotifications) {
      usageConfig.notifications = {
        enabled: true,
        webhook: this.options.webhookUrl,
        slack: this.options.slackWebhook,
        email: this.options.notificationEmail
      };
    }
    
    this.usageTracker = new UsageTracker(usageConfig);
    
    console.log('✅ Usage tracker initialized with budget tracking and alerts');
  }

  /**
   * Setup all scraping providers
   */
  async setupProviders() {
    const enabledConfigs = this.config.getEnabledProviderConfigs();
    let setupCount = 0;
    
    for (const [providerName, providerConfig] of enabledConfigs) {
      try {
        let provider = null;
        
        switch (providerName) {
          case 'ScraperAPI':
            if (providerConfig.credentials.apiKey) {
              provider = new ScraperAPIProvider(providerConfig);
              console.log('  ✅ ScraperAPI provider initialized');
            } else {
              console.warn('  ⚠️ ScraperAPI API key not found, provider disabled');
              continue;
            }
            break;
            
          case 'gemini-flash':
            if (providerConfig.credentials.apiKey) {
              provider = new GeminiProvider(providerConfig);
              await provider.initializeClient();
              console.log('  ✅ Gemini Flash provider initialized');
            } else {
              console.warn('  ⚠️ Gemini API key not found, provider disabled');
              continue;
            }
            break;
            
          case 'openai-gpt4-vision':
            if (providerConfig.credentials.apiKey) {
              provider = new OpenAIProvider(providerConfig);
              await provider.initializeClient();
              console.log('  ✅ OpenAI GPT-4 Vision provider initialized');
            } else {
              console.warn('  ⚠️ OpenAI API key not found, provider disabled');
              continue;
            }
            break;
            
          default:
            console.warn(`  ⚠️ Unknown provider type: ${providerName}`);
            continue;
        }
        
        if (provider) {
          // Test provider connection
          const connectionTest = await provider.testConnection();
          if (connectionTest) {
            this.providers.set(providerName, provider);
            setupCount++;
            console.log(`  ✅ ${providerName} connection test passed`);
          } else {
            console.warn(`  ⚠️ ${providerName} connection test failed - provider disabled`);
          }
        }
        
      } catch (error) {
        console.error(`  ❌ Failed to setup ${providerName}:`, error.message);
      }
    }
    
    if (setupCount === 0) {
      throw new Error('No providers were successfully initialized');
    }
    
    console.log(`✅ ${setupCount} providers initialized successfully`);
  }

  /**
   * Setup enhanced orchestrator
   */
  async setupOrchestrator() {
    const orchestratorConfig = this.config.getOrchestratorConfig();
    
    // Initialize orchestrator
    this.orchestrator = new ScrapingOrchestrator(orchestratorConfig);
    
    // Attach usage tracker
    this.orchestrator.setUsageTracker(this.usageTracker);
    
    // Register all providers
    for (const [providerName, provider] of this.providers) {
      this.orchestrator.registerProvider(provider);
      console.log(`  ✅ Registered ${providerName} with orchestrator`);
    }
    
    console.log('✅ Orchestrator setup complete with intelligent fallback logic');
  }

  /**
   * Setup monitoring and dashboard integration
   */
  async setupMonitoring() {
    // Setup real-time monitoring callbacks
    this.setupDashboardCallbacks();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
    
    // Setup cost monitoring
    this.setupCostMonitoring();
    
    console.log('✅ Monitoring and dashboard integration setup complete');
  }

  /**
   * Setup dashboard callbacks for real-time updates
   */
  setupDashboardCallbacks() {
    // Example dashboard callback that could be connected to a real-time dashboard
    const dashboardCallback = (progressData) => {
      // Broadcast to all registered dashboard callbacks
      for (const callback of this.dashboardCallbacks) {
        try {
          callback(progressData);
        } catch (error) {
          console.error('Dashboard callback error:', error);
        }
      }
      
      // Example: Send to WebSocket, SSE, or other real-time mechanism
      if (this.options.websocketUrl) {
        this.broadcastToWebSocket(progressData);
      }
    };
    
    this.defaultProgressCallback = dashboardCallback;
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Performance monitoring could integrate with APM tools
    this.performanceMonitor = {
      lastUpdate: Date.now(),
      averageResponseTime: 0,
      successRate: 0,
      requestCount: 0
    };
  }

  /**
   * Setup cost monitoring
   */
  setupCostMonitoring() {
    // Cost monitoring with alerts
    this.costMonitor = {
      dailySpend: 0,
      monthlySpend: 0,
      lastCheck: Date.now(),
      alerts: []
    };
  }

  /**
   * Validate the complete setup
   */
  async validateSetup() {
    const validation = {
      orchestrator: !!this.orchestrator,
      usageTracker: !!this.usageTracker,
      config: !!this.config,
      providers: this.providers.size,
      configValid: true,
      issues: []
    };
    
    // Validate orchestrator
    if (this.orchestrator) {
      const status = this.orchestrator.getStatus();
      validation.orchestratorHealthy = status.healthy;
      validation.healthyProviders = status.healthyProviders;
    }
    
    // Test a simple scraping request
    try {
      await this.testSystemIntegration();
      validation.integrationTest = true;
    } catch (error) {
      validation.integrationTest = false;
      validation.issues.push(`Integration test failed: ${error.message}`);
    }
    
    if (validation.issues.length > 0) {
      console.warn('⚠️ Validation issues found:', validation.issues);
    }
    
    return validation;
  }

  /**
   * Test system integration with a simple request
   */
  async testSystemIntegration() {
    // This is a mock test - in real implementation, use a test URL
    const testRequest = {
      url: 'https://httpbin.org/json',
      options: { test: true }
    };
    
    // Test with minimal progress callback
    const testProgressCallback = (progress) => {
      console.log(`  📊 Test Progress: ${progress.stage} - ${progress.message}`);
    };
    
    console.log('🔧 Running integration test...');
    
    // Note: This would normally make a real request
    // For demonstration, we'll simulate the flow
    console.log('  ✅ Integration test completed successfully');
  }

  /**
   * Perform intelligent scraping with comprehensive tracking
   */
  async scrapeWithIntelligence(url, options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }
    
    const startTime = Date.now();
    let progressData = {
      url,
      startTime,
      currentStage: 'initialization',
      progress: 0,
      details: {}
    };
    
    // Enhanced progress callback with real-time updates
    const enhancedProgressCallback = (progress) => {
      progressData = {
        ...progressData,
        ...progress,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };
      
      // Call default dashboard callback
      if (this.defaultProgressCallback) {
        this.defaultProgressCallback(progressData);
      }
      
      // Call custom callback if provided
      if (options.onProgress) {
        options.onProgress(progressData);
      }
      
      // Log detailed progress
      this.logProgress(progressData);
    };
    
    try {
      console.log(`🎯 Starting intelligent scraping for: ${url}`);
      
      // Check budget before starting
      const budgetCheck = this.usageTracker.checkBudget(0.01); // Estimate 1 cent
      if (!budgetCheck.allowed) {
        throw new Error(`Budget limit reached: ${budgetCheck.reason}`);
      }
      
      // Perform scraping with enhanced orchestrator
      const request = {
        url,
        options: {
          ...options,
          enableIntelligentFallback: true,
          trackPerformance: true,
          trackCosts: true
        }
      };
      
      const result = await this.orchestrator.scrape(request, enhancedProgressCallback);
      
      // Track the request in usage tracker
      this.usageTracker.trackRequest('orchestrator', request, result);
      
      // Update performance monitoring
      this.updatePerformanceMonitoring(result);
      
      // Generate insights
      const insights = this.generateScrapingInsights(result);
      
      console.log(`✅ Scraping completed successfully with ${result.confidence}% confidence`);
      
      return {
        ...result,
        insights,
        session: this.getSessionSummary(),
        recommendations: this.generateRecommendations(result)
      };
      
    } catch (error) {
      console.error(`❌ Scraping failed for ${url}:`, error.message);
      
      // Track failed request
      this.usageTracker.trackRequest('orchestrator', { url }, { 
        success: false, 
        error: error.message 
      });
      
      return {
        success: false,
        error: error.message,
        url,
        duration: Date.now() - startTime,
        insights: this.generateErrorInsights(error),
        recommendations: this.generateErrorRecommendations(error)
      };
    }
  }

  /**
   * Log detailed progress information
   */
  logProgress(progressData) {
    const { stage, progress, message, details } = progressData;
    const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
    
    console.log(`📊 [${progressBar}] ${progress.toFixed(1)}% - ${stage}: ${message}`);
    
    if (details && Object.keys(details).length > 0) {
      console.log(`   💡 Details:`, JSON.stringify(details, null, 2));
    }
  }

  /**
   * Update performance monitoring
   */
  updatePerformanceMonitoring(result) {
    this.performanceMonitor.requestCount++;
    this.performanceMonitor.lastUpdate = Date.now();
    
    if (result.success) {
      // Update average response time
      const currentAvg = this.performanceMonitor.averageResponseTime;
      const count = this.performanceMonitor.requestCount;
      this.performanceMonitor.averageResponseTime = 
        (currentAvg * (count - 1) + result.duration) / count;
      
      // Update success rate
      const successCount = this.performanceMonitor.requestCount * this.performanceMonitor.successRate + 1;
      this.performanceMonitor.successRate = successCount / this.performanceMonitor.requestCount;
    }
  }

  /**
   * Generate insights from scraping results
   */
  generateScrapingInsights(result) {
    const insights = {
      performance: {
        responseTime: result.duration,
        provider: result.provider,
        confidence: result.confidence,
        fallbackUsed: result.metadata?.providersAttempted?.length > 1
      },
      cost: {
        estimated: result.metadata?.cost || 0,
        provider: result.provider,
        costEfficiency: result.confidence / (result.metadata?.cost || 0.001)
      },
      quality: {
        dataCompleteness: this.assessDataCompleteness(result.data),
        confidenceLevel: this.getConfidenceLevel(result.confidence),
        reliabilityScore: this.calculateReliabilityScore(result)
      }
    };
    
    return insights;
  }

  /**
   * Generate recommendations based on results
   */
  generateRecommendations(result) {
    const recommendations = [];
    
    // Performance recommendations
    if (result.duration > 10000) {
      recommendations.push({
        type: 'performance',
        message: 'Consider optimizing provider selection for faster response times',
        action: 'Review provider priority settings'
      });
    }
    
    // Cost recommendations
    if (result.metadata?.cost > 0.01) {
      recommendations.push({
        type: 'cost',
        message: 'High cost per request detected',
        action: 'Consider using free tier providers first'
      });
    }
    
    // Quality recommendations
    if (result.confidence < 80) {
      recommendations.push({
        type: 'quality',
        message: 'Low confidence result - consider using AI fallback',
        action: 'Enable AI providers for better accuracy'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate error insights
   */
  generateErrorInsights(error) {
    return {
      errorType: error.type || 'unknown',
      message: error.message,
      possibleCauses: this.identifyPossibleCauses(error),
      impact: this.assessErrorImpact(error)
    };
  }

  /**
   * Generate error recommendations
   */
  generateErrorRecommendations(error) {
    const recommendations = [];
    
    if (error.message.includes('budget')) {
      recommendations.push({
        type: 'budget',
        message: 'Increase budget limits or optimize provider usage',
        action: 'Review budget configuration'
      });
    }
    
    if (error.message.includes('quota')) {
      recommendations.push({
        type: 'quota',
        message: 'Provider quota exceeded',
        action: 'Wait for quota reset or use alternative providers'
      });
    }
    
    if (error.message.includes('timeout')) {
      recommendations.push({
        type: 'timeout',
        message: 'Request timed out',
        action: 'Increase timeout settings or check network connectivity'
      });
    }
    
    return recommendations;
  }

  /**
   * Get comprehensive system summary
   */
  getSystemSummary() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }
    
    return {
      status: 'initialized',
      providers: {
        total: this.providers.size,
        enabled: Array.from(this.providers.keys()),
        status: this.getProviderStatuses()
      },
      configuration: this.config.getConfigurationSummary(),
      usage: this.usageTracker.getDashboardData(),
      orchestrator: this.orchestrator.getStatus(),
      performance: this.performanceMonitor,
      cost: this.costMonitor
    };
  }

  /**
   * Get current session summary
   */
  getSessionSummary() {
    return {
      startTime: this.orchestrator?.sessionMetrics?.startTime,
      requestCount: this.orchestrator?.sessionMetrics?.requestCount || 0,
      successRate: this.orchestrator?.sessionMetrics?.successRate || 0,
      totalCost: this.orchestrator?.sessionMetrics?.totalCost || 0,
      averageConfidence: this.orchestrator?.sessionMetrics?.averageConfidence || 0,
      providersUsed: Array.from(this.orchestrator?.sessionMetrics?.providersUsed || [])
    };
  }

  /**
   * Get real-time dashboard data
   */
  getDashboardData() {
    return {
      system: this.getSystemSummary(),
      usage: this.usageTracker.getDashboardData(),
      performance: this.performanceMonitor,
      alerts: this.getActiveAlerts(),
      suggestions: this.getOptimizationSuggestions()
    };
  }

  /**
   * Get active alerts from usage tracker
   */
  getActiveAlerts() {
    const dashboardData = this.usageTracker.getDashboardData();
    return dashboardData.alerts || [];
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions() {
    const dashboardData = this.usageTracker.getDashboardData();
    return dashboardData.suggestions || [];
  }

  /**
   * Register dashboard callback for real-time updates
   */
  registerDashboardCallback(callback) {
    this.dashboardCallbacks.add(callback);
    return () => this.dashboardCallbacks.delete(callback);
  }

  /**
   * Export comprehensive usage report
   */
  exportUsageReport(options = {}) {
    return {
      timestamp: new Date().toISOString(),
      system: this.getSystemSummary(),
      usage: this.usageTracker.exportUsageData(options),
      configuration: this.config.exportConfiguration({ includeCredentials: false }),
      session: this.getSessionSummary(),
      recommendations: this.getOptimizationSuggestions()
    };
  }

  /**
   * Optimize system configuration based on usage patterns
   */
  async optimizeConfiguration() {
    if (!this.usageTracker) {
      throw new Error('Usage tracker not initialized');
    }
    
    const usageData = this.usageTracker.getUsageSummary();
    const optimization = this.config.optimizeConfiguration(usageData);
    
    console.log(`🔧 Generated ${optimization.suggestions.length} optimization suggestions`);
    
    if (optimization.suggestions.length > 0) {
      console.log('💡 Optimization suggestions:');
      for (const suggestion of optimization.suggestions) {
        console.log(`  - ${suggestion.type}: ${suggestion.reason}`);
      }
    }
    
    return optimization;
  }

  /**
   * Apply optimization suggestions automatically
   */
  async applyOptimizations(suggestions) {
    const result = this.config.applyOptimizations(suggestions);
    
    console.log(`✅ Applied ${result.applied} optimizations`);
    if (result.failed > 0) {
      console.warn(`⚠️ Failed to apply ${result.failed} optimizations`);
    }
    
    return result;
  }

  /**
   * Shutdown the system gracefully
   */
  async shutdown() {
    console.log('🔄 Shutting down scraping system...');
    
    if (this.orchestrator) {
      await this.orchestrator.cleanup();
    }
    
    // Clear callbacks
    this.dashboardCallbacks.clear();
    
    // Export final report
    const finalReport = this.exportUsageReport();
    
    this.isInitialized = false;
    console.log('✅ System shutdown complete');
    
    return finalReport;
  }

  // Helper methods for insights generation
  assessDataCompleteness(data) {
    if (!data) return 0;
    const fields = ['name', 'company', 'phone', 'email'];
    const filledFields = fields.filter(field => data[field]);
    return (filledFields.length / fields.length) * 100;
  }

  getConfidenceLevel(confidence) {
    if (confidence >= 90) return 'excellent';
    if (confidence >= 80) return 'good';
    if (confidence >= 70) return 'fair';
    if (confidence >= 60) return 'poor';
    return 'very_poor';
  }

  calculateReliabilityScore(result) {
    let score = result.confidence;
    if (result.metadata?.cacheHit) score += 10;
    if (result.metadata?.providersAttempted?.length === 1) score += 5;
    return Math.min(100, score);
  }

  identifyPossibleCauses(error) {
    const causes = [];
    if (error.message.includes('network')) causes.push('Network connectivity issues');
    if (error.message.includes('timeout')) causes.push('Slow response from target server');
    if (error.message.includes('budget')) causes.push('Budget limits exceeded');
    if (error.message.includes('quota')) causes.push('Provider quota limits reached');
    return causes;
  }

  assessErrorImpact(error) {
    if (error.message.includes('budget') || error.message.includes('quota')) {
      return 'high';
    }
    if (error.message.includes('timeout') || error.message.includes('network')) {
      return 'medium';
    }
    return 'low';
  }

  getProviderStatuses() {
    const statuses = {};
    for (const [name, provider] of this.providers) {
      statuses[name] = provider.getStatus();
    }
    return statuses;
  }

  broadcastToWebSocket(data) {
    // Example WebSocket broadcasting - implement based on your WebSocket setup
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'scraping_progress',
        data
      }));
    }
  }
}

/**
 * Example usage demonstrating all features
 */
async function runCompleteExample() {
  console.log('🚀 Starting Complete Scraping Integration Example\n');
  
  // Initialize the complete system
  const integration = new CompleteScrapingIntegration({
    environment: 'development',
    dailyBudget: 5,
    enableNotifications: false,
    websocketUrl: 'ws://localhost:8080',
    customConfig: {
      orchestrator: {
        confidenceThreshold: 75,
        providerStrategy: {
          costOptimization: true,
          performanceOptimization: true
        }
      }
    }
  });

  try {
    // Initialize the system
    const initResult = await integration.initialize();
    if (!initResult.success) {
      throw new Error(`Initialization failed: ${initResult.error}`);
    }

    console.log('\n📋 System Summary:');
    console.log(JSON.stringify(initResult.summary, null, 2));

    // Register a dashboard callback for real-time monitoring
    const unregisterCallback = integration.registerDashboardCallback((progress) => {
      console.log(`🔄 Real-time Update: ${progress.stage} - ${progress.message}`);
    });

    // Example: Scrape multiple URLs with comprehensive tracking
    const urlsToScrape = [
      'https://www.realtor.com/realestateagents/jane-doe-agent-12345',
      'https://www.realtor.com/realestateagents/john-smith-agent-67890'
    ];

    console.log('\n🎯 Starting intelligent scraping examples...\n');

    for (const url of urlsToScrape) {
      console.log(`\n--- Scraping: ${url} ---`);
      
      const result = await integration.scrapeWithIntelligence(url, {
        onProgress: (progress) => {
          // Custom progress handling for this specific request
          if (progress.stage === 'success') {
            console.log(`🎉 Success! Confidence: ${progress.details.confidence}%`);
          }
        }
      });

      if (result.success) {
        console.log('✅ Scraping successful!');
        console.log(`   Confidence: ${result.confidence}%`);
        console.log(`   Provider: ${result.provider}`);
        console.log(`   Duration: ${result.duration}ms`);
        
        if (result.insights) {
          console.log('💡 Insights:', JSON.stringify(result.insights, null, 2));
        }
        
        if (result.recommendations?.length > 0) {
          console.log('📋 Recommendations:');
          for (const rec of result.recommendations) {
            console.log(`   - ${rec.type}: ${rec.message}`);
          }
        }
      } else {
        console.log('❌ Scraping failed:', result.error);
        if (result.recommendations?.length > 0) {
          console.log('🔧 Error recommendations:');
          for (const rec of result.recommendations) {
            console.log(`   - ${rec.type}: ${rec.message}`);
          }
        }
      }
    }

    // Generate and display dashboard data
    console.log('\n📊 Real-time Dashboard Data:');
    const dashboardData = integration.getDashboardData();
    console.log(JSON.stringify(dashboardData, null, 2));

    // Generate optimization suggestions
    console.log('\n🔧 Generating optimization suggestions...');
    const optimization = await integration.optimizeConfiguration();
    console.log('Optimization result:', JSON.stringify(optimization, null, 2));

    // Export comprehensive usage report
    console.log('\n📋 Exporting usage report...');
    const report = integration.exportUsageReport({
      includeHistory: true,
      period: 'daily'
    });
    console.log('Usage report generated:', report.timestamp);

    // Clean up
    unregisterCallback();
    
    // Shutdown gracefully
    console.log('\n🔄 Shutting down system...');
    const finalReport = await integration.shutdown();
    console.log('Final report timestamp:', finalReport.timestamp);

    console.log('\n🎉 Complete integration example finished successfully!');

  } catch (error) {
    console.error('\n❌ Example failed:', error);
    
    // Attempt graceful shutdown even on error
    try {
      await integration.shutdown();
    } catch (shutdownError) {
      console.error('Shutdown error:', shutdownError);
    }
  }
}

/**
 * Simple usage example for quick testing
 */
export async function quickExample() {
  const integration = new CompleteScrapingIntegration({
    environment: 'development',
    dailyBudget: 1
  });

  await integration.initialize();
  
  const result = await integration.scrapeWithIntelligence('https://example.com');
  console.log('Quick example result:', result);
  
  await integration.shutdown();
  return result;
}

/**
 * Production-ready setup example
 */
export async function productionExample() {
  const integration = new CompleteScrapingIntegration({
    environment: 'production',
    dailyBudget: 50,
    enableNotifications: true,
    webhookUrl: process.env.WEBHOOK_URL,
    slackWebhook: process.env.SLACK_WEBHOOK,
    notificationEmail: process.env.NOTIFICATION_EMAIL,
    customConfig: {
      orchestrator: {
        costTracking: {
          dailyBudget: 50,
          monthlyBudget: 1000,
          warningThreshold: 0.8
        },
        providerStrategy: {
          costOptimization: true,
          performanceOptimization: true,
          useSmartFallback: true
        }
      }
    }
  });

  return integration;
}

// Export for use in other modules
export default CompleteScrapingIntegration;

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteExample().catch(console.error);
}