// pages/api/contacts/scrape.js - Enhanced version with new ScrapingOrchestrator
import withAuth from '../../../utils/withAuth';
import { ScrapingOrchestrator } from '../../../utils/scraping/ScrapingOrchestrator';
import { UsageTracker } from '../../../utils/scraping/UsageTracker';
import { ScraperAPIProvider } from '../../../utils/scraping/providers/ScraperAPIProvider';
import { 
  SCRAPING_STATUS, 
  ERROR_TYPES, 
  CONFIDENCE_LEVELS 
} from '../../../utils/scraping/types';

// Initialize the scraping orchestrator with enhanced configuration
const orchestrator = new ScrapingOrchestrator({
  // Enhanced retry configuration
  maxAttempts: 3,
  retryStrategy: 'exponential',
  baseDelay: 1000,
  maxDelay: 10000,
  
  // Cache configuration
  cacheEnabled: true,
  cacheTtl: 3600, // 1 hour
  cacheMaxSize: 1000,
  
  // Confidence thresholds
  confidenceThreshold: 70,
  aiConfidenceThreshold: 80,
  minConfidenceForSuccess: 60,
  
  // Cost management
  costTrackingEnabled: true,
  dailyBudget: 10,
  monthlyBudget: 100,
  warningThreshold: 0.8,
  
  // Progress reporting
  progressReportingEnabled: true,
  detailedCallbacks: true,
  
  // Provider strategy
  useSmartFallback: true,
  costOptimization: true,
  performanceOptimization: true,
  
  // Timeouts
  timeout: 30000
});

// Initialize usage tracker
const usageTracker = new UsageTracker({
  dailyBudget: 10,
  monthlyBudget: 100,
  warningThreshold: 0.8,
  trackingEnabled: true,
  detailedMetrics: true,
  notificationsEnabled: false // Disable notifications for now
});

// Register the usage tracker with the orchestrator
orchestrator.setUsageTracker(usageTracker);

// Initialize ScraperAPI provider
const scraperAPIProvider = new ScraperAPIProvider({
  apiKey: process.env.SCRAPER_API_KEY || '70ac05c680ca256611baa42243a1ad64',
  timeout: 15000,
  retryAttempts: 2,
  rateLimitPerMinute: 60,
  supportedDomains: ['realtor.com'],
  selectors: {
    name: [
      '.profile-details h2.base__StyledType-rui__sc-108xfm0-0.dQAzyh',
      'h2:contains("Justin")',
      '.profile-info h2',
      '.agent-name',
      '[data-testid="agent-name"]',
      'h1[data-testid="agent-name"]'
    ],
    company: [
      '.profile-details p.base__StyledType-rui__sc-108xfm0-0.GLfFQ',
      'p[content*="Harcourts"]',
      '.profile-info p:first-of-type',
      '.agent-company',
      '[data-testid="agent-company"]'
    ],
    phone: [
      'a[data-linkname="realtors:_details:top:phone_number"]',
      'a[href^="tel:"]',
      '.profile-mobile-icon a',
      '.agent-phone',
      '[data-testid="agent-phone"]'
    ],
    description: [
      '#agent-description',
      '.profile-description',
      '.agent-bio'
    ],
    profilePicture: [
      '.profile-details .profile-img',
      '.profile-img',
      '.agent-photo'
    ]
  }
});

// Register the provider
orchestrator.registerProvider(scraperAPIProvider);

/**
 * Enhanced API endpoint to scrape realtor contact information using the new orchestration service
 */
