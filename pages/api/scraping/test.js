// pages/api/scraping/test.js - Test endpoint for the new scraping architecture
import withAuth from '../../../utils/withAuth';
import { ERROR_TYPES } from '../../../utils/scraping/types';

/**
 * Test endpoint to verify the new scraping architecture
 * This endpoint can be used to test the integration without making actual scraping requests
 */
async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`,
        allowedMethods: ['GET'],
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }

    // Test imports and basic functionality
    const testResults = {};
    
    try {
      // Test ScrapingOrchestrator import
      const { ScrapingOrchestrator } = await import('../../../utils/scraping/ScrapingOrchestrator');
      testResults.orchestratorImport = { success: true, message: 'ScrapingOrchestrator imported successfully' };
      
      // Test creating an orchestrator instance
      const orchestrator = new ScrapingOrchestrator({
        maxAttempts: 2,
        cacheEnabled: false,
        confidenceThreshold: 70
      });
      testResults.orchestratorCreation = { success: true, message: 'ScrapingOrchestrator instance created successfully' };
      
      // Test orchestrator methods
      const status = orchestrator.getStatus();
      testResults.orchestratorStatus = { 
        success: true, 
        message: 'Status retrieved successfully',
        data: {
          healthy: status.healthy,
          totalProviders: status.totalProviders,
          healthyProviders: status.healthyProviders
        }
      };
      
    } catch (error) {
      testResults.orchestratorTest = { 
        success: false, 
        message: `Orchestrator test failed: ${error.message}` 
      };
    }
    
    try {
      // Test UsageTracker import
      const { UsageTracker } = await import('../../../utils/scraping/UsageTracker');
      testResults.usageTrackerImport = { success: true, message: 'UsageTracker imported successfully' };
      
      // Test creating a usage tracker instance
      const usageTracker = new UsageTracker({
        dailyBudget: 5,
        trackingEnabled: true
      });
      testResults.usageTrackerCreation = { success: true, message: 'UsageTracker instance created successfully' };
      
      // Test usage tracker methods
      const summary = usageTracker.getUsageSummary();
      testResults.usageTrackerSummary = { 
        success: true, 
        message: 'Usage summary retrieved successfully',
        data: {
          totalRequests: summary.current.requests,
          totalCost: summary.current.totalCost
        }
      };
      
    } catch (error) {
      testResults.usageTrackerTest = { 
        success: false, 
        message: `UsageTracker test failed: ${error.message}` 
      };
    }
    
    try {
      // Test ScraperAPIProvider import
      const { ScraperAPIProvider } = await import('../../../utils/scraping/providers/ScraperAPIProvider');
      testResults.scraperAPIProviderImport = { success: true, message: 'ScraperAPIProvider imported successfully' };
      
      // Test creating a provider instance (without API key to avoid real requests)
      const provider = new ScraperAPIProvider({
        apiKey: 'test-key',
        timeout: 5000,
        supportedDomains: ['test.com']
      });
      testResults.scraperAPIProviderCreation = { 
        success: true, 
        message: 'ScraperAPIProvider instance created successfully',
        data: {
          name: provider.config.name,
          type: provider.config.type,
          enabled: provider.config.enabled
        }
      };
      
    } catch (error) {
      testResults.scraperAPIProviderTest = { 
        success: false, 
        message: `ScraperAPIProvider test failed: ${error.message}` 
      };
    }
    
    try {
      // Test types import
      const types = await import('../../../utils/scraping/types');
      testResults.typesImport = { 
        success: true, 
        message: 'Types imported successfully',
        data: {
          errorTypes: Object.keys(types.ERROR_TYPES),
          providerTypes: Object.keys(types.PROVIDER_TYPES),
          scrapingStatus: Object.keys(types.SCRAPING_STATUS)
        }
      };
      
    } catch (error) {
      testResults.typesTest = { 
        success: false, 
        message: `Types test failed: ${error.message}` 
      };
    }
    
    // Test environment variables
    const envTests = {
      scraperAPIKey: {
        set: !!process.env.SCRAPER_API_KEY,
        masked: process.env.SCRAPER_API_KEY ? process.env.SCRAPER_API_KEY.substring(0, 8) + '...' : 'not set'
      },
      scrapingBudget: {
        daily: process.env.SCRAPING_DAILY_BUDGET || 'not set',
        monthly: process.env.SCRAPING_MONTHLY_BUDGET || 'not set'
      },
      scrapingConfig: {
        cacheEnabled: process.env.SCRAPING_CACHE_ENABLED !== 'false',
        maxAttempts: process.env.SCRAPING_MAX_ATTEMPTS || 'not set',
        confidenceThreshold: process.env.SCRAPING_CONFIDENCE_THRESHOLD || 'not set'
      }
    };
    
    testResults.environmentVariables = { 
      success: true, 
      message: 'Environment variables checked',
      data: envTests
    };
    
    // Calculate overall success
    const totalTests = Object.keys(testResults).length;
    const successfulTests = Object.values(testResults).filter(test => test.success).length;
    const overallSuccess = successfulTests === totalTests;
    
    return res.status(200).json({
      success: overallSuccess,
      message: `Architecture test completed: ${successfulTests}/${totalTests} tests passed`,
      data: {
        overallStatus: overallSuccess ? 'PASS' : 'FAIL',
        testSummary: {
          total: totalTests,
          passed: successfulTests,
          failed: totalTests - successfulTests
        },
        testResults,
        architecture: {
          newEndpoints: [
            '/api/contacts/scrape.js - Enhanced with ScrapingOrchestrator',
            '/api/scraping/config.js - Configuration management',
            '/api/scraping/usage.js - Usage tracking and analytics',
            '/api/scraping/providers.js - Provider management'
          ],
          removedFiles: [
            '/api/contacts/scrape.config.js - Replaced by new configuration system',
            '/api/contacts/scrapeUtils.js - Replaced by provider-specific implementations'
          ],
          newFeatures: [
            'Real-time progress updates via Server-Sent Events',
            'Intelligent provider fallback chains',
            'Comprehensive usage tracking and cost management',
            'Dynamic provider configuration and management',
            'Enhanced error handling and logging',
            'Confidence scoring and method tracking',
            'Budget management and quota tracking',
            'Performance optimization and analytics'
          ]
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        version: '2.0',
        testEnvironment: process.env.NODE_ENV || 'development'
      }
    });
    
  } catch (error) {
    console.error('Error in scraping architecture test:', error);
    return res.status(500).json({
      success: false,
      message: 'Architecture test failed',
      error: {
        type: error.type || ERROR_TYPES.UNKNOWN_ERROR,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    });
  }
}

export default withAuth(handler);