/**
 * Google Gemini Flash AI Vision Provider
 * Implements AI-powered contact extraction using Google's Gemini Flash model
 * Features generous free tier for cost-effective intelligent scraping
 */

import { AIVisionProvider } from './AIVisionProvider.js';
import { ERROR_TYPES } from '../types.js';

/**
 * Google Gemini Flash provider for AI-powered contact extraction
 * Optimized for speed and cost-effectiveness with generous free tier
 */
export class GeminiProvider extends AIVisionProvider {
  /**
   * Create a new Gemini provider
   * @param {Object} config - Provider configuration
   */
  constructor(config = {}) {
    super({
      name: 'gemini-flash',
      modelName: 'gemini-1.5-flash',
      priority: 3, // High priority for AI fallback
      rateLimit: 60, // 60 requests per minute (generous free tier)
      timeout: 8000, // 8 seconds for fast responses
      costPerRequest: 0.0005, // Very low cost with free tier
      maxTokens: 2048,
      temperature: 0.1,
      confidenceThreshold: 0.7,
      inputType: 'html', // Primary input type
      monthlyCostLimit: 10, // Low cost limit due to generous free tier
      ...config
    });

    // Gemini-specific configuration
    this.geminiConfig = {
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      endpoint: config.endpoint || 'https://generativelanguage.googleapis.com/v1beta/models',
      maxRetries: config.maxRetries || 3,
      backoffFactor: config.backoffFactor || 2,
      safetySettings: config.safetySettings || [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ],
      generationConfig: {
        temperature: this.aiConfig.temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: this.aiConfig.maxTokens,
        responseMimeType: 'application/json'
      }
    };

    // Rate limiting for free tier (generous limits)
    this.freeTierLimits = {
      requestsPerMinute: 60,
      requestsPerDay: 1500,
      tokensPerMinute: 32000,
      tokensPerDay: 50000
    };

    // Track daily usage for free tier
    this.dailyUsage = {
      requests: 0,
      tokens: 0,
      resetTime: this.getDayResetTime()
    };

    this.logger = config.logger || console;
  }

  /**
   * Get the reset time for daily usage (midnight UTC)
   * @returns {number} - Timestamp for next reset
   * @private
   */
  getDayResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Check if daily usage limits are exceeded
   * @returns {boolean} - Whether within daily limits
   * @private
   */
  checkDailyLimits() {
    const now = Date.now();
    
    // Reset daily usage if needed
    if (now >= this.dailyUsage.resetTime) {
      this.dailyUsage.requests = 0;
      this.dailyUsage.tokens = 0;
      this.dailyUsage.resetTime = this.getDayResetTime();
    }

    return this.dailyUsage.requests < this.freeTierLimits.requestsPerDay &&
           this.dailyUsage.tokens < this.freeTierLimits.tokensPerDay;
  }

  /**
   * Enhanced rate limit check including daily limits
   * @returns {boolean} - Whether provider can make another request
   */
  checkRateLimit() {
    return super.checkRateLimit() && this.checkDailyLimits();
  }

