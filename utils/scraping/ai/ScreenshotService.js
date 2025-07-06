/**
 * Screenshot Service for AI Vision Analysis
 * Provides automated screenshot capture for AI vision-based contact extraction
 * Supports multiple screenshot methods and optimization for AI analysis
 */

import { ERROR_TYPES } from '../types.js';

/**
 * Screenshot service for capturing webpage screenshots
 * Optimized for AI vision analysis with multiple fallback methods
 */
export class ScreenshotService {
  /**
   * Create a new screenshot service
   * @param {Object} config - Service configuration
   */
  constructor(config = {}) {
    this.config = {
      // Screenshot dimensions optimized for AI vision
      width: config.width || 1920,
      height: config.height || 1080,
      
      // Image quality and format
      quality: config.quality || 85,
      format: config.format || 'jpeg',
      
      // Viewport and timing
      viewportWidth: config.viewportWidth || 1920,
      viewportHeight: config.viewportHeight || 1080,
      waitTime: config.waitTime || 3000, // Wait for page load
      
      // Capture options
      fullPage: config.fullPage || false,
      clip: config.clip || null, // {x, y, width, height}
      
      // Timeout and retry
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      
      // User agent and headers
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      headers: config.headers || {},
      
      // Screenshot methods preference order
      methods: config.methods || ['puppeteer', 'playwright', 'api', 'fallback'],
      
      // API service config (for screenshot APIs)
      apiConfig: {
        service: config.apiService || 'htmlcsstoimage',
        apiKey: config.apiKey || process.env.SCREENSHOT_API_KEY,
        endpoint: config.apiEndpoint || 'https://hcti.io/v1/image',
        ...config.apiConfig
      },
      
      ...config
    };

    this.logger = config.logger || console;
    this.cache = new Map();
    this.cacheTimeout = config.cacheTimeout || 300000; // 5 minutes
  }

  /**
   * Capture screenshot of a webpage
   * @param {string} url - URL to capture
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} - Base64 encoded screenshot
   */
  async captureScreenshot(url, options = {}) {
    const cacheKey = this.generateCacheKey(url, options);
    
    // Check cache first
    const cached = this.getCachedScreenshot(cacheKey);
    if (cached) {
      return cached;
    }

    const mergedOptions = { ...this.config, ...options };
    
    // Try screenshot methods in order of preference
    for (const method of this.config.methods) {
      try {
        this.logger.info(`Attempting screenshot with method: ${method}`);
        
        const screenshot = await this.captureWithMethod(url, method, mergedOptions);
        
        if (screenshot) {
          // Cache the result
          this.cacheScreenshot(cacheKey, screenshot);
          return screenshot;
        }
      } catch (error) {
        this.logger.warn(`Screenshot method ${method} failed:`, error.message);
      }
    }

    throw new Error('All screenshot methods failed');
  }

  /**
   * Capture screenshot using a specific method
   * @param {string} url - URL to capture
   * @param {string} method - Screenshot method to use
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} - Base64 encoded screenshot
   * @private
   */
  async captureWithMethod(url, method, options) {
    const startTime = Date.now();
    
    try {
      let screenshot;
      
      switch (method) {
        case 'puppeteer':
          screenshot = await this.captureWithPuppeteer(url, options);
          break;
        case 'playwright':
          screenshot = await this.captureWithPlaywright(url, options);
          break;
        case 'api':
          screenshot = await this.captureWithAPI(url, options);
          break;
        case 'fallback':
          screenshot = await this.captureWithFallback(url, options);
          break;
        default:
          throw new Error(`Unknown screenshot method: ${method}`);
      }

      const duration = Date.now() - startTime;
      this.logger.info(`Screenshot captured with ${method} in ${duration}ms`);
      
      return screenshot;
    } catch (error) {
      throw new Error(`Screenshot method ${method} failed: ${error.message}`);
    }
  }

