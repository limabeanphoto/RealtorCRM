/**
 * Base AI Vision Provider for intelligent content extraction
 * Provides foundation for AI-powered contact data extraction from HTML/screenshots
 */

import { ScrapingServiceProvider } from '../ScrapingServiceProvider.js';
import { 
  PROVIDER_CAPABILITIES, 
  ERROR_TYPES, 
  CONFIDENCE_LEVELS 
} from '../types.js';

/**
 * Abstract base class for AI Vision providers
 * Extends ScrapingServiceProvider with AI-specific capabilities
 */
export class AIVisionProvider extends ScrapingServiceProvider {
  /**
   * Create a new AI Vision provider
   * @param {Object} config - Provider configuration
   */
  constructor(config) {
    super({
      type: 'ai-vision',
      priority: config.priority || 2, // Lower priority than primary scrapers
      rateLimit: config.rateLimit || 30, // Conservative rate limit
      timeout: config.timeout || 10000, // 10 seconds for AI processing
      ...config
    });

    // AI-specific configuration
    this.aiConfig = {
      modelName: config.modelName || 'unknown',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.1, // Low temperature for consistency
      confidenceThreshold: config.confidenceThreshold || 0.7,
      costPerRequest: config.costPerRequest || 0.001,
      inputType: config.inputType || 'html', // 'html' or 'screenshot'
      ...config.aiConfig
    };

    // Cost tracking
    this.costTracking = {
      totalCost: 0,
      totalTokens: 0,
      requestCount: 0,
      averageCostPerRequest: 0,
      lastReset: Date.now()
    };

    // AI Vision capabilities
    this.addCapability(PROVIDER_CAPABILITIES.AI_VISION);
    this.addCapability(PROVIDER_CAPABILITIES.STRUCTURED_EXTRACTION);
    this.addCapability(PROVIDER_CAPABILITIES.CONFIDENCE_SCORING);
    
    if (this.aiConfig.inputType === 'screenshot') {
      this.addCapability(PROVIDER_CAPABILITIES.SCREENSHOT_ANALYSIS);
    }
  }

  /**
   * Initialize AI provider-specific setup
   * @protected
   */
  initialize() {
    // Initialize API client in subclasses
    this.apiClient = null;
    this.isInitialized = false;
  }

  /**
   * Abstract method to initialize the AI API client
   * Must be implemented by subclasses
   * @abstract
   */
  async initializeClient() {
    throw new Error('initializeClient() method must be implemented by subclasses');
  }

  /**
   * Abstract method to make AI API call
   * Must be implemented by subclasses
   * @param {string} prompt - The prompt to send
   * @param {string} content - Content to analyze (HTML or base64 image)
   * @returns {Promise<Object>} - AI response
   * @abstract
   */
  async makeAICall(prompt, content) {
    throw new Error('makeAICall() method must be implemented by subclasses');
  }

  /**
   * Get cost tracking information
   * @returns {Object} - Cost tracking data
   */
  getCostTracking() {
    return {
      ...this.costTracking,
      projectedMonthlyCost: this.calculateProjectedMonthlyCost(),
      costEfficiency: this.calculateCostEfficiency()
    };
  }

  /**
   * Calculate projected monthly cost based on usage
   * @returns {number} - Projected monthly cost in dollars
   * @private
   */
  calculateProjectedMonthlyCost() {
    if (this.costTracking.requestCount === 0) return 0;
    
    const now = Date.now();
    const timeSinceReset = (now - this.costTracking.lastReset) / 1000; // seconds
    const requestsPerSecond = this.costTracking.requestCount / timeSinceReset;
    const monthlyRequests = requestsPerSecond * 30 * 24 * 60 * 60; // 30 days
    
    return monthlyRequests * this.costTracking.averageCostPerRequest;
  }

  /**
   * Calculate cost efficiency (successful extractions per dollar)
   * @returns {number} - Successful extractions per dollar
   * @private
   */
  calculateCostEfficiency() {
    if (this.costTracking.totalCost === 0) return 0;
    return this.metrics.successfulRequests / this.costTracking.totalCost;
  }

  /**
   * Update cost tracking after API call
   * @param {number} cost - Cost of the API call
   * @param {number} tokens - Number of tokens used
   * @protected
   */
  updateCostTracking(cost, tokens = 0) {
    this.costTracking.totalCost += cost;
    this.costTracking.totalTokens += tokens;
    this.costTracking.requestCount++;
    this.costTracking.averageCostPerRequest = 
      this.costTracking.totalCost / this.costTracking.requestCount;
  }

