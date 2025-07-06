/**
 * OpenAI GPT-4 Vision Provider
 * Implements AI-powered contact extraction using OpenAI's GPT-4 Vision model
 * Provides high-quality vision analysis for complex contact extraction scenarios
 */

import { AIVisionProvider } from './AIVisionProvider.js';
import { ERROR_TYPES } from '../types.js';

/**
 * OpenAI GPT-4 Vision provider for AI-powered contact extraction
 * High-quality but higher cost - used as secondary fallback
 */
export class OpenAIProvider extends AIVisionProvider {
  /**
   * Create a new OpenAI provider
   * @param {Object} config - Provider configuration
   */
  constructor(config = {}) {
    super({
      name: 'openai-gpt4-vision',
      modelName: 'gpt-4-vision-preview',
      priority: 2, // Lower priority due to higher cost
      rateLimit: 20, // Conservative rate limit
      timeout: 15000, // 15 seconds for vision processing
      costPerRequest: 0.01, // Higher cost per request
      maxTokens: 1000, // Conservative token limit
      temperature: 0.1,
      confidenceThreshold: 0.8, // Higher confidence threshold
      inputType: 'screenshot', // Primary input type for vision
      monthlyCostLimit: 100, // Higher cost limit for quality
      ...config
    });

    // OpenAI-specific configuration
    this.openaiConfig = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      organization: config.organization || process.env.OPENAI_ORGANIZATION,
      endpoint: config.endpoint || 'https://api.openai.com/v1/chat/completions',
      maxRetries: config.maxRetries || 3,
      backoffFactor: config.backoffFactor || 2,
      supportedImageFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
      maxImageSize: 20 * 1024 * 1024, // 20MB max image size
      imageDetail: config.imageDetail || 'auto', // 'low', 'high', 'auto'
      responseFormat: config.responseFormat || { type: 'json_object' }
    };

    // Rate limiting for OpenAI API
    this.rateLimits = {
      requestsPerMinute: 20,
      tokensPerMinute: 10000,
      requestsPerDay: 500,
      tokensPerDay: 150000
    };

    // Track daily usage
    this.dailyUsage = {
      requests: 0,
      tokens: 0,
      resetTime: this.getDayResetTime()
    };

    // Pricing information (as of 2024)
    this.pricing = {
      inputTokens: 0.01 / 1000,  // $0.01 per 1K tokens
      outputTokens: 0.03 / 1000, // $0.03 per 1K tokens
      imageTokens: 0.00765 / 1000 // $0.00765 per 1K image tokens
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

    return this.dailyUsage.requests < this.rateLimits.requestsPerDay &&
           this.dailyUsage.tokens < this.rateLimits.tokensPerDay;
  }

  /**
   * Enhanced rate limit check including daily limits
   * @returns {boolean} - Whether provider can make another request
   */
  checkRateLimit() {
    return super.checkRateLimit() && this.checkDailyLimits();
  }