  /**
   * Capture screenshot using Puppeteer
   * @param {string} url - URL to capture
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} - Base64 encoded screenshot
   * @private
   */
  async captureWithPuppeteer(url, options) {
    try {
      // Dynamic import to avoid requiring puppeteer if not installed
      const puppeteer = await import('puppeteer');
      
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });

      try {
        const page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport({
          width: options.viewportWidth,
          height: options.viewportHeight
        });
        
        await page.setUserAgent(options.userAgent);
        
        // Set headers if provided
        if (options.headers && Object.keys(options.headers).length > 0) {
          await page.setExtraHTTPHeaders(options.headers);
        }

        // Navigate to page
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: options.timeout
        });

        // Wait for additional loading
        await page.waitForTimeout(options.waitTime);

        // Take screenshot
        const screenshotOptions = {
          type: options.format,
          quality: options.format === 'jpeg' ? options.quality : undefined,
          fullPage: options.fullPage,
          clip: options.clip
        };

        const screenshot = await page.screenshot(screenshotOptions);
        
        // Convert to base64 data URL
        const base64 = screenshot.toString('base64');
        return `data:image/${options.format};base64,${base64}`;
        
      } finally {
        await browser.close();
      }
    } catch (error) {
      throw new Error(`Puppeteer screenshot failed: ${error.message}`);
    }
  }

  /**
   * Capture screenshot using Playwright
   * @param {string} url - URL to capture
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} - Base64 encoded screenshot
   * @private
   */
  async captureWithPlaywright(url, options) {
    try {
      // Dynamic import to avoid requiring playwright if not installed
      const { chromium } = await import('playwright');
      
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });

      try {
        const context = await browser.newContext({
          viewport: {
            width: options.viewportWidth,
            height: options.viewportHeight
          },
          userAgent: options.userAgent,
          extraHTTPHeaders: options.headers
        });

        const page = await context.newPage();
        
        // Navigate to page
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: options.timeout
        });

        // Wait for additional loading
        await page.waitForTimeout(options.waitTime);

        // Take screenshot
        const screenshotOptions = {
          type: options.format,
          quality: options.format === 'jpeg' ? options.quality : undefined,
          fullPage: options.fullPage,
          clip: options.clip
        };

        const screenshot = await page.screenshot(screenshotOptions);
        
        // Convert to base64 data URL
        const base64 = screenshot.toString('base64');
        return `data:image/${options.format};base64,${base64}`;
        
      } finally {
        await browser.close();
      }
    } catch (error) {
      throw new Error(`Playwright screenshot failed: ${error.message}`);
    }
  }

  /**
   * Capture screenshot using API service
   * @param {string} url - URL to capture
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} - Base64 encoded screenshot
   * @private
   */
  async captureWithAPI(url, options) {
    const { apiConfig } = options;
    
    if (!apiConfig.apiKey) {
      throw new Error('API key required for screenshot API service');
    }

    try {
      const requestBody = {
        url: url,
        viewport_width: options.viewportWidth,
        viewport_height: options.viewportHeight,
        device_scale_factor: 1,
        format: options.format,
        quality: options.quality,
        full_page: options.fullPage,
        ms_delay: options.waitTime
      };

      const response = await fetch(apiConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify(requestBody),
        timeout: options.timeout
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.url) {
        // Download the image from the provided URL
        const imageResponse = await fetch(result.url);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');
        return `data:image/${options.format};base64,${base64}`;
      } else {
        throw new Error('No image URL in API response');
      }
    } catch (error) {
      throw new Error(`API screenshot failed: ${error.message}`);
    }
  }

  /**
   * Capture screenshot using fallback method (simple fetch)
   * @param {string} url - URL to capture
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} - Base64 encoded screenshot (placeholder)
   * @private
   */
  async captureWithFallback(url, options) {
    // This is a fallback that just returns a placeholder
    // In a real implementation, this might use a different service
    // or return the HTML content for text-based AI analysis
    
    try {
      // Fetch the HTML content as fallback
      const response = await fetch(url, {
        headers: {
          'User-Agent': options.userAgent,
          ...options.headers
        },
        timeout: options.timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Return HTML content as base64 for text-based analysis
      const base64Html = Buffer.from(html).toString('base64');
      return `data:text/html;base64,${base64Html}`;
      
    } catch (error) {
      throw new Error(`Fallback screenshot failed: ${error.message}`);
    }
  }

  /**
   * Generate cache key for screenshot
   * @param {string} url - URL for screenshot
   * @param {Object} options - Screenshot options
   * @returns {string} - Cache key
   * @private
   */
  generateCacheKey(url, options) {
    const keyData = {
      url,
      width: options.width || this.config.width,
      height: options.height || this.config.height,
      fullPage: options.fullPage || this.config.fullPage,
      format: options.format || this.config.format
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Get cached screenshot if available
   * @param {string} cacheKey - Cache key
   * @returns {string|null} - Cached screenshot or null
   * @private
   */
  getCachedScreenshot(cacheKey) {
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      const { screenshot, timestamp } = cached;
      const age = Date.now() - timestamp;
      
      if (age < this.cacheTimeout) {
        return screenshot;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    
    return null;
  }

  /**
   * Cache screenshot
   * @param {string} cacheKey - Cache key
   * @param {string} screenshot - Screenshot data
   * @private
   */
  cacheScreenshot(cacheKey, screenshot) {
    this.cache.set(cacheKey, {
      screenshot,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Optimize screenshot for AI vision analysis
   * @param {string} screenshot - Base64 encoded screenshot
   * @param {Object} options - Optimization options
   * @returns {Promise<string>} - Optimized screenshot
   */
  async optimizeForAI(screenshot, options = {}) {
    try {
      // Basic optimization options
      const {
        maxWidth = 1024,
        maxHeight = 768,
        quality = 85,
        format = 'jpeg'
      } = options;

      // Extract base64 data
      const base64Data = screenshot.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // If sharp is available, use it for optimization
      try {
        const sharp = await import('sharp');
        
        const optimized = await sharp(imageBuffer)
          .resize(maxWidth, maxHeight, { 
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality })
          .toBuffer();

        return `data:image/${format};base64,${optimized.toString('base64')}`;
      } catch (sharpError) {
        // Sharp not available, return original
        return screenshot;
      }
    } catch (error) {
      this.logger.warn('Screenshot optimization failed:', error.message);
      return screenshot;
    }
  }

  /**
   * Get service status and capabilities
   * @returns {Object} - Service status
   */
  getStatus() {
    return {
      available: true,
      methods: this.config.methods,
      config: {
        width: this.config.width,
        height: this.config.height,
        format: this.config.format,
        quality: this.config.quality,
        timeout: this.config.timeout
      },
      cache: {
        size: this.cache.size,
        maxSize: 100
      },
      capabilities: {
        puppeteer: this.checkCapability('puppeteer'),
        playwright: this.checkCapability('playwright'),
        api: !!this.config.apiConfig.apiKey,
        fallback: true
      }
    };
  }

  /**
   * Check if a specific capability is available
   * @param {string} capability - Capability to check
   * @returns {boolean} - Whether capability is available
   * @private
   */
  checkCapability(capability) {
    try {
      switch (capability) {
        case 'puppeteer':
          require.resolve('puppeteer');
          return true;
        case 'playwright':
          require.resolve('playwright');
          return true;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear screenshot cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.info('Screenshot cache cleared');
  }

  /**
   * Test screenshot service
   * @param {string} testUrl - URL to test with
   * @returns {Promise<boolean>} - Whether service is working
   */
  async testService(testUrl = 'https://example.com') {
    try {
      const screenshot = await this.captureScreenshot(testUrl, {
        width: 800,
        height: 600,
        waitTime: 1000
      });
      
      return screenshot && screenshot.startsWith('data:image/');
    } catch (error) {
      this.logger.warn('Screenshot service test failed:', error.message);
      return false;
    }
  }
}

export default ScreenshotService;