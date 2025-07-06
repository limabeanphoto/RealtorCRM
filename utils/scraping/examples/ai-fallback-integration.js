/**
 * AI Fallback Integration Example
 * Demonstrates how to integrate AI vision providers as intelligent fallbacks
 * when traditional scraping methods fail or have low confidence
 */

import { ScrapingOrchestrator } from '../ScrapingOrchestrator.js';
import { ScraperAPIProvider } from '../providers/ScraperAPIProvider.js';
import { GeminiProvider } from '../providers/GeminiProvider.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';

/**
 * Example integration of AI fallback services with the scraping orchestrator
 */
export class AIFallbackDemo {
  constructor() {
    this.orchestrator = new ScrapingOrchestrator({
      confidenceThreshold: 70, // Require high confidence for success
      parallelProviders: false, // Use sequential fallback
      maxAttempts: 2,
      timeout: 30000
    });

    this.setupProviders();
  }

  /**
   * Setup scraping providers with AI fallbacks
   */
  setupProviders() {
    // Primary provider: ScraperAPI (fast, reliable, but may fail on complex pages)
    const scraperApiProvider = new ScraperAPIProvider({
      name: 'scraperapi-primary',
      priority: 10, // Highest priority
      apiKey: process.env.SCRAPERAPI_KEY,
      enabled: true
    });

    // AI Fallback 1: Gemini Flash (generous free tier, fast)
    const geminiProvider = new GeminiProvider({
      name: 'gemini-flash-fallback',
      priority: 3, // High priority for AI fallback
      apiKey: process.env.GEMINI_API_KEY,
      enabled: true,
      inputType: 'html', // Analyze HTML content
      confidenceThreshold: 0.7,
      monthlyCostLimit: 10 // Low cost limit due to free tier
    });

    // AI Fallback 2: OpenAI GPT-4 Vision (high quality, higher cost)
    const openaiProvider = new OpenAIProvider({
      name: 'openai-vision-fallback',
      priority: 2, // Lower priority due to cost
      apiKey: process.env.OPENAI_API_KEY,
      enabled: true,
      inputType: 'screenshot', // Use screenshots for vision analysis
      confidenceThreshold: 0.8,
      monthlyCostLimit: 100 // Higher cost limit for quality
    });

    // Register providers (orchestrator will use them in priority order)
    this.orchestrator.registerProvider(scraperApiProvider);
    this.orchestrator.registerProvider(geminiProvider);
    this.orchestrator.registerProvider(openaiProvider);
  }

