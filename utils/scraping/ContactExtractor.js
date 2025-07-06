/**
 * Utility for extracting and normalizing contact data from HTML content
 * This class provides standardized extraction methods and confidence scoring
 */

import { CONFIDENCE_LEVELS } from './types.js';

/**
 * Contact data extraction utility
 */
export class ContactExtractor {
  /**
   * Create a new contact extractor
   * @param {Object} config - Extractor configuration
   */
  constructor(config = {}) {
    this.config = {
      strictMode: config.strictMode || false,
      confidenceThreshold: config.confidenceThreshold || 50,
      customRules: config.customRules || [],
      ...config
    };

    // Initialize extraction strategies
    this.strategies = new Map();
    this.initializeDefaultStrategies();
    
    // Custom rules from config
    if (this.config.customRules.length > 0) {
      this.addCustomRules(this.config.customRules);
    }
  }

  /**
   * Initialize default extraction strategies
   * @private
   */
  initializeDefaultStrategies() {
    // Name extraction strategies
    this.strategies.set('name', [
      {
        name: 'structured_data',
        selectors: ['[itemProp="name"]', '[data-testid*="name"]', '.agent-name'],
        priority: 90,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH
      },
      {
        name: 'semantic_headers',
        selectors: ['h1', 'h2', 'h3'].map(h => `${h}:not(:has(a)):not(:has(img))`),
        priority: 80,
        confidence: CONFIDENCE_LEVELS.HIGH,
        validator: (text) => this.isValidName(text)
      },
      {
        name: 'profile_sections',
        selectors: ['.profile-name', '.agent-title', '.realtor-name'],
        priority: 70,
        confidence: CONFIDENCE_LEVELS.HIGH
      }
    ]);

    // Company extraction strategies
    this.strategies.set('company', [
      {
        name: 'structured_data',
        selectors: ['[itemProp="organization"]', '[data-testid*="company"]', '.company-name'],
        priority: 90,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH
      },
      {
        name: 'brokerage_patterns',
        selectors: ['.brokerage', '.company', '.firm', '.office'],
        priority: 80,
        confidence: CONFIDENCE_LEVELS.HIGH,
        validator: (text) => this.isValidCompany(text)
      },
      {
        name: 'context_clues',
        selectors: ['p', 'span', 'div'],
        priority: 60,
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        validator: (text) => this.containsCompanyKeywords(text)
      }
    ]);

    // Phone extraction strategies
    this.strategies.set('phone', [
      {
        name: 'tel_links',
        selectors: ['a[href^="tel:"]'],
        priority: 95,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        attribute: 'href',
        transform: (value) => value.replace('tel:', '')
      },
      {
        name: 'structured_data',
        selectors: ['[itemProp="telephone"]', '[data-testid*="phone"]'],
        priority: 90,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH
      },
      {
        name: 'phone_patterns',
        selectors: ['span', 'div', 'p', 'a'],
        priority: 70,
        confidence: CONFIDENCE_LEVELS.HIGH,
        validator: (text) => this.containsPhonePattern(text),
        transform: (text) => this.extractPhoneFromText(text)
      }
    ]);

    // Email extraction strategies
    this.strategies.set('email', [
      {
        name: 'mailto_links',
        selectors: ['a[href^="mailto:"]'],
        priority: 95,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        attribute: 'href',
        transform: (value) => value.replace('mailto:', '')
      },
      {
        name: 'structured_data',
        selectors: ['[itemProp="email"]', '[data-testid*="email"]'],
        priority: 90,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH
      },
      {
        name: 'email_patterns',
        selectors: ['span', 'div', 'p', 'a'],
        priority: 70,
        confidence: CONFIDENCE_LEVELS.HIGH,
        validator: (text) => this.containsEmailPattern(text),
        transform: (text) => this.extractEmailFromText(text)
      }
    ]);

    // Description extraction strategies
    this.strategies.set('description', [
      {
        name: 'structured_data',
        selectors: ['[itemProp="description"]', '[data-testid*="bio"]', '.bio', '.description'],
        priority: 90,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH
      },
      {
        name: 'content_sections',
        selectors: ['#bio', '#description', '.about', '.profile-text'],
        priority: 80,
        confidence: CONFIDENCE_LEVELS.HIGH
      },
      {
        name: 'paragraph_content',
        selectors: ['p'],
        priority: 60,
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        validator: (text) => text.length > 50 && this.isValidDescription(text)
      }
    ]);

    // Profile image extraction strategies
    this.strategies.set('profilePicture', [
      {
        name: 'structured_data',
        selectors: ['[itemProp="image"]', '[data-testid*="photo"]', '.profile-image img'],
        priority: 90,
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        attribute: 'src'
      },
      {
        name: 'semantic_images',
        selectors: ['.avatar img', '.headshot img', '.profile-pic img'],
        priority: 80,
        confidence: CONFIDENCE_LEVELS.HIGH,
        attribute: 'src'
      },
      {
        name: 'alt_based',
        selectors: ['img[alt*="photo"]', 'img[alt*="headshot"]', 'img[alt*="profile"]'],
        priority: 70,
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        attribute: 'src'
      }
    ]);
  }