  /**
   * Initialize the OpenAI API client
   */
  async initializeClient() {
    if (!this.openaiConfig.apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }

    // Test API connectivity
    try {
      await this.testApiConnection();
      this.logger.info('OpenAI API client initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize OpenAI client: ${error.message}`);
    }
  }

  /**
   * Test API connection
   * @private
   */
  async testApiConnection() {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.openaiConfig.apiKey}`
    };

    if (this.openaiConfig.organization) {
      headers['OpenAI-Organization'] = this.openaiConfig.organization;
    }

    const response = await fetch(this.openaiConfig.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.aiConfig.modelName,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API test failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Make AI API call to OpenAI
   * @param {string} prompt - The prompt to send
   * @param {string} content - Content to analyze (HTML or base64 image)
   * @returns {Promise<Object>} - AI response
   */
  async makeAICall(prompt, content) {
    const startTime = Date.now();
    
    try {
      // Prepare the request based on input type
      const messages = await this.prepareMessages(prompt, content);
      
      const requestBody = {
        model: this.aiConfig.modelName,
        messages,
        max_tokens: this.aiConfig.maxTokens,
        temperature: this.aiConfig.temperature,
        response_format: this.openaiConfig.responseFormat
      };

      // Make the API call with retry logic
      const response = await this.makeApiCallWithRetry(requestBody);
      
      // Parse response
      const parsedResponse = await this.parseOpenAIResponse(response);
      
      // Update usage tracking
      this.updateUsageTracking(parsedResponse);
      
      return {
        content: parsedResponse.content,
        confidence: parsedResponse.confidence,
        tokensUsed: parsedResponse.tokensUsed,
        cost: this.calculateCost(parsedResponse.usage),
        duration: Date.now() - startTime,
        rawResponse: response
      };

    } catch (error) {
      throw this.handleOpenAIError(error);
    }
  }

  /**
   * Prepare messages for OpenAI API based on input type
   * @param {string} prompt - The prompt to send
   * @param {string} content - Content to analyze
   * @returns {Promise<Array>} - Formatted messages
   * @private
   */
  async prepareMessages(prompt, content) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert at extracting contact information from web content. Always respond with valid JSON.'
      }
    ];

    if (this.aiConfig.inputType === 'screenshot' && this.isBase64Image(content)) {
      // Vision API call with image
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: content, // Should be data:image/jpeg;base64,... format
              detail: this.openaiConfig.imageDetail
            }
          }
        ]
      });
    } else {
      // Text-based API call
      messages.push({
        role: 'user',
        content: `${prompt}\n\nContent to analyze:\n${content}`
      });
    }

    return messages;
  }

  /**
   * Check if content is a base64 image
   * @param {string} content - Content to check
   * @returns {boolean} - Whether content is base64 image
   * @private
   */
  isBase64Image(content) {
    return content.startsWith('data:image/') && content.includes('base64,');
  }

  /**
   * Make API call with retry logic
   * @param {Object} requestBody - Request body for API call
   * @returns {Promise<Object>} - API response
   * @private
   */
  async makeApiCallWithRetry(requestBody) {
    const { maxRetries, backoffFactor } = this.openaiConfig;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiConfig.apiKey}`
        };

        if (this.openaiConfig.organization) {
          headers['OpenAI-Organization'] = this.openaiConfig.organization;
        }

        const response = await fetch(this.openaiConfig.endpoint, {
          method: 'POST',
          headers,
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
            error.code = errorData.error?.code;
            throw error;
          }
        }