  /**
   * Demonstrate AI fallback scraping with comprehensive error handling
   * @param {string} url - URL to scrape
   * @returns {Promise<Object>} - Scraping result with AI fallback details
   */
  async scrapeWithAIFallback(url) {
    console.log(`\n🚀 Starting AI fallback scraping for: ${url}`);
    
    const startTime = Date.now();
    
    try {
      // Create scraping request
      const request = {
        url: url,
        options: {
          waitTime: 3000,
          userAgent: 'Mozilla/5.0 (compatible; RealtorCRM-AIBot/1.0)'
        }
      };

      // Progress tracking
      const progressUpdates = [];
      const onProgress = (update) => {
        progressUpdates.push(update);
        console.log(`📊 ${update.stage}: ${update.progress}% - ${update.message}`);
      };

      // Perform scraping with AI fallback
      const result = await this.orchestrator.scrape(request, onProgress);
      
      const totalTime = Date.now() - startTime;
      
      // Analyze the result
      const analysis = this.analyzeScrapingResult(result, totalTime, progressUpdates);
      
      console.log('\n📊 Scraping Result Analysis:');
      console.log(JSON.stringify(analysis, null, 2));
      
      return analysis;

    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      return {
        success: false,
        error: error.message,
        fallbackAttempted: true,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze scraping result and provide insights
   * @param {Object} result - Scraping result
   * @param {number} totalTime - Total time taken
   * @param {Array} progressUpdates - Progress updates
   * @returns {Object} - Analysis report
   */
  analyzeScrapingResult(result, totalTime, progressUpdates) {
    const analysis = {
      success: result.success,
      confidence: result.confidence,
      provider: result.provider,
      totalTime: totalTime,
      extractedData: result.data,
      metadata: result.metadata,
      progressStages: progressUpdates.length,
      costAnalysis: this.analyzeCosts(),
      providerPerformance: this.analyzeProviderPerformance(),
      recommendations: this.generateRecommendations(result)
    };

    // Add AI-specific analysis if AI provider was used
    if (result.provider && result.provider.includes('gemini') || result.provider.includes('openai')) {
      analysis.aiAnalysis = {
        providerUsed: result.provider,
        wasAIFallback: true,
        confidence: result.confidence,
        tokensUsed: result.metadata.tokensUsed || 0,
        costIncurred: result.metadata.costIncurred || 0,
        inputType: result.metadata.inputType || 'unknown'
      };
    }

    return analysis;
  }

  /**
   * Analyze costs across all providers
   * @returns {Object} - Cost analysis
   */
  analyzeCosts() {
    const providers = Array.from(this.orchestrator.providers.values());
    const costAnalysis = {
      totalProviders: providers.length,
      aiProviders: 0,
      estimatedMonthlyCost: 0,
      providerCosts: {}
    };

    providers.forEach(provider => {
      if (provider.getCostTracking) {
        const costTracking = provider.getCostTracking();
        costAnalysis.aiProviders++;
        costAnalysis.estimatedMonthlyCost += costTracking.projectedMonthlyCost || 0;
        costAnalysis.providerCosts[provider.config.name] = {
          totalCost: costTracking.totalCost || 0,
          requestCount: costTracking.requestCount || 0,
          averageCost: costTracking.averageCostPerRequest || 0,
          projectedMonthlyCost: costTracking.projectedMonthlyCost || 0
        };
      }
    });

    return costAnalysis;
  }

  /**
   * Analyze provider performance
   * @returns {Object} - Performance analysis
   */
  analyzeProviderPerformance() {
    const metrics = this.orchestrator.getMetrics();
    
    return {
      totalRequests: metrics.totalRequests,
      successRate: metrics.totalRequests > 0 ? 
        (metrics.successfulRequests / metrics.totalRequests) * 100 : 0,
      averageResponseTime: metrics.averageResponseTime,
      cacheHitRate: metrics.cacheStats.hitRate,
      providerUsage: metrics.providerUsage,
      topPerformingProvider: this.getTopPerformingProvider(metrics.providerUsage)
    };
  }

  /**
   * Get the top performing provider
   * @param {Object} providerUsage - Provider usage stats
   * @returns {string} - Top performing provider name
   */
  getTopPerformingProvider(providerUsage) {
    let topProvider = null;
    let topSuccessRate = 0;

    Object.entries(providerUsage).forEach(([name, stats]) => {
      const successRate = stats.requests > 0 ? (stats.successes / stats.requests) * 100 : 0;
      if (successRate > topSuccessRate) {
        topSuccessRate = successRate;
        topProvider = name;
      }
    });

    return topProvider;
  }

  /**
   * Generate recommendations based on scraping result
   * @param {Object} result - Scraping result
   * @returns {Array} - List of recommendations
   */
  generateRecommendations(result) {
    const recommendations = [];

    if (!result.success) {
      recommendations.push('All providers failed - consider adding more AI providers or adjusting confidence thresholds');
    } else if (result.confidence < 70) {
      recommendations.push('Low confidence result - manual review recommended');
    }

    if (result.provider && result.provider.includes('openai')) {
      recommendations.push('OpenAI was used - monitor costs and consider using Gemini for cost optimization');
    }

    if (result.metadata && result.metadata.cacheHit) {
      recommendations.push('Result from cache - consider cache TTL optimization');
    }

    if (result.duration > 10000) {
      recommendations.push('Slow response time - consider timeout optimization or provider prioritization');
    }

    return recommendations;
  }

  /**
   * Demonstrate bulk scraping with AI fallbacks
   * @param {Array<string>} urls - URLs to scrape
   * @returns {Promise<Array>} - Bulk scraping results
   */
  async bulkScrapeWithAIFallback(urls) {
    console.log(`\n🔄 Starting bulk scraping for ${urls.length} URLs`);
    
    const results = [];
    const batchSize = 3; // Process in small batches to manage API limits
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} URLs)`);
      
      const batchPromises = batch.map(async (url, index) => {
        try {
          // Add delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, index * 1000));
          return await this.scrapeWithAIFallback(url);
        } catch (error) {
          return {
            url,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pause between batches
      if (i + batchSize < urls.length) {
        console.log('⏸️  Pausing between batches...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Generate bulk analysis
    const bulkAnalysis = this.analyzeBulkResults(results);
    console.log('\n📊 Bulk Scraping Analysis:');
    console.log(JSON.stringify(bulkAnalysis, null, 2));

    return {
      results,
      analysis: bulkAnalysis
    };
  }

  /**
   * Analyze bulk scraping results
   * @param {Array} results - Bulk scraping results
   * @returns {Object} - Bulk analysis
   */
  analyzeBulkResults(results) {
    const analysis = {
      totalUrls: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      averageConfidence: 0,
      totalCost: 0,
      providersUsed: new Set(),
      aiProviderUsage: 0,
      averageTime: 0
    };

    let confidenceSum = 0;
    let timeSum = 0;
    let confidenceCount = 0;

    results.forEach(result => {
      if (result.success) {
        confidenceSum += result.confidence || 0;
        confidenceCount++;
      }
      
      timeSum += result.totalTime || 0;
      
      if (result.provider) {
        analysis.providersUsed.add(result.provider);
        
        if (result.provider.includes('gemini') || result.provider.includes('openai')) {
          analysis.aiProviderUsage++;
        }
      }
      
      if (result.costAnalysis) {
        analysis.totalCost += result.costAnalysis.estimatedMonthlyCost || 0;
      }
    });

    analysis.averageConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;
    analysis.averageTime = results.length > 0 ? timeSum / results.length : 0;
    analysis.successRate = (analysis.successful / analysis.totalUrls) * 100;
    analysis.aiUsageRate = (analysis.aiProviderUsage / analysis.totalUrls) * 100;
    analysis.providersUsed = Array.from(analysis.providersUsed);

    return analysis;
  }

  /**
   * Get orchestrator status and provider health
   * @returns {Object} - System status
   */
  getSystemStatus() {
    return this.orchestrator.getStatus();
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.orchestrator.cleanup();
  }
}

/**
 * Example usage and testing
 */
export async function demonstrateAIFallback() {
  const demo = new AIFallbackDemo();
  
  // Test URLs (replace with actual URLs)
  const testUrls = [
    'https://example.com/realtor-profile-1',
    'https://example.com/realtor-profile-2',
    'https://example.com/complex-agent-page'
  ];

  try {
    console.log('🤖 AI Fallback Scraping Demonstration');
    console.log('=====================================');
    
    // Single URL demo
    console.log('\n1. Single URL Scraping with AI Fallback:');
    const singleResult = await demo.scrapeWithAIFallback(testUrls[0]);
    
    // System status
    console.log('\n2. System Status:');
    const status = demo.getSystemStatus();
    console.log(JSON.stringify(status, null, 2));
    
    // Bulk scraping demo (commented out to avoid API usage in example)
    // console.log('\n3. Bulk Scraping with AI Fallback:');
    // const bulkResults = await demo.bulkScrapeWithAIFallback(testUrls);
    
    return {
      singleResult,
      systemStatus: status
    };
    
  } catch (error) {
    console.error('Demo failed:', error);
  } finally {
    await demo.cleanup();
  }
}

// Export for use in other files
export default AIFallbackDemo;

// Uncomment to run the demonstration
// demonstrateAIFallback().then(() => console.log('Demo completed'));