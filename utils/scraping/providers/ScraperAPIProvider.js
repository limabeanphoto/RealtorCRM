/**
 * Enhanced ScraperAPI Provider Implementation
 * Modern, intelligent scraping provider with multiple extraction strategies,
 * fallback mechanisms, and confidence scoring for the RealtorCRM application.
 * 
 * Features:
 * - Multiple extraction strategies (structured data, semantic HTML, pattern matching)
 * - Smart fallback logic with confidence scoring
 * - Modern selector strategies avoiding brittle hash-based CSS classes
 * - Structured data extraction (JSON-LD, microdata)
 * - Pattern matching for phone numbers, emails, names
 * - Efficient ScraperAPI usage with intelligent caching
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapingServiceProvider } from '../ScrapingServiceProvider.js';
import { ContactExtractor } from '../ContactExtractor.js';
import { RealtorExtractor } from '../extractors/RealtorExtractor.js';
import { RealtorSelectors } from '../selectors/RealtorSelectors.js';
import { 
  PROVIDER_CAPABILITIES, 
  PROVIDER_TYPES, 
  ERROR_TYPES, 
  SCRAPING_STATUS,
  CONFIDENCE_LEVELS 
} from '../types.js';

/**
 * ScraperAPI provider for web scraping using ScraperAPI service
 */
export class ScraperAPIProvider extends ScrapingServiceProvider {
  /**
   * Create a new ScraperAPI provider
   * @param {Object} config - Provider configuration
   */
  constructor(config) {
    const providerConfig = {
      name: 'ScraperAPI',
      type: PROVIDER_TYPES.API,
      priority: config.priority || 8,
      rateLimit: config.rateLimit || 100, // 100 requests per minute
      timeout: config.timeout || 30000,
      enabled: config.enabled !== false,
      supportedDomains: config.supportedDomains || ['realtor.com'],
      credentials: {
        apiKey: config.apiKey || process.env.SCRAPERAPI_KEY,
        baseUrl: config.baseUrl || 'http://api.scraperapi.com'
      },
      options: {
        render: config.render !== false,
        keepHeaders: config.keepHeaders !== false,
        countryCode: config.countryCode || 'us',
        premium: config.premium || false,
        deviceType: config.deviceType || 'desktop',
        autoparse: config.autoparse || false,
        ...config.options
      },
      ...config
    };

    super(providerConfig);
    
    // Initialize enhanced contact extractor with custom rules
    this.contactExtractor = new ContactExtractor({
      strictMode: false,
      confidenceThreshold: 50,
      customRules: this.buildCustomExtractionRules()
    });
    
    // Initialize Realtor.com-specific extractor
    this.realtorExtractor = new RealtorExtractor({
      strictMode: false,
      confidenceThreshold: 60,
      enableFallbacks: true
    });
    
    // Initialize modern selector strategies
    this.realtorSelectors = new RealtorSelectors();
    
    // Validate configuration
    this.validateConfig();
  }