        return await response.json();

      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries && this.shouldRetryError(error)) {
          const delay = 1000 * Math.pow(backoffFactor, attempt);
          this.logger.warn(`OpenAI API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message);
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
           error.message.includes('timeout') ||
           error.code === 'insufficient_quota';
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
        return ERROR_TYPES.AUTHENTICATION_ERROR;
      case 403:
        return ERROR_TYPES.AUTHORIZATION_ERROR;
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
   * Parse OpenAI API response
   * @param {Object} response - Raw API response
   * @returns {Object} - Parsed response
   * @private
   */
  async parseOpenAIResponse(response) {
    try {
      if (!response.choices || response.choices.length === 0) {
        throw new Error('No choices in OpenAI response');
      }

      const choice = response.choices[0];
      
      if (!choice.message || !choice.message.content) {
        throw new Error('No content in OpenAI choice');
      }

      const content = choice.message.content;
      
      // Calculate confidence based on finish reason
      let confidence = 0.85; // Default confidence
      
      if (choice.finish_reason === 'stop') {
        confidence = 0.95;
      } else if (choice.finish_reason === 'length') {
        confidence = 0.75;
      } else if (choice.finish_reason === 'content_filter') {
        confidence = 0.6;
      }

      return {
        content,
        confidence,
        tokensUsed: response.usage?.total_tokens || 0,
        usage: response.usage,
        finishReason: choice.finish_reason,
        logprobs: choice.logprobs
      };

    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${error.message}`);
    }
  }

  /**
   * Calculate cost for the API call
   * @param {Object} usage - Usage object from OpenAI response
   * @returns {number} - Cost in dollars
   * @private
   */
  calculateCost(usage) {
    if (!usage) return this.aiConfig.costPerRequest;

    const inputCost = (usage.prompt_tokens || 0) * this.pricing.inputTokens;
    const outputCost = (usage.completion_tokens || 0) * this.pricing.outputTokens;
    
    return inputCost + outputCost;
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
   * Handle OpenAI-specific errors
   * @param {Error} error - The error that occurred
   * @returns {Error} - Processed error
   * @private
   */
  handleOpenAIError(error) {
    let errorType = ERROR_TYPES.UNKNOWN_ERROR;
    let message = error.message;

    if (message.includes('API key')) {
      errorType = ERROR_TYPES.AUTHENTICATION_ERROR;
      message = 'Invalid or missing OpenAI API key';
    } else if (message.includes('insufficient_quota') || message.includes('exceeded')) {
      errorType = ERROR_TYPES.RATE_LIMIT_ERROR;
      message = 'OpenAI API quota exceeded';
    } else if (message.includes('rate limit')) {
      errorType = ERROR_TYPES.RATE_LIMIT_ERROR;
      message = 'OpenAI API rate limit exceeded';
    } else if (message.includes('content_filter')) {
      errorType = ERROR_TYPES.VALIDATION_ERROR;
      message = 'Content blocked by OpenAI content filter';
    } else if (message.includes('timeout')) {
      errorType = ERROR_TYPES.TIMEOUT_ERROR;
      message = 'OpenAI API request timed out';
    } else if (message.includes('model_not_found')) {
      errorType = ERROR_TYPES.CONFIGURATION_ERROR;
      message = 'OpenAI model not found or not available';
    }

    const processedError = new Error(`OpenAI Provider: ${message}`);
    processedError.type = errorType;
    processedError.provider = this.config.name;
    processedError.originalError = error;
    processedError.code = error.code;

    return processedError;
  }

  /**
   * Get provider-specific status
   * @returns {Object} - Enhanced status with OpenAI-specific info
   */
  getStatus() {
    const baseStatus = super.getStatus();
    const now = Date.now();
    
    return {
      ...baseStatus,
      openaiSpecific: {
        modelName: this.aiConfig.modelName,
        endpoint: this.openaiConfig.endpoint,
        hasApiKey: !!this.openaiConfig.apiKey,
        hasOrganization: !!this.openaiConfig.organization,
        imageDetail: this.openaiConfig.imageDetail,
        dailyUsage: {
          requests: this.dailyUsage.requests,
          tokens: this.dailyUsage.tokens,
          requestsRemaining: this.rateLimits.requestsPerDay - this.dailyUsage.requests,
          tokensRemaining: this.rateLimits.tokensPerDay - this.dailyUsage.tokens,
          resetTime: this.dailyUsage.resetTime,
          timeUntilReset: Math.max(0, this.dailyUsage.resetTime - now)
        },
        rateLimits: this.rateLimits,
        pricing: this.pricing,
        supportedFormats: this.openaiConfig.supportedImageFormats
      }
    };
  }

  /**
   * Test OpenAI provider connectivity
   * @returns {Promise<boolean>} - Whether the provider is working
   */
  async testConnection() {
    try {
      if (!this.openaiConfig.apiKey) {
        return false;
      }

      const testPrompt = "Return a JSON object with a 'test' field containing the value 'success'.";
      const testContent = "<div>Test content</div>";
      
      const response = await this.makeAICall(testPrompt, testContent);
      
      // Check if response is valid
      return response && response.content && response.content.includes('success');

    } catch (error) {
      this.logger.warn('OpenAI connection test failed:', error.message);
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

  /**
   * Estimate cost for a given content size
   * @param {string} content - Content to analyze
   * @returns {number} - Estimated cost in dollars
   */
  estimateCost(content) {
    const estimatedTokens = Math.ceil(content.length / 4); // Rough estimation
    return estimatedTokens * this.pricing.inputTokens + 
           (this.aiConfig.maxTokens / 2) * this.pricing.outputTokens; // Assume half max tokens output
  }
}

export default OpenAIProvider;