  /**
   * Add custom extraction rules
   * @param {Array<ExtractionRule>} rules - Custom rules to add
   */
  addCustomRules(rules) {
    rules.forEach(rule => {
      if (!this.strategies.has(rule.field)) {
        this.strategies.set(rule.field, []);
      }
      this.strategies.get(rule.field).unshift(rule);
    });
  }

  /**
   * Extract contact data from HTML using Cheerio
   * @param {Object} $ - Cheerio instance
   * @param {string} url - Original URL for context
   * @returns {ContactData} - Extracted contact data with confidence scores
   */
  extractContactData($, url) {
    const contactData = {
      name: '',
      company: '',
      phone: '',
      email: '',
      description: '',
      profilePicture: '',
      profileLink: url,
      socialLinks: {},
      title: '',
      location: '',
      specialties: [],
      confidence: {
        name: 0,
        company: 0,
        phone: 0,
        email: 0,
        overall: 0
      }
    };

    // Extract each field using strategies
    for (const [field, strategies] of this.strategies) {
      const extraction = this.extractField($, field, strategies);
      contactData[field] = extraction.value;
      
      if (contactData.confidence.hasOwnProperty(field)) {
        contactData.confidence[field] = extraction.confidence;
      }
    }

    // Extract additional fields that don't have confidence scoring
    contactData.socialLinks = this.extractSocialLinks($);
    contactData.title = this.extractTitle($);
    contactData.location = this.extractLocation($);
    contactData.specialties = this.extractSpecialties($);

    // Calculate overall confidence
    contactData.confidence.overall = this.calculateOverallConfidence(contactData);

    // Clean and normalize the data
    return this.normalizeContactData(contactData);
  }

  /**
   * Extract a specific field using strategies
   * @param {Object} $ - Cheerio instance
   * @param {string} field - Field to extract
   * @param {Array} strategies - Extraction strategies
   * @returns {Object} - Extracted value and confidence
   * @private
   */
  extractField($, field, strategies) {
    const sortedStrategies = strategies.sort((a, b) => b.priority - a.priority);
    
    for (const strategy of sortedStrategies) {
      for (const selector of strategy.selectors) {
        const element = $(selector).first();
        if (element.length === 0) continue;

        let value = strategy.attribute ? 
          element.attr(strategy.attribute) : 
          element.text().trim();

        if (!value) continue;

        // Apply transform if provided
        if (strategy.transform) {
          value = strategy.transform(value);
        }

        // Apply validation if provided
        if (strategy.validator && !strategy.validator(value)) {
          continue;
        }

        // Clean the value
        value = this.cleanValue(value);

        if (value) {
          return {
            value,
            confidence: strategy.confidence || CONFIDENCE_LEVELS.MEDIUM,
            strategy: strategy.name
          };
        }
      }
    }

    return {
      value: '',
      confidence: 0,
      strategy: 'none'
    };
  }