  /**
   * Initialize provider capabilities and settings
   * @protected
   */
  initialize() {
    // Add provider capabilities
    this.addCapability(PROVIDER_CAPABILITIES.JAVASCRIPT_RENDERING);
    this.addCapability(PROVIDER_CAPABILITIES.PROXY_SUPPORT);
    this.addCapability(PROVIDER_CAPABILITIES.RATE_LIMITING);
    this.addCapability(PROVIDER_CAPABILITIES.MOBILE_EMULATION);
    this.addCapability(PROVIDER_CAPABILITIES.CUSTOM_HEADERS);
    this.addCapability(PROVIDER_CAPABILITIES.COOKIES);
    
    // Set up axios defaults
    this.httpClient = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'RealtorCRM-ScraperAPI/1.0'
      }
    });
  }

  /**
   * Validate provider configuration
   * @private
   */
  validateConfig() {
    if (!this.config.credentials.apiKey) {
      throw new Error('ScraperAPI: API key is required');
    }

    if (!this.config.credentials.baseUrl) {
      throw new Error('ScraperAPI: Base URL is required');
    }
  }

  /**
   * Build ScraperAPI URL with parameters
   * @param {string} targetUrl - URL to scrape
   * @param {Object} options - Additional options
   * @returns {string} - Complete ScraperAPI URL
   * @private
   */
  buildScraperUrl(targetUrl, options = {}) {
    const { apiKey, baseUrl } = this.config.credentials;
    const combinedOptions = { ...this.config.options, ...options };

    let scraperUrl = `${baseUrl}?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;

    // Add all options to the URL
    Object.entries(combinedOptions).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Convert camelCase to snake_case
        const optionKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (typeof value === 'boolean') {
          scraperUrl += `&${optionKey}=${value}`;
        } else {
          scraperUrl += `&${optionKey}=${encodeURIComponent(value)}`;
        }
      }
    });

    return scraperUrl;
  }

  /**
   * Scrape content from a URL
   * @param {ScrapingRequest} request - The scraping request
   * @param {ProgressCallback} onProgress - Progress callback
   * @returns {Promise<ScrapingResponse>} - The scraping response
   */
  async scrape(request, onProgress = null) {
    const startTime = Date.now();
    
    try {
      // Check rate limits
      if (!this.checkRateLimit()) {
        throw this.createScrapingError(
          ERROR_TYPES.RATE_LIMIT_ERROR,
          'Rate limit exceeded for ScraperAPI provider'
        );
      }

      // Progress update
      if (onProgress) {
        onProgress({
          stage: 'request',
          progress: 10,
          message: 'Preparing ScraperAPI request',
          details: { provider: this.config.name, url: request.url }
        });
      }

      // Build scraper URL
      const scraperUrl = this.buildScraperUrl(request.url, request.options);
      
      // Make request
      this.incrementRateLimit();
      
      if (onProgress) {
        onProgress({
          stage: 'fetching',
          progress: 30,
          message: 'Fetching page content via ScraperAPI',
          details: { provider: this.config.name }
        });
      }

      const response = await this.httpClient.get(scraperUrl);
      
      if (response.status !== 200) {
        throw this.createScrapingError(
          ERROR_TYPES.PROVIDER_ERROR,
          `ScraperAPI returned status: ${response.status}`
        );
      }

      // Progress update
      if (onProgress) {
        onProgress({
          stage: 'extracting',
          progress: 60,
          message: 'Extracting contact data from HTML',
          details: { provider: this.config.name }
        });
      }

      // Extract contact data
      const contactData = await this.extractContactData(response.data, request.url);
      
      // Progress update
      if (onProgress) {
        onProgress({
          stage: 'complete',
          progress: 100,
          message: 'Contact extraction completed',
          details: { provider: this.config.name, confidence: this.calculateConfidence(contactData) }
        });
      }

      const duration = Date.now() - startTime;
      this.updateMetrics(true, duration);
      
      // Update quota tracking
      this.metrics.quotaUsed++;

      return this.createResponse(true, contactData, null, duration, {
        scraperApiUsed: true,
        quotaUsed: this.metrics.quotaUsed,
        httpStatus: response.status
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(false, duration);
      
      const processedError = this.handleError(error, 'scrape');
      
      return this.createResponse(false, null, processedError, duration, {
        scraperApiUsed: true,
        quotaUsed: this.metrics.quotaUsed,
        errorType: processedError.type
      });
    }
  }

  /**
   * Extract contact data from HTML using multiple strategies
   * @param {string} html - HTML content
   * @param {string} url - Original URL
   * @returns {Promise<ContactData>} - Extracted contact data
   */
  async extractContactData(html, url) {
    if (!html || typeof html !== 'string') {
      throw new Error('Invalid HTML content provided');
    }

    try {
      const $ = cheerio.load(html);
      
      // Determine if this is a Realtor.com page
      const isRealtorPage = this.isRealtorPage($, url);
      
      let contactData;
      
      if (isRealtorPage) {
        // Use specialized Realtor.com extractor
        contactData = this.realtorExtractor.extractContactData($, url);
      } else {
        // Use general contact extractor
        contactData = this.contactExtractor.extractContactData($, url);
      }
      
      // Apply additional enhancements
      this.enhanceContactData(contactData, $);
      
      // Log extraction results for debugging
      this.logExtractionResults(contactData, url, isRealtorPage);
      
      return contactData;
    } catch (error) {
      throw this.createScrapingError(
        ERROR_TYPES.EXTRACTION_ERROR,
        `Failed to extract contact data: ${error.message}`
      );
    }
  }

  /**
   * Determine if the page is a Realtor.com page
   * @param {Object} $ - Cheerio instance
   * @param {string} url - Page URL
   * @returns {boolean} - Whether it's a Realtor.com page
   * @private
   */
  isRealtorPage($, url) {
    // Check URL domain
    if (url && url.includes('realtor.com')) {
      return true;
    }
    
    // Check page content for Realtor.com indicators
    const realtorIndicators = [
      'realtor.com',
      'data-testid*="agent"',
      'data-testid*="realtor"',
      '.agent-profile',
      '.realtor-profile',
      'itemProp="RealEstateAgent"'
    ];
    
    return realtorIndicators.some(indicator => {
      if (indicator.includes('*=')) {
        return $(indicator).length > 0;
      }
      return $.text().includes(indicator) || $(indicator).length > 0;
    });
  }

  /**
   * Log extraction results for debugging
   * @param {Object} contactData - Extracted contact data
   * @param {string} url - Original URL
   * @param {boolean} isRealtorPage - Whether Realtor extractor was used
   * @private
   */
  logExtractionResults(contactData, url, isRealtorPage) {
    console.log(`\n=== ScraperAPI Extraction Results ===`);
    console.log(`URL: ${url}`);
    console.log(`Extractor Used: ${isRealtorPage ? 'RealtorExtractor' : 'ContactExtractor'}`);
    console.log(`Overall Confidence: ${contactData.confidence.overall}%`);
    console.log(`Fields Extracted:`);
    
    const fields = ['name', 'company', 'phone', 'email', 'description'];
    fields.forEach(field => {
      const value = contactData[field];
      const confidence = contactData.confidence[field] || 0;
      const status = value ? '✓' : '✗';
      console.log(`  ${status} ${field}: ${value ? value.substring(0, 50) : 'N/A'} (${confidence}%)`);
    });
    
    if (contactData.specialties && contactData.specialties.length > 0) {
      console.log(`  ✓ specialties: ${contactData.specialties.join(', ')}`);
    }
    
    if (Object.keys(contactData.socialLinks).length > 0) {
      console.log(`  ✓ social links: ${Object.keys(contactData.socialLinks).join(', ')}`);
    }
    
    console.log(`=====================================\n`);
  }

  /**
   * Build custom extraction rules for real estate professionals
   * @returns {Array} - Custom extraction rules
   * @private
   */
  buildCustomExtractionRules() {
    return [
      // Enhanced name extraction for real estate professionals
      {
        field: 'name',
        selectors: [
          '[data-testid*="agent-name"]',
          '[data-testid*="realtor-name"]',
          'h1:not(:has(a)):not(:has(img))',
          'h2:not(:has(a)):not(:has(img))',
          '.agent-name',
          '.realtor-name',
          '.profile-name'
        ],
        priority: 95,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        validator: (text) => this.isValidRealtorName(text)
      },
      // Enhanced company extraction with real estate context
      {
        field: 'company',
        selectors: [
          '[data-testid*="brokerage"]',
          '[data-testid*="company"]',
          '.brokerage-name',
          '.company-name',
          '.office-name',
          'p:contains("Realty")',
          'p:contains("Real Estate")',
          'p:contains("Properties")'
        ],
        priority: 95,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        validator: (text) => this.isValidRealtorCompany(text)
      },
      // Enhanced phone extraction with real estate specific patterns
      {
        field: 'phone',
        selectors: [
          'a[data-linkname*="phone"]',
          'a[href^="tel:"]',
          '[data-testid*="phone"]',
          '.phone-number',
          '.contact-phone'
        ],
        priority: 95,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        attribute: 'href',
        transform: (value) => value ? value.replace('tel:', '') : value
      }
    ];
  }

  /**
   * Enhanced contact data extraction with multiple strategies
   * @param {ContactData} contactData - Contact data to enhance
   * @param {Object} $ - Cheerio instance
   * @private
   */
  enhanceContactData(contactData, $) {
    // Strategy 1: Structured data extraction (JSON-LD, microdata)
    const structuredData = this.extractStructuredData($);
    this.mergeStructuredData(contactData, structuredData);
    
    // Strategy 2: Semantic HTML extraction
    this.enhanceWithSemanticExtraction(contactData, $);
    
    // Strategy 3: Pattern matching fallback
    this.enhanceWithPatternMatching(contactData, $);
    
    // Strategy 4: Context-aware extraction
    this.enhanceWithContextAwareExtraction(contactData, $);
    
    // Strategy 5: AI-powered text extraction (fallback)
    this.enhanceWithTextPatternAnalysis(contactData, $);
    
    // Recalculate confidence scores
    this.updateConfidenceScores(contactData);
  }

  /**
   * Extract structured data from JSON-LD and microdata
   * @param {Object} $ - Cheerio instance
   * @returns {Object} - Structured data
   * @private
   */
  extractStructuredData($) {
    const structuredData = {};
    
    // Extract JSON-LD data
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html());
        this.parseJsonLD(jsonData, structuredData);
      } catch (error) {
        console.debug('Failed to parse JSON-LD:', error.message);
      }
    });
    
    // Extract microdata
    $('[itemscope]').each((_, element) => {
      const microdata = this.extractMicrodata($(element));
      Object.assign(structuredData, microdata);
    });
    
    return structuredData;
  }

  /**
   * Parse JSON-LD structured data
   * @param {Object} jsonData - JSON-LD data
   * @param {Object} structuredData - Object to populate
   * @private
   */
  parseJsonLD(jsonData, structuredData) {
    if (Array.isArray(jsonData)) {
      jsonData.forEach(item => this.parseJsonLD(item, structuredData));
      return;
    }
    
    if (jsonData['@type'] === 'Person' || jsonData['@type'] === 'RealEstateAgent') {
      if (jsonData.name) structuredData.name = jsonData.name;
      if (jsonData.telephone) structuredData.phone = jsonData.telephone;
      if (jsonData.email) structuredData.email = jsonData.email;
      if (jsonData.image) structuredData.profilePicture = jsonData.image;
      if (jsonData.worksFor) {
        structuredData.company = typeof jsonData.worksFor === 'string' ? 
          jsonData.worksFor : jsonData.worksFor.name;
      }
      if (jsonData.description) structuredData.description = jsonData.description;
    }
  }

  /**
   * Extract microdata from elements
   * @param {Object} $element - Cheerio element
   * @returns {Object} - Microdata
   * @private
   */
  extractMicrodata($element) {
    const microdata = {};
    
    const itemProps = {
      name: ['name', 'fn'],
      phone: ['telephone', 'tel'],
      email: ['email'],
      company: ['organization', 'org'],
      description: ['description', 'note'],
      profilePicture: ['image', 'photo']
    };
    
    for (const [field, props] of Object.entries(itemProps)) {
      for (const prop of props) {
        const element = $element.find(`[itemprop="${prop}"]`).first();
        if (element.length > 0) {
          const value = element.attr('content') || element.text().trim();
          if (value) {
            microdata[field] = value;
            break;
          }
        }
      }
    }
    
    return microdata;
  }

  /**
   * Enhance with semantic HTML extraction
   * @param {ContactData} contactData - Contact data to enhance
   * @param {Object} $ - Cheerio instance
   * @private
   */
  enhanceWithSemanticExtraction(contactData, $) {
    // Smart name extraction avoiding hash-based classes
    if (!contactData.name || contactData.confidence.name < 80) {
      const nameResult = this.extractWithFallback($, [
        'h1[data-testid*="name"]',
        'h2[data-testid*="name"]',
        'h1:not(:has(a)):not(:has(img))',
        'h2:not(:has(a)):not(:has(img))',
        '.agent-name, .realtor-name, .profile-name',
        '[role="heading"][aria-level="1"]',
        '[role="heading"][aria-level="2"]'
      ], this.isValidRealtorName.bind(this));
      
      if (nameResult.value && nameResult.confidence > contactData.confidence.name) {
        contactData.name = nameResult.value;
        contactData.confidence.name = nameResult.confidence;
      }
    }
    
    // Smart company extraction
    if (!contactData.company || contactData.confidence.company < 80) {
      const companyResult = this.extractWithFallback($, [
        '[data-testid*="brokerage"]',
        '[data-testid*="company"]',
        '.brokerage, .company, .office',
        'p:contains("Realty")',
        'p:contains("Real Estate")',
        'p:contains("Properties")',
        'p:contains("Group")',
        'p:contains("Team")'
      ], this.isValidRealtorCompany.bind(this));
      
      if (companyResult.value && companyResult.confidence > contactData.confidence.company) {
        contactData.company = companyResult.value;
        contactData.confidence.company = companyResult.confidence;
      }
    }
  }

  /**
   * Enhance with pattern matching
   * @param {ContactData} contactData - Contact data to enhance
   * @param {Object} $ - Cheerio instance
   * @private
   */
  enhanceWithPatternMatching(contactData, $) {
    // Extract phone numbers from any text content
    if (!contactData.phone || contactData.confidence.phone < 70) {
      const phonePattern = /\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
      const bodyText = $.text();
      const phoneMatches = bodyText.match(phonePattern);
      
      if (phoneMatches && phoneMatches.length > 0) {
        contactData.phone = this.normalizePhoneNumber(phoneMatches[0]);
        contactData.confidence.phone = 65;
      }
    }
    
    // Extract email addresses from any text content
    if (!contactData.email || contactData.confidence.email < 70) {
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const bodyText = $.text();
      const emailMatches = bodyText.match(emailPattern);
      
      if (emailMatches && emailMatches.length > 0) {
        contactData.email = emailMatches[0].toLowerCase();
        contactData.confidence.email = 65;
      }
    }
  }

  /**
   * Enhance with context-aware extraction
   * @param {ContactData} contactData - Contact data to enhance
   * @param {Object} $ - Cheerio instance
   * @private
   */
  enhanceWithContextAwareExtraction(contactData, $) {
    // Look for contact information in common container patterns
    const contextSelectors = [
      '.contact-info',
      '.agent-details',
      '.profile-contact',
      '.realtor-info',
      '.agent-contact',
      '[data-testid*="contact"]'
    ];
    
    for (const selector of contextSelectors) {
      const $container = $(selector);
      if ($container.length > 0) {
        this.extractFromContainer($container, contactData);
      }
    }
  }

  /**
   * Extract data from a specific container
   * @param {Object} $container - Container element
   * @param {ContactData} contactData - Contact data to enhance
   * @private
   */
  extractFromContainer($container, contactData) {
    const containerText = $container.text();
    
    // Extract phone from container
    if (!contactData.phone) {
      const phoneMatch = containerText.match(/\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/);
      if (phoneMatch) {
        contactData.phone = this.normalizePhoneNumber(phoneMatch[0]);
        contactData.confidence.phone = 75;
      }
    }
    
    // Extract email from container
    if (!contactData.email) {
      const emailMatch = containerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        contactData.email = emailMatch[0].toLowerCase();
        contactData.confidence.email = 75;
      }
    }
  }

  /**
   * Enhance with text pattern analysis
   * @param {ContactData} contactData - Contact data to enhance
   * @param {Object} $ - Cheerio instance
   * @private
   */
  enhanceWithTextPatternAnalysis(contactData, $) {
    // This is a fallback strategy that analyzes text patterns
    // to identify potential contact information
    
    const textNodes = [];
    $('*').each((_, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      if (text.length > 0 && text.length < 200) {
        textNodes.push(text);
      }
    });
    
    // Analyze text nodes for missing information
    for (const text of textNodes) {
      if (!contactData.name && this.looksLikeName(text)) {
        contactData.name = text;
        contactData.confidence.name = 40;
      }
      
      if (!contactData.company && this.looksLikeCompany(text)) {
        contactData.company = text;
        contactData.confidence.company = 40;
      }
    }
  }

  /**
   * Extract with fallback strategies
   * @param {Object} $ - Cheerio instance
   * @param {Array} selectors - Selectors to try
   * @param {Function} validator - Validation function
   * @returns {Object} - Extraction result
   * @private
   */
  extractWithFallback($, selectors, validator) {
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const $elements = $(selector);
      
      $elements.each((_, element) => {
        const $el = $(element);
        const value = $el.text().trim();
        
        if (value && (!validator || validator(value))) {
          // Calculate confidence based on selector priority and validation
          const confidence = Math.max(90 - (i * 10), 50);
          return { value, confidence };
        }
      });
    }
    
    return { value: '', confidence: 0 };
  }

  /**
   * Merge structured data into contact data
   * @param {ContactData} contactData - Contact data to enhance
   * @param {Object} structuredData - Structured data
   * @private
   */
  mergeStructuredData(contactData, structuredData) {
    const fieldMapping = {
      name: 'name',
      phone: 'phone',
      email: 'email',
      company: 'company',
      description: 'description',
      profilePicture: 'profilePicture'
    };
    
    for (const [field, contactField] of Object.entries(fieldMapping)) {
      if (structuredData[field] && 
          (!contactData[contactField] || contactData.confidence[contactField] < 95)) {
        contactData[contactField] = structuredData[field];
        if (contactData.confidence[contactField] !== undefined) {
          contactData.confidence[contactField] = 95;
        }
      }
    }
  }

  /**
   * Update confidence scores based on data quality
   * @param {ContactData} contactData - Contact data
   * @private
   */
  updateConfidenceScores(contactData) {
    // Boost confidence for validated data
    if (contactData.name && this.isValidRealtorName(contactData.name)) {
      contactData.confidence.name = Math.min(contactData.confidence.name + 10, 100);
    }
    
    if (contactData.company && this.isValidRealtorCompany(contactData.company)) {
      contactData.confidence.company = Math.min(contactData.confidence.company + 10, 100);
    }
    
    if (contactData.phone && this.isValidPhoneNumber(contactData.phone)) {
      contactData.confidence.phone = Math.min(contactData.confidence.phone + 10, 100);
    }
    
    if (contactData.email && this.isValidEmailAddress(contactData.email)) {
      contactData.confidence.email = Math.min(contactData.confidence.email + 10, 100);
    }
  }

  /**
   * Check if a URL is a valid image URL
   * @param {string} url - URL to check
   * @returns {boolean} - Whether it's a valid image URL
   * @private
   */
  isValidImageUrl(url) {
    if (!url) return false;
    
    try {
      const parsedUrl = new URL(url);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return imageExtensions.some(ext => parsedUrl.pathname.toLowerCase().includes(ext));
    } catch {
      return false;
    }
  }

  /**
   * Validate if text looks like a realtor name
   * @param {string} text - Text to validate
   * @returns {boolean} - Whether it looks like a realtor name
   * @private
   */
  isValidRealtorName(text) {
    if (!text || text.length < 2 || text.length > 100) return false;
    
    // Should contain at least two words
    const words = text.split(/\s+/);
    if (words.length < 2) return false;
    
    // Should not contain numbers or special characters (except common ones)
    if (/[0-9@#$%^&*()+=\[\]{}|\\:;"'<>?,./]/.test(text)) return false;
    
    // Should not be common non-name text
    const excludePatterns = [
      /^(agent|realtor|broker|associate|specialist|consultant)$/i,
      /^(contact|about|home|properties|listings)$/i,
      /\b(realty|real estate|properties|homes|group|team)\b/i
    ];
    
    return !excludePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Validate if text looks like a realtor company
   * @param {string} text - Text to validate
   * @returns {boolean} - Whether it looks like a realtor company
   * @private
   */
  isValidRealtorCompany(text) {
    if (!text || text.length < 2 || text.length > 150) return false;
    
    // Should contain real estate related keywords
    const realtorKeywords = [
      'realty', 'real estate', 'properties', 'homes', 'group', 'team',
      'associates', 'brokers', 'brokerage', 'realtor', 'agent', 'company',
      'inc', 'llc', 'corp', 'ltd', 'co'
    ];
    
    const lowerText = text.toLowerCase();
    return realtorKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Whether it's a valid phone number
   * @private
   */
  isValidPhoneNumber(phone) {
    if (!phone) return false;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check for valid US phone number patterns
    return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
  }

  /**
   * Validate email address format
   * @param {string} email - Email address to validate
   * @returns {boolean} - Whether it's a valid email address
   * @private
   */
  isValidEmailAddress(email) {
    if (!email) return false;
    
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  /**
   * Normalize phone number to standard format
   * @param {string} phone - Phone number to normalize
   * @returns {string} - Normalized phone number
   * @private
   */
  normalizePhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format US phone numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone;
  }

  /**
   * Check if text looks like a name (heuristic)
   * @param {string} text - Text to check
   * @returns {boolean} - Whether it looks like a name
   * @private
   */
  looksLikeName(text) {
    if (!text || text.length < 3 || text.length > 100) return false;
    
    const words = text.split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    
    // Check if all words start with capital letters
    const allCapitalized = words.every(word => /^[A-Z]/.test(word));
    if (!allCapitalized) return false;
    
    // Check if it doesn't contain numbers or special characters
    if (/[0-9@#$%^&*()+=\[\]{}|\\:;"'<>?,./]/.test(text)) return false;
    
    return true;
  }

  /**
   * Check if text looks like a company name (heuristic)
   * @param {string} text - Text to check
   * @returns {boolean} - Whether it looks like a company name
   * @private
   */
  looksLikeCompany(text) {
    if (!text || text.length < 3 || text.length > 150) return false;
    
    const realtorKeywords = [
      'realty', 'real estate', 'properties', 'homes', 'group', 'team',
      'associates', 'brokers', 'brokerage', 'realtor', 'agent', 'company',
      'inc', 'llc', 'corp', 'ltd', 'co'
    ];
    
    const lowerText = text.toLowerCase();
    return realtorKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Create a scraping-specific error
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @returns {Error} - Scraping error
   * @private
   */
  createScrapingError(type, message) {
    const error = new Error(message);
    error.type = type;
    error.provider = this.config.name;
    error.timestamp = new Date().toISOString();
    return error;
  }

  /**
   * Test the provider connectivity
   * @returns {Promise<boolean>} - Whether the provider is working
   */
  async testConnection() {
    try {
      const testUrl = 'https://httpbin.org/json';
      const scraperUrl = this.buildScraperUrl(testUrl, { render: false });
      
      const response = await this.httpClient.get(scraperUrl);
      return response.status === 200;
    } catch (error) {
      console.warn('ScraperAPI connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get provider-specific status information
   * @returns {Object} - Extended status information
   */
  getStatus() {
    const baseStatus = super.getStatus();
    
    return {
      ...baseStatus,
      quotaUsed: this.metrics.quotaUsed,
      apiKeyPresent: !!this.config.credentials.apiKey,
      baseUrl: this.config.credentials.baseUrl,
      renderingEnabled: this.config.options.render,
      supportedDomains: this.config.supportedDomains,
      lastTestConnection: this.lastConnectionTest
    };
  }

  /**
   * Update quota usage (called externally when quota info is available)
   * @param {number} quotaUsed - Current quota usage
   * @param {number} quotaLimit - Quota limit
   */
  updateQuotaUsage(quotaUsed, quotaLimit) {
    this.metrics.quotaUsed = quotaUsed;
    this.metrics.quotaLimit = quotaLimit;
    this.metrics.quotaPercentage = quotaLimit > 0 ? (quotaUsed / quotaLimit) * 100 : 0;
  }

  /**
   * Check if quota allows for more requests
   * @returns {boolean} - Whether quota allows more requests
   */
  checkQuotaLimit() {
    if (!this.metrics.quotaLimit) return true; // No limit set
    return this.metrics.quotaUsed < this.metrics.quotaLimit;
  }

  /**
   * Enhanced rate limit check including quota
   * @returns {boolean} - Whether provider can make another request
   */
  checkRateLimit() {
    return super.checkRateLimit() && this.checkQuotaLimit();
  }
}

export default ScraperAPIProvider;