  /**
   * Check if provider is within cost limits
   * @returns {boolean} - Whether provider can make another request
   */
  checkCostLimits() {
    const projectedCost = this.calculateProjectedMonthlyCost();
    const costLimit = this.config.monthlyCostLimit || 50; // Default $50 limit
    
    return projectedCost < costLimit;
  }

  /**
   * Enhanced rate limit check including cost limits
   * @returns {boolean} - Whether provider can make another request
   */
  checkRateLimit() {
    return super.checkRateLimit() && this.checkCostLimits();
  }

  /**
   * Scrape content using AI vision analysis
   * @param {ScrapingRequest} request - The scraping request
   * @param {ProgressCallback} onProgress - Progress callback
   * @returns {Promise<ScrapingResponse>} - The scraping response
   */
  async scrape(request, onProgress = null) {
    const startTime = Date.now();
    
    try {
      // Check if we can make the request
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit or cost limit exceeded');
      }

      // Initialize client if needed
      if (!this.isInitialized) {
        await this.initializeClient();
        this.isInitialized = true;
      }

      // Progress update
      if (onProgress) {
        onProgress({
          stage: 'ai-initialization',
          progress: 20,
          message: `Initializing ${this.config.name} AI analysis`,
          details: { provider: this.config.name }
        });
      }

      // Increment rate limit counter
      this.incrementRateLimit();

      // Extract content based on input type
      let content;
      if (this.aiConfig.inputType === 'screenshot') {
        content = await this.captureScreenshot(request.url);
      } else {
        // For HTML input, we need to fetch the content first
        content = await this.fetchHtmlContent(request.url);
      }

      // Progress update
      if (onProgress) {
        onProgress({
          stage: 'ai-analysis',
          progress: 50,
          message: `Analyzing content with ${this.config.name}`,
          details: { 
            provider: this.config.name,
            contentType: this.aiConfig.inputType
          }
        });
      }

      // Perform AI extraction
      const extractedData = await this.extractWithAI(content, request.url);
      
      // Progress update
      if (onProgress) {
        onProgress({
          stage: 'ai-completion',
          progress: 90,
          message: 'AI analysis complete',
          details: { 
            provider: this.config.name,
            confidence: extractedData.confidence
          }
        });
      }

      const duration = Date.now() - startTime;
      
      // Update metrics
      this.updateMetrics(true, duration);
      
      // Create response
      const response = this.createResponse(
        true,
        extractedData.data,
        null,
        duration,
        {
          aiProvider: this.config.name,
          modelName: this.aiConfig.modelName,
          inputType: this.aiConfig.inputType,
          tokensUsed: extractedData.tokensUsed || 0,
          costIncurred: extractedData.cost || 0,
          aiConfidence: extractedData.confidence
        }
      );

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(false, duration);
      
      const processedError = this.handleError(error, 'AI Vision Scraping');
      return this.createResponse(false, null, processedError, duration);
    }
  }

  /**
   * Extract contact data using AI vision
   * @param {string} content - Content to analyze (HTML or base64 image)
   * @param {string} url - Original URL for context
   * @returns {Promise<Object>} - Extracted data with confidence and metadata
   * @protected
   */
  async extractWithAI(content, url) {
    // Import vision prompts dynamically
    const { VisionPrompts } = await import('../ai/VisionPrompts.js');
    
    // Get appropriate prompt based on content type
    const prompt = this.aiConfig.inputType === 'screenshot' 
      ? VisionPrompts.getScreenshotExtractionPrompt(url)
      : VisionPrompts.getHtmlExtractionPrompt(url);

    // Make AI API call
    const aiResponse = await this.makeAICall(prompt, content);
    
    // Parse and validate AI response
    const parsedData = await this.parseAIResponse(aiResponse);
    
    // Calculate confidence
    const confidence = this.calculateAIConfidence(parsedData, aiResponse);
    
    // Update cost tracking
    this.updateCostTracking(
      aiResponse.cost || this.aiConfig.costPerRequest,
      aiResponse.tokensUsed || 0
    );

    return {
      data: parsedData,
      confidence: confidence,
      tokensUsed: aiResponse.tokensUsed || 0,
      cost: aiResponse.cost || this.aiConfig.costPerRequest,
      rawResponse: aiResponse.rawResponse || null
    };
  }

  /**
   * Parse AI response into structured contact data
   * @param {Object} aiResponse - Raw AI response
   * @returns {Promise<Object>} - Parsed contact data
   * @protected
   */
  async parseAIResponse(aiResponse) {
    try {
      // Try to parse JSON response
      let parsed;
      if (typeof aiResponse.content === 'string') {
        // Clean up the response (remove markdown code blocks if present)
        const cleanContent = aiResponse.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        parsed = JSON.parse(cleanContent);
      } else {
        parsed = aiResponse.content;
      }

      // Validate and clean the parsed data
      return this.cleanExtractedData(parsed);

    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  /**
   * Clean and validate extracted data
   * @param {Object} data - Raw extracted data
   * @returns {Object} - Cleaned contact data
   * @protected
   */
  cleanExtractedData(data) {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const cleaned = {};

    // Clean string fields
    const stringFields = ['name', 'company', 'phone', 'email', 'description', 'profileLink'];
    stringFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        cleaned[field] = data[field].trim();
      }
    });

    // Clean phone number
    if (cleaned.phone) {
      cleaned.phone = this.cleanPhoneNumber(cleaned.phone);
    }

    // Clean email
    if (cleaned.email) {
      cleaned.email = cleaned.email.toLowerCase();
    }

    // Ensure required fields
    if (!cleaned.name || !cleaned.profileLink) {
      return null;
    }

    return cleaned;
  }

  /**
   * Clean and format phone number
   * @param {string} phone - Raw phone number
   * @returns {string} - Formatted phone number
   * @private
   */
  cleanPhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if 10 digits
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    // Return original if not 10 digits
    return phone;
  }

  /**
   * Calculate AI-specific confidence score
   * @param {Object} data - Extracted data
   * @param {Object} aiResponse - Raw AI response
   * @returns {number} - Confidence score (0-100)
   * @protected
   */
  calculateAIConfidence(data, aiResponse) {
    if (!data) return 0;

    // Base confidence from data completeness
    let baseConfidence = this.calculateConfidence(data);

    // AI-specific confidence adjustments
    if (aiResponse.confidence) {
      // If AI provides its own confidence, blend with base
      baseConfidence = (baseConfidence + aiResponse.confidence * 100) / 2;
    }

    // Penalty for low-confidence AI responses
    if (aiResponse.confidence && aiResponse.confidence < 0.5) {
      baseConfidence *= 0.8;
    }

    // Bonus for high-confidence AI responses
    if (aiResponse.confidence && aiResponse.confidence > 0.9) {
      baseConfidence *= 1.1;
    }

    return Math.min(Math.max(baseConfidence, 0), 100);
  }

  /**
   * Fetch HTML content from URL
   * @param {string} url - URL to fetch
   * @returns {Promise<string>} - HTML content
   * @protected
   */
  async fetchHtmlContent(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: this.config.timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(`Failed to fetch HTML content: ${error.message}`);
    }
  }

  /**
   * Capture screenshot of the URL
   * @param {string} url - URL to capture
   * @returns {Promise<string>} - Base64 encoded screenshot
   * @protected
   */
  async captureScreenshot(url) {
    // Import screenshot service dynamically
    const { ScreenshotService } = await import('../ai/ScreenshotService.js');
    
    const screenshotService = new ScreenshotService();
    return await screenshotService.captureScreenshot(url);
  }

  /**
   * Extract contact data from HTML (legacy method for compatibility)
   * @param {string} html - HTML content to extract from
   * @param {string} url - Original URL for context
   * @returns {Promise<Object>} - Extracted contact data
   */
  async extractContactData(html, url) {
    const result = await this.extractWithAI(html, url);
    return result.data;
  }

  /**
   * Test AI provider connectivity
   * @returns {Promise<boolean>} - Whether the provider is working
   */
  async testConnection() {
    try {
      await this.initializeClient();
      
      // Test with simple prompt
      const testPrompt = "Extract contact information from this test data.";
      const testContent = "<div>Test</div>";
      
      await this.makeAICall(testPrompt, testContent);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get enhanced status including AI-specific metrics
   * @returns {Object} - Enhanced provider status
   */
  getStatus() {
    const baseStatus = super.getStatus();
    
    return {
      ...baseStatus,
      aiConfig: {
        modelName: this.aiConfig.modelName,
        inputType: this.aiConfig.inputType,
        confidenceThreshold: this.aiConfig.confidenceThreshold
      },
      costTracking: this.getCostTracking(),
      costLimits: {
        withinLimits: this.checkCostLimits(),
        projectedMonthlyCost: this.calculateProjectedMonthlyCost(),
        costLimit: this.config.monthlyCostLimit || 50
      }
    };
  }

  /**
   * Reset cost tracking (useful for monthly resets)
   */
  resetCostTracking() {
    this.costTracking = {
      totalCost: 0,
      totalTokens: 0,
      requestCount: 0,
      averageCostPerRequest: 0,
      lastReset: Date.now()
    };
  }
}

export default AIVisionProvider;