  /**
   * Initialize the Gemini API client
   */
  async initializeClient() {
    if (!this.geminiConfig.apiKey) {
      throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable.');
    }

    // Test API connectivity
    try {
      await this.testApiConnection();
      this.logger.info('Gemini API client initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize Gemini client: ${error.message}`);
    }
  }

  /**
   * Test API connection
   * @private
   */
  async testApiConnection() {
    const testUrl = `${this.geminiConfig.endpoint}/${this.aiConfig.modelName}:generateContent?key=${this.geminiConfig.apiKey}`;
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello"
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API test failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Make AI API call to Gemini
   * @param {string} prompt - The prompt to send
   * @param {string} content - Content to analyze (HTML)
   * @returns {Promise<Object>} - AI response
   */
  async makeAICall(prompt, content) {
    const startTime = Date.now();
    
    try {
      // Prepare the request
      const requestBody = {
        contents: [{
          parts: [{
            text: `${prompt}\n\nContent to analyze:\n${content}`
          }]
        }],
        generationConfig: this.geminiConfig.generationConfig,
        safetySettings: this.geminiConfig.safetySettings
      };

      // Make the API call with retry logic
      const response = await this.makeApiCallWithRetry(requestBody);
      
      // Parse response
      const parsedResponse = await this.parseGeminiResponse(response);
      
      // Update usage tracking
      this.updateUsageTracking(parsedResponse);
      
      return {
        content: parsedResponse.content,
        confidence: parsedResponse.confidence,
        tokensUsed: parsedResponse.tokensUsed,
        cost: this.calculateCost(parsedResponse.tokensUsed),
        duration: Date.now() - startTime,
        rawResponse: response
      };

    } catch (error) {
      throw this.handleGeminiError(error);
    }
  }

  /**
   * Make API call with retry logic
   * @param {Object} requestBody - Request body for API call
   * @returns {Promise<Object>} - API response
   * @private
   */
  async makeApiCallWithRetry(requestBody) {
    const { maxRetries, backoffFactor } = this.geminiConfig;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.geminiConfig.endpoint}/${this.aiConfig.modelName}:generateContent?key=${this.geminiConfig.apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          timeout: this.config.timeout
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Check if this is a retryable error
          if (this.isRetryableError(response.status)) {
            throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
          } else {
            // Non-retryable error, throw immediately
            const error = new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
            error.type = this.getErrorType(response.status);
            throw error;
          }
        }

        return await response.json();

      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries && this.shouldRetryError(error)) {
          const delay = 1000 * Math.pow(backoffFactor, attempt);
          this.logger.warn(`Gemini API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if HTTP status code is retryable
   * @param {number} status - HTTP status code
   * @returns {boolean} - Whether the error is retryable
   * @private
   */
  isRetryableError(status) {
    return [429, 500, 502, 503, 504].includes(status);
  }

  /**
   * Check if error should be retried
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether to retry
   * @private
   */
  shouldRetryError(error) {
    return error.message.includes('429') || 
           error.message.includes('500') || 
           error.message.includes('502') || 
           error.message.includes('503') || 
           error.message.includes('504') ||
           error.message.includes('timeout');
  }

  /**
   * Get error type from HTTP status
   * @param {number} status - HTTP status code
   * @returns {string} - Error type
   * @private
   */
  getErrorType(status) {
    switch (status) {
      case 429:
        return ERROR_TYPES.RATE_LIMIT_ERROR;
      case 401:
      case 403:
        return ERROR_TYPES.AUTHENTICATION_ERROR;
      case 400:
        return ERROR_TYPES.VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_TYPES.API_ERROR;
      default:
        return ERROR_TYPES.UNKNOWN_ERROR;
    }
  }

  /**
   * Parse Gemini API response
   * @param {Object} response - Raw API response
   * @returns {Object} - Parsed response
   * @private
   */
  async parseGeminiResponse(response) {
    try {
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No candidates in Gemini response');
      }

      const candidate = response.candidates[0];
      
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('No content in Gemini candidate');
      }

      const content = candidate.content.parts[0].text;
      
      // Extract confidence from safety ratings or finish reason
      let confidence = 0.8; // Default confidence
      
      if (candidate.finishReason === 'STOP') {
        confidence = 0.9;
      } else if (candidate.finishReason === 'MAX_TOKENS') {
        confidence = 0.7;
      }

      // Estimate token usage (Gemini doesn't always provide this)
      const tokensUsed = this.estimateTokenUsage(content);

      return {
        content,
        confidence,
        tokensUsed,
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings
      };

    } catch (error) {
      throw new Error(`Failed to parse Gemini response: ${error.message}`);
    }
  }

  /**
   * Estimate token usage for cost calculation
   * @param {string} content - Response content
   * @returns {number} - Estimated tokens used
   * @private
   */
  estimateTokenUsage(content) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(content.length / 4);
  }

  /**
   * Calculate cost for the API call
   * @param {number} tokensUsed - Number of tokens used
   * @returns {number} - Cost in dollars
   * @private
   */
  calculateCost(tokensUsed) {
    // Gemini Flash pricing (as of 2024)
    // Free tier: 15 requests per minute, 1 million tokens per day
    // Paid tier: $0.35 per 1M input tokens, $1.05 per 1M output tokens
    
    if (this.isWithinFreeTier(tokensUsed)) {
      return 0; // Free tier
    }

    // Simplified cost calculation for paid tier
    const costPerToken = 0.0000007; // Average cost per token
    return tokensUsed * costPerToken;
  }

  /**
   * Check if usage is within free tier limits
   * @param {number} tokensUsed - Tokens for current request
   * @returns {boolean} - Whether within free tier
   * @private
   */
  isWithinFreeTier(tokensUsed) {
    const afterUsage = {
      requests: this.dailyUsage.requests + 1,
      tokens: this.dailyUsage.tokens + tokensUsed
    };

    return afterUsage.requests <= this.freeTierLimits.requestsPerDay &&
           afterUsage.tokens <= this.freeTierLimits.tokensPerDay;
  }

  /**
   * Update usage tracking
   * @param {Object} response - Parsed API response
   * @private
   */
  updateUsageTracking(response) {
    this.dailyUsage.requests++;
    this.dailyUsage.tokens += response.tokensUsed;
  }

  /**
   * Handle Gemini-specific errors
   * @param {Error} error - The error that occurred
   * @returns {Error} - Processed error
   * @private
   */
  handleGeminiError(error) {
    let errorType = ERROR_TYPES.UNKNOWN_ERROR;
    let message = error.message;

    if (message.includes('API key')) {
      errorType = ERROR_TYPES.AUTHENTICATION_ERROR;
      message = 'Invalid or missing Gemini API key';
    } else if (message.includes('quota') || message.includes('429')) {
      errorType = ERROR_TYPES.RATE_LIMIT_ERROR;
      message = 'Gemini API rate limit exceeded';
    } else if (message.includes('safety')) {
      errorType = ERROR_TYPES.VALIDATION_ERROR;
      message = 'Content blocked by Gemini safety filters';
    } else if (message.includes('timeout')) {
      errorType = ERROR_TYPES.TIMEOUT_ERROR;
      message = 'Gemini API request timed out';
    }

    const processedError = new Error(`Gemini Provider: ${message}`);
    processedError.type = errorType;
    processedError.provider = this.config.name;
    processedError.originalError = error;

    return processedError;
  }

  /**
   * Get provider-specific status
   * @returns {Object} - Enhanced status with Gemini-specific info
   */
  getStatus() {
    const baseStatus = super.getStatus();
    const now = Date.now();
    
    return {
      ...baseStatus,
      geminiSpecific: {
        modelName: this.aiConfig.modelName,
        endpoint: this.geminiConfig.endpoint,
        hasApiKey: !!this.geminiConfig.apiKey,
        dailyUsage: {
          requests: this.dailyUsage.requests,
          tokens: this.dailyUsage.tokens,
          requestsRemaining: this.freeTierLimits.requestsPerDay - this.dailyUsage.requests,
          tokensRemaining: this.freeTierLimits.tokensPerDay - this.dailyUsage.tokens,
          resetTime: this.dailyUsage.resetTime,
          timeUntilReset: Math.max(0, this.dailyUsage.resetTime - now)
        },
        freeTierLimits: this.freeTierLimits,
        withinFreeTier: this.isWithinFreeTier(0)
      }
    };
  }

  /**
   * Test Gemini provider connectivity
   * @returns {Promise<boolean>} - Whether the provider is working
   */
  async testConnection() {
    try {
      if (!this.geminiConfig.apiKey) {
        return false;
      }

      const testPrompt = "Return a JSON object with a 'test' field containing 'success'.";
      const testContent = "<div>Test content</div>";
      
      const response = await this.makeAICall(testPrompt, testContent);
      
      // Check if response is valid
      return response && response.content && response.content.includes('success');

    } catch (error) {
      this.logger.warn('Gemini connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Reset daily usage tracking (for testing or manual reset)
   */
  resetDailyUsage() {
    this.dailyUsage.requests = 0;
    this.dailyUsage.tokens = 0;
    this.dailyUsage.resetTime = this.getDayResetTime();
  }
}

export default GeminiProvider;