async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false, 
        message: `Method ${req.method} not allowed`,
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }

    const { url, options = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL is required',
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        }
      });
    }

    // Validate that the URL is from Realtor.com
    if (!isValidRealtorUrl(url)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid URL. Only Realtor.com profile URLs are supported at this time.',
        metadata: {
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          url: url
        }
      });
    }

    // Check if this is a Server-Sent Events request for real-time progress
    if (req.headers.accept === 'text/event-stream') {
      return handleProgressStream(req, res, url, options);
    }

    console.log(`Starting enhanced scrape of: ${url} at ${new Date().toISOString()}`);

    // Create scraping request object
    const scrapingRequest = {
      url: url,
      options: {
        ...options,
        extractionFields: ['name', 'company', 'phone', 'email', 'description', 'profilePicture'],
        requiredFields: ['name', 'phone']
      }
    };

    // Track progress for non-streaming requests
    const progressUpdates = [];
    const progressCallback = (progress) => {
      progressUpdates.push({
        ...progress,
        timestamp: new Date().toISOString()
      });
      console.log(`Progress: ${progress.stage} - ${progress.progress}% - ${progress.message}`);
    };

    // Execute scraping with the orchestrator
    const result = await orchestrator.scrape(scrapingRequest, progressCallback);
    
    console.log(`Scraping completed for ${url}:`, {
      success: result.success,
      confidence: result.confidence,
      provider: result.provider,
      duration: Date.now() - startTime
    });

    // Enhanced response format
    const response = {
      success: result.success,
      data: result.data,
      confidence: result.confidence,
      provider: result.provider,
      metadata: {
        ...result.metadata,
        progressUpdates: progressUpdates,
        scrapingMethod: 'orchestrator',
        version: '2.0',
        timestamp: new Date().toISOString(),
        totalDuration: Date.now() - startTime,
        usageTracking: {
          sessionMetrics: orchestrator.sessionMetrics,
          budgetRemaining: usageTracker.checkBudget().remaining
        }
      }
    };

    if (result.success) {
      console.log(`Successfully scraped contact: ${result.data.name} using ${result.provider}`);
      return res.status(200).json(response);
    } else {
      console.error(`Scraping failed for ${url}:`, result.error?.message);
      return res.status(422).json({
        ...response,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in enhanced scraping endpoint:', error);
    
    const errorResponse = {
      success: false,
      message: 'Error scraping contact information: ' + error.message,
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: {
          type: error.type || ERROR_TYPES.UNKNOWN_ERROR,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      }
    };
    
    return res.status(500).json(errorResponse);
  }
}

/**
 * Handle Server-Sent Events stream for real-time progress updates
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {string} url - URL to scrape
 * @param {Object} options - Scraping options
 */
async function handleProgressStream(req, res, url, options) {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'Connected to scraping progress stream'
  })}\n\n`);

  const scrapingRequest = {
    url: url,
    options: {
      ...options,
      extractionFields: ['name', 'company', 'phone', 'email', 'description', 'profilePicture'],
      requiredFields: ['name', 'phone']
    }
  };

  // Progress callback for SSE
  const progressCallback = (progress) => {
    const progressData = {
      type: 'progress',
      ...progress,
      timestamp: new Date().toISOString()
    };
    
    res.write(`data: ${JSON.stringify(progressData)}\n\n`);
  };

  try {
    // Execute scraping with real-time progress updates
    const result = await orchestrator.scrape(scrapingRequest, progressCallback);
    
    // Send final result
    const finalData = {
      type: 'complete',
      success: result.success,
      data: result.data,
      confidence: result.confidence,
      provider: result.provider,
      metadata: {
        ...result.metadata,
        scrapingMethod: 'orchestrator-stream',
        version: '2.0'
      },
      timestamp: new Date().toISOString()
    };
    
    if (!result.success) {
      finalData.error = result.error;
    }
    
    res.write(`data: ${JSON.stringify(finalData)}\n\n`);
    
  } catch (error) {
    // Send error event
    const errorData = {
      type: 'error',
      success: false,
      message: error.message,
      error: {
        type: error.type || ERROR_TYPES.UNKNOWN_ERROR,
        message: error.message
      },
      timestamp: new Date().toISOString()
    };
    
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
  } finally {
    // Close the connection
    res.write(`data: ${JSON.stringify({
      type: 'end',
      timestamp: new Date().toISOString()
    })}\n\n`);
    res.end();
  }
}

/**
 * Validates that the URL is from Realtor.com and is a realtor profile
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
function isValidRealtorUrl(url) {
  try {
    const parsedUrl = new URL(url);
    
    // Check if the URL is from realtor.com
    if (!parsedUrl.hostname.includes('realtor.com')) {
      return false;
    }
    
    // Check if it's a realtor profile URL
    return parsedUrl.pathname.includes('/realestateagents/');
  } catch (error) {
    return false;
  }
}

// Export the enhanced handler and utility functions
export default withAuth(handler);
export { isValidRealtorUrl, handleProgressStream };