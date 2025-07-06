/**
 * Modern Selector Strategies for Realtor.com
 * 
 * This module provides intelligent, adaptive selector strategies that avoid
 * brittle hash-based CSS classes and focus on semantic HTML, data attributes,
 * and content patterns that are more resilient to page changes.
 */

import { CONFIDENCE_LEVELS } from '../types.js';

/**
 * Modern selector strategies for Realtor.com
 */
export class RealtorSelectors {
  constructor() {
    this.initializeSelectors();
  }

  /**
   * Initialize all selector strategies
   * @private
   */
  initializeSelectors() {
    this.selectors = {
      name: this.getNameSelectors(),
      company: this.getCompanySelectors(),
      phone: this.getPhoneSelectors(),
      email: this.getEmailSelectors(),
      description: this.getDescriptionSelectors(),
      profilePicture: this.getProfilePictureSelectors(),
      title: this.getTitleSelectors(),
      location: this.getLocationSelectors(),
      specialties: this.getSpecialtySelectors(),
      socialLinks: this.getSocialLinkSelectors(),
      contactInfo: this.getContactInfoSelectors()
    };
  }

  /**
   * Get name extraction selectors with fallback strategies
   * @returns {Array} - Name selectors
   */
  getNameSelectors() {
    return [
      {
        strategy: 'structured_data',
        selectors: [
          '[itemProp="name"]',
          '[data-testid*="agent-name"]',
          '[data-testid*="realtor-name"]',
          '[data-testid*="person-name"]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100
      },
      {
        strategy: 'semantic_headings',
        selectors: [
          'h1:not(:has(a)):not(:has(img)):not(:has(button))',
          'h2:not(:has(a)):not(:has(img)):not(:has(button))',
          'h3:not(:has(a)):not(:has(img)):not(:has(button))'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 90,
        validator: this.isValidPersonName
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.agent-name',
          '.realtor-name',
          '.profile-name',
          '.person-name',
          '.contact-name'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 85
      },
      {
        strategy: 'aria_labeled',
        selectors: [
          '[aria-label*="agent name"]',
          '[aria-label*="realtor name"]',
          '[aria-label*="person name"]',
          '[role="heading"][aria-level="1"]',
          '[role="heading"][aria-level="2"]'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 80
      },
      {
        strategy: 'contextual_headings',
        selectors: [
          '.profile-header h1',
          '.agent-profile h1',
          '.contact-header h1',
          '.bio-section h1',
          '.profile-info h1'
        ],
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        priority: 70
      }
    ];
  }

  /**
   * Get company/brokerage extraction selectors
   * @returns {Array} - Company selectors
   */
  getCompanySelectors() {
    return [
      {
        strategy: 'structured_data',
        selectors: [
          '[itemProp="organization"]',
          '[itemProp="worksFor"]',
          '[data-testid*="brokerage"]',
          '[data-testid*="company"]',
          '[data-testid*="office"]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.brokerage-name',
          '.company-name',
          '.office-name',
          '.firm-name',
          '.organization-name'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 95
      },
      {
        strategy: 'content_patterns',
        selectors: [
          'p:contains("Realty")',
          'p:contains("Real Estate")',
          'p:contains("Properties")',
          'p:contains("Group")',
          'p:contains("Team")',
          'p:contains("Associates")',
          'p:contains("Brokers")',
          'p:contains("Brokerage")',
          'span:contains("Realty")',
          'span:contains("Real Estate")',
          'div:contains("Realty")',
          'div:contains("Real Estate")'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 80,
        validator: this.isValidCompanyName
      },
      {
        strategy: 'contextual_location',
        selectors: [
          '.profile-header .company',
          '.agent-info .company',
          '.contact-info .company',
          '.bio-section .company'
        ],
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        priority: 70
      }
    ];
  }

  /**
   * Get phone number extraction selectors
   * @returns {Array} - Phone selectors
   */
  getPhoneSelectors() {
    return [
      {
        strategy: 'tel_links',
        selectors: [
          'a[href^="tel:"]',
          'a[data-linkname*="phone"]',
          'a[data-testid*="phone"]',
          'a[data-phone]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100,
        attribute: 'href',
        transform: (value) => value.replace('tel:', '')
      },
      {
        strategy: 'structured_data',
        selectors: [
          '[itemProp="telephone"]',
          '[data-testid*="phone"]',
          '[data-phone]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 95
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.phone-number',
          '.contact-phone',
          '.agent-phone',
          '.telephone'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 85
      },
      {
        strategy: 'pattern_matching',
        selectors: [
          '.contact-info',
          '.agent-contact',
          '.profile-contact',
          '.contact-details',
          '.contact-section'
        ],
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        priority: 70,
        extractor: 'phone_pattern'
      }
    ];
  }

  /**
   * Get email extraction selectors
   * @returns {Array} - Email selectors
   */
  getEmailSelectors() {
    return [
      {
        strategy: 'mailto_links',
        selectors: [
          'a[href^="mailto:"]',
          'a[data-testid*="email"]',
          'a[data-email]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100,
        attribute: 'href',
        transform: (value) => value.replace('mailto:', '')
      },
      {
        strategy: 'structured_data',
        selectors: [
          '[itemProp="email"]',
          '[data-testid*="email"]',
          '[data-email]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 95
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.email-address',
          '.contact-email',
          '.agent-email',
          '.email'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 85
      },
      {
        strategy: 'pattern_matching',
        selectors: [
          '.contact-info',
          '.agent-contact',
          '.profile-contact',
          '.contact-details',
          '.contact-section'
        ],
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        priority: 70,
        extractor: 'email_pattern'
      }
    ];
  }

  /**
   * Get description/bio extraction selectors
   * @returns {Array} - Description selectors
   */
  getDescriptionSelectors() {
    return [
      {
        strategy: 'structured_data',
        selectors: [
          '[itemProp="description"]',
          '[data-testid*="bio"]',
          '[data-testid*="description"]',
          '[data-testid*="about"]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100
      },
      {
        strategy: 'semantic_sections',
        selectors: [
          '#agent-bio',
          '#agent-description',
          '#about-agent',
          '#bio-section',
          '#description-section'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 95
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.agent-bio',
          '.agent-description',
          '.profile-bio',
          '.about-section',
          '.bio-content',
          '.description-content'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 85
      },
      {
        strategy: 'contextual_paragraphs',
        selectors: [
          '.bio-section p',
          '.about-section p',
          '.profile-section p',
          '.agent-info p'
        ],
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        priority: 70,
        validator: this.isValidDescription
      }
    ];
  }

  /**
   * Get profile picture extraction selectors
   * @returns {Array} - Profile picture selectors
   */
  getProfilePictureSelectors() {
    return [
      {
        strategy: 'structured_data',
        selectors: [
          '[itemProp="image"]',
          '[data-testid*="photo"]',
          '[data-testid*="image"]',
          '[data-testid*="avatar"]',
          '[data-testid*="headshot"]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100,
        attribute: 'src'
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.agent-photo img',
          '.profile-photo img',
          '.headshot img',
          '.avatar img',
          '.agent-image img',
          '.profile-image img'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 90,
        attribute: 'src'
      },
      {
        strategy: 'alt_text_matching',
        selectors: [
          'img[alt*="agent"]',
          'img[alt*="realtor"]',
          'img[alt*="photo"]',
          'img[alt*="headshot"]',
          'img[alt*="profile"]'
        ],
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        priority: 80,
        attribute: 'src'
      },
      {
        strategy: 'contextual_images',
        selectors: [
          '.profile-header img',
          '.agent-info img',
          '.contact-header img',
          '.bio-section img'
        ],
        confidence: CONFIDENCE_LEVELS.LOW,
        priority: 60,
        attribute: 'src',
        validator: this.isValidProfileImage
      }
    ];
  }

  /**
   * Get title/position extraction selectors
   * @returns {Array} - Title selectors
   */
  getTitleSelectors() {
    return [
      {
        strategy: 'structured_data',
        selectors: [
          '[itemProp="jobTitle"]',
          '[data-testid*="title"]',
          '[data-testid*="position"]',
          '[data-testid*="role"]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.agent-title',
          '.job-title',
          '.position-title',
          '.role-title',
          '.professional-title'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 90
      },
      {
        strategy: 'content_patterns',
        selectors: [
          'p:contains("Agent")',
          'p:contains("Realtor")',
          'p:contains("Broker")',
          'span:contains("Agent")',
          'span:contains("Realtor")',
          'div:contains("Agent")'
        ],
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        priority: 70,
        validator: this.isValidTitle
      }
    ];
  }

  /**
   * Get location extraction selectors
   * @returns {Array} - Location selectors
   */
  getLocationSelectors() {
    return [
      {
        strategy: 'structured_data',
        selectors: [
          '[itemProp="address"]',
          '[itemProp="addressLocality"]',
          '[data-testid*="location"]',
          '[data-testid*="address"]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.agent-location',
          '.service-area',
          '.location-served',
          '.coverage-area',
          '.address'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 90
      },
      {
        strategy: 'contextual_location',
        selectors: [
          '.contact-info .location',
          '.agent-info .location',
          '.profile-info .location'
        ],
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        priority: 70
      }
    ];
  }

  /**
   * Get specialty extraction selectors
   * @returns {Array} - Specialty selectors
   */
  getSpecialtySelectors() {
    return [
      {
        strategy: 'structured_data',
        selectors: [
          '[data-testid*="specialty"]',
          '[data-testid*="specialization"]',
          '[data-testid*="expertise"]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.specialties',
          '.expertise',
          '.areas-of-focus',
          '.property-types',
          '.services-offered'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 90
      },
      {
        strategy: 'list_items',
        selectors: [
          '.specialties li',
          '.expertise li',
          '.services li',
          '.areas-of-focus li'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 85
      }
    ];
  }

  /**
   * Get social media link selectors
   * @returns {Array} - Social link selectors
   */
  getSocialLinkSelectors() {
    return [
      {
        strategy: 'platform_specific',
        selectors: [
          'a[href*="linkedin.com"]',
          'a[href*="facebook.com"]',
          'a[href*="twitter.com"]',
          'a[href*="instagram.com"]',
          'a[href*="youtube.com"]'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100,
        attribute: 'href'
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.social-links a',
          '.social-media a',
          '.social-icons a',
          '.social-profiles a'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 90,
        attribute: 'href'
      },
      {
        strategy: 'data_attributes',
        selectors: [
          '[data-testid*="social"]',
          '[data-social]',
          '[data-platform]'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 85,
        attribute: 'href'
      }
    ];
  }

  /**
   * Get contact info container selectors
   * @returns {Array} - Contact info selectors
   */
  getContactInfoSelectors() {
    return [
      {
        strategy: 'semantic_sections',
        selectors: [
          '#contact-info',
          '#agent-contact',
          '#contact-details',
          '#contact-section'
        ],
        confidence: CONFIDENCE_LEVELS.VERY_HIGH,
        priority: 100
      },
      {
        strategy: 'semantic_classes',
        selectors: [
          '.contact-info',
          '.agent-contact',
          '.profile-contact',
          '.contact-details',
          '.contact-section'
        ],
        confidence: CONFIDENCE_LEVELS.HIGH,
        priority: 90
      },
      {
        strategy: 'contextual_containers',
        selectors: [
          '.profile-sidebar',
          '.agent-sidebar',
          '.contact-sidebar',
          '.info-panel'
        ],
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        priority: 70
      }
    ];
  }

  /**
   * Get selectors for a specific field
   * @param {string} field - Field name
   * @returns {Array} - Selectors for the field
   */
  getSelectorsForField(field) {
    return this.selectors[field] || [];
  }

  /**
   * Get all selectors
   * @returns {Object} - All selectors
   */
  getAllSelectors() {
    return this.selectors;
  }

  /**
   * Get selectors by strategy
   * @param {string} strategy - Strategy name
   * @returns {Array} - Selectors using the strategy
   */
  getSelectorsByStrategy(strategy) {
    const result = [];
    for (const [field, selectors] of Object.entries(this.selectors)) {
      for (const selector of selectors) {
        if (selector.strategy === strategy) {
          result.push({ field, ...selector });
        }
      }
    }
    return result;
  }

  /**
   * Get high-priority selectors
   * @param {number} minPriority - Minimum priority threshold
   * @returns {Object} - High-priority selectors by field
   */
  getHighPrioritySelectors(minPriority = 85) {
    const result = {};
    for (const [field, selectors] of Object.entries(this.selectors)) {
      result[field] = selectors.filter(s => s.priority >= minPriority);
    }
    return result;
  }

  // Validation methods
  isValidPersonName(text) {
    if (!text || text.length < 2 || text.length > 100) return false;
    const words = text.split(/\s+/);
    if (words.length < 2) return false;
    return /^[a-zA-Z\s.-]+$/.test(text);
  }

  isValidCompanyName(text) {
    if (!text || text.length < 2 || text.length > 150) return false;
    const realtorKeywords = [
      'realty', 'real estate', 'properties', 'homes', 'group', 'team',
      'associates', 'brokers', 'brokerage', 'realtor', 'agent', 'company',
      'inc', 'llc', 'corp', 'ltd', 'co'
    ];
    const lowerText = text.toLowerCase();
    return realtorKeywords.some(keyword => lowerText.includes(keyword));
  }

  isValidTitle(text) {
    if (!text || text.length < 2 || text.length > 100) return false;
    const titleKeywords = [
      'agent', 'realtor', 'broker', 'associate', 'specialist', 'consultant',
      'representative', 'advisor', 'professional'
    ];
    const lowerText = text.toLowerCase();
    return titleKeywords.some(keyword => lowerText.includes(keyword));
  }

  isValidDescription(text) {
    if (!text || text.length < 20 || text.length > 5000) return false;
    return /[a-zA-Z]/.test(text) && text.split(/\s+/).length >= 10;
  }

  isValidProfileImage(src) {
    if (!src) return false;
    try {
      const url = new URL(src);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return imageExtensions.some(ext => url.pathname.toLowerCase().includes(ext));
    } catch {
      return false;
    }
  }

  /**
   * Create a selector configuration for a specific extraction strategy
   * @param {string} strategy - Strategy name
   * @param {Object} options - Configuration options
   * @returns {Object} - Selector configuration
   */
  createSelectorConfig(strategy, options = {}) {
    const config = {
      strategy,
      confidence: options.confidence || CONFIDENCE_LEVELS.MEDIUM,
      priority: options.priority || 50,
      selectors: options.selectors || [],
      ...options
    };

    // Add validation if not provided
    if (!config.validator) {
      switch (strategy) {
        case 'name':
          config.validator = this.isValidPersonName;
          break;
        case 'company':
          config.validator = this.isValidCompanyName;
          break;
        case 'title':
          config.validator = this.isValidTitle;
          break;
        case 'description':
          config.validator = this.isValidDescription;
          break;
        case 'profilePicture':
          config.validator = this.isValidProfileImage;
          break;
      }
    }

    return config;
  }

  /**
   * Add custom selectors for a field
   * @param {string} field - Field name
   * @param {Object} selectorConfig - Selector configuration
   */
  addCustomSelector(field, selectorConfig) {
    if (!this.selectors[field]) {
      this.selectors[field] = [];
    }
    this.selectors[field].push(selectorConfig);
    
    // Sort by priority
    this.selectors[field].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove selectors by strategy
   * @param {string} field - Field name
   * @param {string} strategy - Strategy to remove
   */
  removeSelectorsBy(field, strategy) {
    if (this.selectors[field]) {
      this.selectors[field] = this.selectors[field].filter(s => s.strategy !== strategy);
    }
  }

  /**
   * Get selector statistics
   * @returns {Object} - Statistics about selectors
   */
  getStats() {
    const stats = {
      totalFields: Object.keys(this.selectors).length,
      totalSelectors: 0,
      strategyCounts: {},
      priorityDistribution: { high: 0, medium: 0, low: 0 }
    };

    for (const [field, selectors] of Object.entries(this.selectors)) {
      stats.totalSelectors += selectors.length;
      
      for (const selector of selectors) {
        // Count strategies
        stats.strategyCounts[selector.strategy] = (stats.strategyCounts[selector.strategy] || 0) + 1;
        
        // Count priority distribution
        if (selector.priority >= 90) {
          stats.priorityDistribution.high++;
        } else if (selector.priority >= 70) {
          stats.priorityDistribution.medium++;
        } else {
          stats.priorityDistribution.low++;
        }
      }
    }

    return stats;
  }
}

export default RealtorSelectors;