  /**
   * Extract social media links
   * @param {Object} $ - Cheerio instance
   * @returns {Object} - Social media links
   * @private
   */
  extractSocialLinks($) {
    const socialLinks = {};
    
    const socialPatterns = {
      linkedin: /linkedin\.com\/in\/([^\/\s]+)/i,
      twitter: /twitter\.com\/([^\/\s]+)/i,
      facebook: /facebook\.com\/([^\/\s]+)/i,
      instagram: /instagram\.com\/([^\/\s]+)/i
    };

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      for (const [platform, pattern] of Object.entries(socialPatterns)) {
        if (pattern.test(href)) {
          socialLinks[platform] = href;
          break;
        }
      }
    });

    return socialLinks;
  }

  /**
   * Extract professional title
   * @param {Object} $ - Cheerio instance
   * @returns {string} - Professional title
   * @private
   */
  extractTitle($) {
    const titleSelectors = [
      '[itemProp="jobTitle"]',
      '.title',
      '.job-title',
      '.position',
      'h3:contains("Agent")',
      'h3:contains("Realtor")',
      'h3:contains("Broker")'
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && this.isValidTitle(title)) {
        return title;
      }
    }

    return '';
  }

  /**
   * Extract location information
   * @param {Object} $ - Cheerio instance
   * @returns {string} - Location
   * @private
   */
  extractLocation($) {
    const locationSelectors = [
      '[itemProp="address"]',
      '.address',
      '.location',
      '.city',
      '[data-testid*="location"]'
    ];

    for (const selector of locationSelectors) {
      const location = $(selector).first().text().trim();
      if (location && this.isValidLocation(location)) {
        return location;
      }
    }

    return '';
  }

  /**
   * Extract specialties or areas of expertise
   * @param {Object} $ - Cheerio instance
   * @returns {Array<string>} - Specialties
   * @private
   */
  extractSpecialties($) {
    const specialties = [];
    
    const specialtySelectors = [
      '.specialties',
      '.expertise',
      '.areas-of-focus',
      '.services'
    ];

    for (const selector of specialtySelectors) {
      $(selector).find('li, span, div').each((_, element) => {
        const specialty = $(element).text().trim();
        if (specialty && specialty.length > 2 && specialty.length < 50) {
          specialties.push(specialty);
        }
      });
    }

    return [...new Set(specialties)]; // Remove duplicates
  }

  /**
   * Calculate overall confidence score
   * @param {ContactData} data - Contact data
   * @returns {number} - Overall confidence score
   * @private
   */
  calculateOverallConfidence(data) {
    const weights = {
      name: 0.3,
      phone: 0.25,
      email: 0.2,
      company: 0.15,
      description: 0.1
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [field, weight] of Object.entries(weights)) {
      if (data.confidence[field] > 0) {
        weightedSum += data.confidence[field] * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) return 0;

    let confidence = weightedSum / totalWeight;

    // Apply bonuses for additional data
    if (data.profilePicture) confidence += 5;
    if (data.title) confidence += 3;
    if (data.location) confidence += 3;
    if (data.specialties.length > 0) confidence += 2;
    if (Object.keys(data.socialLinks).length > 0) confidence += 5;

    return Math.min(Math.round(confidence), 100);
  }

  /**
   * Normalize and clean contact data
   * @param {ContactData} data - Raw contact data
   * @returns {ContactData} - Normalized contact data
   * @private
   */
  normalizeContactData(data) {
    const normalized = { ...data };

    // Clean string fields
    const stringFields = ['name', 'company', 'phone', 'email', 'description', 'title', 'location'];
    stringFields.forEach(field => {
      if (normalized[field]) {
        normalized[field] = this.cleanValue(normalized[field]);
      }
    });

    // Normalize phone number
    if (normalized.phone) {
      normalized.phone = this.normalizePhoneNumber(normalized.phone);
    }

    // Normalize email
    if (normalized.email) {
      normalized.email = normalized.email.toLowerCase();
    }

    // Validate and clean URLs
    if (normalized.profilePicture && !this.isValidUrl(normalized.profilePicture)) {
      normalized.profilePicture = '';
    }

    return normalized;
  }

  /**
   * Clean a text value
   * @param {string} value - Value to clean
   * @returns {string} - Cleaned value
   * @private
   */
  cleanValue(value) {
    if (!value || typeof value !== 'string') return '';

    return value
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[\r\n\t]/g, ' ')      // Remove line breaks and tabs
      .replace(/[^\w\s@.-]/g, '')     // Remove special characters (keep email/phone chars)
      .trim();
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

    // Handle US phone numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    return phone; // Return original if not standard format
  }

  // Validation methods
  isValidName(text) {
    if (!text || text.length < 2) return false;
    return /^[a-zA-Z\s.-]+$/.test(text) && text.split(' ').length >= 2;
  }

  isValidCompany(text) {
    if (!text || text.length < 2) return false;
    return text.length < 100 && !/^\d+$/.test(text);
  }

  isValidTitle(text) {
    if (!text || text.length < 2) return false;
    const titleKeywords = ['agent', 'realtor', 'broker', 'associate', 'specialist', 'consultant'];
    return titleKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  isValidLocation(text) {
    if (!text || text.length < 2) return false;
    return text.length < 100 && /[a-zA-Z]/.test(text);
  }

  isValidDescription(text) {
    if (!text || text.length < 10) return false;
    return text.length < 2000 && /[a-zA-Z]/.test(text);
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  containsCompanyKeywords(text) {
    const keywords = ['realty', 'real estate', 'properties', 'homes', 'group', 'team', 'associates'];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  containsPhonePattern(text) {
    const phonePattern = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/;
    return phonePattern.test(text);
  }

  containsEmailPattern(text) {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    return emailPattern.test(text);
  }

  extractPhoneFromText(text) {
    const phonePattern = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/;
    const match = text.match(phonePattern);
    return match ? match[1] : '';
  }

  extractEmailFromText(text) {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailPattern);
    return match ? match[0] : '';
  }

  /**
   * Get extraction statistics
   * @returns {Object} - Extraction statistics
   */
  getStats() {
    return {
      strategiesCount: this.strategies.size,
      totalStrategies: Array.from(this.strategies.values()).reduce((sum, strategies) => sum + strategies.length, 0),
      config: this.config
    };
  }
}

export default ContactExtractor;