/**
 * Specialized Realtor.com Extractor
 * Advanced extraction logic specifically designed for Realtor.com agent profiles
 * with multiple fallback strategies and confidence scoring
 */

import { CONFIDENCE_LEVELS } from '../types.js';

/**
 * Specialized extractor for Realtor.com pages
 */
export class RealtorExtractor {
  constructor(config = {}) {
    this.config = {
      strictMode: config.strictMode || false,
      confidenceThreshold: config.confidenceThreshold || 60,
      enableFallbacks: config.enableFallbacks !== false,
      ...config
    };

    // Initialize extraction strategies specific to Realtor.com
    this.initializeRealtorStrategies();
  }

  /**
   * Initialize Realtor.com-specific extraction strategies
   * @private
   */
  initializeRealtorStrategies() {
    this.strategies = {
      name: [
        {
          name: 'realtor_primary_heading',
          selectors: [
            'h1[data-testid*="agent-name"]',
            'h1[data-testid*="realtor-name"]',
            '.agent-profile h1',
            '.profile-header h1'
          ],
          priority: 95,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH
        },
        {
          name: 'realtor_secondary_heading',
          selectors: [
            'h2[data-testid*="agent-name"]',
            'h2[data-testid*="realtor-name"]',
            '.agent-profile h2',
            '.profile-header h2'
          ],
          priority: 90,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH
        },
        {
          name: 'realtor_profile_sections',
          selectors: [
            '.agent-name',
            '.realtor-name',
            '.profile-name',
            '.agent-title',
            '[data-testid="agent-name"]'
          ],
          priority: 85,
          confidence: CONFIDENCE_LEVELS.HIGH
        },
        {
          name: 'realtor_semantic_fallback',
          selectors: [
            'h1:not(:has(a)):not(:has(img))',
            'h2:not(:has(a)):not(:has(img))',
            'h3:not(:has(a)):not(:has(img))'
          ],
          priority: 70,
          confidence: CONFIDENCE_LEVELS.MEDIUM,
          validator: this.isValidRealtorName.bind(this)
        }
      ],
      company: [
        {
          name: 'realtor_brokerage_structured',
          selectors: [
            '[data-testid*="brokerage"]',
            '[data-testid*="company"]',
            '[data-testid*="office"]',
            '[itemProp="organization"]'
          ],
          priority: 95,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH
        },
        {
          name: 'realtor_brokerage_semantic',
          selectors: [
            '.brokerage-name',
            '.company-name',
            '.office-name',
            '.firm-name'
          ],
          priority: 90,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH
        },
        {
          name: 'realtor_brokerage_patterns',
          selectors: [
            'p:contains("Realty")',
            'p:contains("Real Estate")',
            'p:contains("Properties")',
            'p:contains("Group")',
            'p:contains("Team")',
            'p:contains("Associates")',
            'p:contains("Brokers")',
            'p:contains("Brokerage")'
          ],
          priority: 80,
          confidence: CONFIDENCE_LEVELS.HIGH,
          validator: this.isValidRealtorCompany.bind(this)
        }
      ],
      phone: [
        {
          name: 'realtor_phone_links',
          selectors: [
            'a[data-linkname*="phone"]',
            'a[href^="tel:"]',
            'a[data-testid*="phone"]',
            'a[data-phone]'
          ],
          priority: 95,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH,
          attribute: 'href',
          transform: (value) => value ? value.replace('tel:', '') : ''
        },
        {
          name: 'realtor_phone_structured',
          selectors: [
            '[itemProp="telephone"]',
            '[data-testid*="phone"]',
            '.phone-number',
            '.contact-phone'
          ],
          priority: 90,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH
        },
        {
          name: 'realtor_phone_patterns',
          selectors: [
            '.contact-info',
            '.agent-contact',
            '.profile-contact',
            '.contact-details'
          ],
          priority: 70,
          confidence: CONFIDENCE_LEVELS.MEDIUM,
          extractor: this.extractPhoneFromContainer.bind(this)
        }
      ],
      email: [
        {
          name: 'realtor_email_links',
          selectors: [
            'a[href^="mailto:"]',
            'a[data-testid*="email"]',
            'a[data-email]'
          ],
          priority: 95,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH,
          attribute: 'href',
          transform: (value) => value ? value.replace('mailto:', '') : ''
        },
        {
          name: 'realtor_email_structured',
          selectors: [
            '[itemProp="email"]',
            '[data-testid*="email"]',
            '.email-address',
            '.contact-email'
          ],
          priority: 90,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH
        },
        {
          name: 'realtor_email_patterns',
          selectors: [
            '.contact-info',
            '.agent-contact',
            '.profile-contact',
            '.contact-details'
          ],
          priority: 70,
          confidence: CONFIDENCE_LEVELS.MEDIUM,
          extractor: this.extractEmailFromContainer.bind(this)
        }
      ],
      description: [
        {
          name: 'realtor_bio_structured',
          selectors: [
            '[data-testid*="bio"]',
            '[data-testid*="description"]',
            '[data-testid*="about"]',
            '[itemProp="description"]'
          ],
          priority: 95,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH
        },
        {
          name: 'realtor_bio_semantic',
          selectors: [
            '#agent-bio',
            '#agent-description',
            '#about-agent',
            '.agent-bio',
            '.agent-description',
            '.profile-bio',
            '.about-section'
          ],
          priority: 90,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH
        },
        {
          name: 'realtor_bio_content',
          selectors: [
            '.bio-content',
            '.description-content',
            '.about-content',
            '.profile-text'
          ],
          priority: 85,
          confidence: CONFIDENCE_LEVELS.HIGH
        }
      ],
      profilePicture: [
        {
          name: 'realtor_photo_structured',
          selectors: [
            '[itemProp="image"]',
            '[data-testid*="photo"]',
            '[data-testid*="image"]',
            '[data-testid*="headshot"]'
          ],
          priority: 95,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH,
          attribute: 'src'
        },
        {
          name: 'realtor_photo_semantic',
          selectors: [
            '.agent-photo img',
            '.profile-photo img',
            '.headshot img',
            '.avatar img',
            '.agent-image img'
          ],
          priority: 90,
          confidence: CONFIDENCE_LEVELS.VERY_HIGH,
          attribute: 'src'
        },
        {
          name: 'realtor_photo_alt',
          selectors: [
            'img[alt*="agent"]',
            'img[alt*="realtor"]',
            'img[alt*="photo"]',
            'img[alt*="headshot"]'
          ],
          priority: 80,
          confidence: CONFIDENCE_LEVELS.HIGH,
          attribute: 'src'
        }
      ]
    };
  }

  /**
   * Extract contact data from Realtor.com page
   * @param {Object} $ - Cheerio instance
   * @param {string} url - Original URL
   * @returns {Object} - Extracted contact data
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

    // Extract each field using Realtor.com-specific strategies
    for (const [field, strategies] of Object.entries(this.strategies)) {
      const result = this.extractField($, field, strategies);
      contactData[field] = result.value;
      
      if (contactData.confidence.hasOwnProperty(field)) {
        contactData.confidence[field] = result.confidence;
      }
    }

    // Extract additional Realtor.com-specific data
    contactData.title = this.extractRealtorTitle($);
    contactData.location = this.extractRealtorLocation($);
    contactData.specialties = this.extractRealtorSpecialties($);
    contactData.socialLinks = this.extractSocialLinks($);

    // Calculate overall confidence
    contactData.confidence.overall = this.calculateOverallConfidence(contactData);

    // Apply Realtor.com-specific enhancements
    this.enhanceRealtorData(contactData, $);

    return this.normalizeContactData(contactData);
  }

  /**
   * Extract a field using prioritized strategies
   * @param {Object} $ - Cheerio instance
   * @param {string} field - Field name
   * @param {Array} strategies - Extraction strategies
   * @returns {Object} - Extraction result
   * @private
   */
  extractField($, field, strategies) {
    const sortedStrategies = strategies.sort((a, b) => b.priority - a.priority);
    
    for (const strategy of sortedStrategies) {
      if (strategy.extractor) {
        // Use custom extractor function
        const result = strategy.extractor($);
        if (result.value) {
          return {
            value: result.value,
            confidence: result.confidence || strategy.confidence,
            strategy: strategy.name
          };
        }
      } else {
        // Use selector-based extraction
        for (const selector of strategy.selectors) {
          const $element = $(selector).first();
          if ($element.length === 0) continue;

          let value = strategy.attribute ? 
            $element.attr(strategy.attribute) : 
            $element.text().trim();

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
              confidence: strategy.confidence,
              strategy: strategy.name
            };
          }
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
   * Extract phone number from container
   * @param {Object} $ - Cheerio instance
   * @returns {Object} - Extraction result
   * @private
   */
  extractPhoneFromContainer($) {
    const phonePattern = /\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/;
    
    // Look in contact containers
    const containers = ['.contact-info', '.agent-contact', '.profile-contact', '.contact-details'];
    
    for (const container of containers) {
      const $container = $(container);
      if ($container.length > 0) {
        const text = $container.text();
        const match = text.match(phonePattern);
        if (match) {
          return {
            value: this.normalizePhoneNumber(match[0]),
            confidence: 75
          };
        }
      }
    }

    return { value: '', confidence: 0 };
  }

  /**
   * Extract email from container
   * @param {Object} $ - Cheerio instance
   * @returns {Object} - Extraction result
   * @private
   */
  extractEmailFromContainer($) {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    
    // Look in contact containers
    const containers = ['.contact-info', '.agent-contact', '.profile-contact', '.contact-details'];
    
    for (const container of containers) {
      const $container = $(container);
      if ($container.length > 0) {
        const text = $container.text();
        const match = text.match(emailPattern);
        if (match) {
          return {
            value: match[0].toLowerCase(),
            confidence: 75
          };
        }
      }
    }

    return { value: '', confidence: 0 };
  }

  /**
   * Extract realtor title/position
   * @param {Object} $ - Cheerio instance
   * @returns {string} - Title
   * @private
   */
  extractRealtorTitle($) {
    const titleSelectors = [
      '[data-testid*="title"]',
      '[data-testid*="position"]',
      '[itemProp="jobTitle"]',
      '.agent-title',
      '.realtor-title',
      '.position-title',
      '.job-title'
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && this.isValidRealtorTitle(title)) {
        return title;
      }
    }

    // Look for title patterns in text
    const titlePatterns = [
      /\b(Real Estate Agent|Realtor|Broker|Associate Broker|Sales Associate|Listing Agent|Buyer Agent)\b/i
    ];

    const bodyText = $.text();
    for (const pattern of titlePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Extract realtor location/area served
   * @param {Object} $ - Cheerio instance
   * @returns {string} - Location
   * @private
   */
  extractRealtorLocation($) {
    const locationSelectors = [
      '[data-testid*="location"]',
      '[data-testid*="area"]',
      '[itemProp="address"]',
      '.agent-location',
      '.service-area',
      '.location-served',
      '.coverage-area'
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
   * Extract realtor specialties
   * @param {Object} $ - Cheerio instance
   * @returns {Array} - Specialties
   * @private
   */
  extractRealtorSpecialties($) {
    const specialties = [];
    
    const specialtySelectors = [
      '[data-testid*="specialty"]',
      '[data-testid*="specialization"]',
      '.specialties',
      '.expertise',
      '.areas-of-focus',
      '.property-types'
    ];

    for (const selector of specialtySelectors) {
      $(selector).find('li, span, div').each((_, element) => {
        const specialty = $(element).text().trim();
        if (specialty && this.isValidSpecialty(specialty)) {
          specialties.push(specialty);
        }
      });
    }

    // Look for common real estate specialties in text
    const specialtyPatterns = [
      /\b(First Time Buyers|Luxury Homes|Investment Properties|Commercial|Residential|New Construction|Condos|Townhomes|Single Family|Waterfront|Golf Course|Retirement Communities)\b/gi
    ];

    const bodyText = $.text();
    for (const pattern of specialtyPatterns) {
      const matches = bodyText.match(pattern) || [];
      matches.forEach(match => {
        if (!specialties.includes(match)) {
          specialties.push(match);
        }
      });
    }

    return [...new Set(specialties)].slice(0, 10); // Limit to 10 specialties
  }

  /**
   * Extract social media links
   * @param {Object} $ - Cheerio instance
   * @returns {Object} - Social links
   * @private
   */
  extractSocialLinks($) {
    const socialLinks = {};
    
    const socialPatterns = {
      linkedin: /linkedin\.com\/in\/([^\/\s]+)/i,
      twitter: /twitter\.com\/([^\/\s]+)/i,
      facebook: /facebook\.com\/([^\/\s]+)/i,
      instagram: /instagram\.com\/([^\/\s]+)/i,
      youtube: /youtube\.com\/([^\/\s]+)/i
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
   * Enhance realtor data with additional processing
   * @param {Object} contactData - Contact data to enhance
   * @param {Object} $ - Cheerio instance
   * @private
   */
  enhanceRealtorData(contactData, $) {
    // Enhance name with title removal
    if (contactData.name) {
      contactData.name = this.cleanRealtorName(contactData.name);
    }

    // Enhance company with common suffixes
    if (contactData.company) {
      contactData.company = this.cleanRealtorCompany(contactData.company);
    }

    // Extract license information if available
    const licenseInfo = this.extractLicenseInfo($);
    if (licenseInfo) {
      contactData.licenseInfo = licenseInfo;
    }

    // Extract years of experience if available
    const experience = this.extractExperience($);
    if (experience) {
      contactData.experience = experience;
    }
  }

  /**
   * Clean realtor name by removing titles and suffixes
   * @param {string} name - Raw name
   * @returns {string} - Cleaned name
   * @private
   */
  cleanRealtorName(name) {
    if (!name) return '';

    // Remove common titles and suffixes
    const titlesToRemove = [
      'Real Estate Agent', 'Realtor', 'Broker', 'Associate Broker',
      'Sales Associate', 'Listing Agent', 'Buyer Agent', 'Agent',
      'REALTOR®', 'GRI', 'CRS', 'ABR', 'SRS', 'SRES'
    ];

    let cleanName = name;
    for (const title of titlesToRemove) {
      const regex = new RegExp(`\\b${title}\\b`, 'gi');
      cleanName = cleanName.replace(regex, '').trim();
    }

    // Remove extra commas and whitespace
    cleanName = cleanName.replace(/,+/g, ',').replace(/\s+/g, ' ').trim();
    cleanName = cleanName.replace(/^,|,$/, '').trim();

    return cleanName;
  }

  /**
   * Clean realtor company name
   * @param {string} company - Raw company name
   * @returns {string} - Cleaned company name
   * @private
   */
  cleanRealtorCompany(company) {
    if (!company) return '';

    // Remove common prefixes that might be extracted
    const prefixesToRemove = ['Agent at', 'Realtor at', 'Broker at', 'Associate at'];
    
    let cleanCompany = company;
    for (const prefix of prefixesToRemove) {
      const regex = new RegExp(`^${prefix}\\s+`, 'i');
      cleanCompany = cleanCompany.replace(regex, '').trim();
    }

    return cleanCompany;
  }

  /**
   * Extract license information
   * @param {Object} $ - Cheerio instance
   * @returns {string} - License info
   * @private
   */
  extractLicenseInfo($) {
    const licensePattern = /License[d]?\s*[#:]?\s*([A-Z0-9]+)/i;
    const text = $.text();
    const match = text.match(licensePattern);
    return match ? match[1] : '';
  }

  /**
   * Extract years of experience
   * @param {Object} $ - Cheerio instance
   * @returns {number} - Years of experience
   * @private
   */
  extractExperience($) {
    const experiencePattern = /(\d+)\s*years?\s*of\s*experience/i;
    const text = $.text();
    const match = text.match(experiencePattern);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Calculate overall confidence score
   * @param {Object} contactData - Contact data
   * @returns {number} - Overall confidence
   * @private
   */
  calculateOverallConfidence(contactData) {
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
      if (contactData.confidence[field] > 0) {
        weightedSum += contactData.confidence[field] * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) return 0;

    let confidence = weightedSum / totalWeight;

    // Apply bonuses for Realtor.com-specific data
    if (contactData.profilePicture) confidence += 5;
    if (contactData.title) confidence += 5;
    if (contactData.location) confidence += 5;
    if (contactData.specialties.length > 0) confidence += 3;
    if (Object.keys(contactData.socialLinks).length > 0) confidence += 5;
    if (contactData.licenseInfo) confidence += 5;
    if (contactData.experience > 0) confidence += 3;

    return Math.min(Math.round(confidence), 100);
  }

  /**
   * Normalize contact data
   * @param {Object} contactData - Raw contact data
   * @returns {Object} - Normalized contact data
   * @private
   */
  normalizeContactData(contactData) {
    const normalized = { ...contactData };

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

    // Validate URLs
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
   * Normalize phone number
   * @param {string} phone - Phone number
   * @returns {string} - Normalized phone number
   * @private
   */
  normalizePhoneNumber(phone) {
    if (!phone) return '';

    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    return phone;
  }

  // Validation methods
  isValidRealtorName(text) {
    if (!text || text.length < 2) return false;
    return /^[a-zA-Z\s.-]+$/.test(text) && text.split(' ').length >= 2;
  }

  isValidRealtorCompany(text) {
    if (!text || text.length < 2) return false;
    const realtorKeywords = ['realty', 'real estate', 'properties', 'homes', 'group', 'team', 'associates', 'brokers', 'brokerage'];
    return realtorKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  isValidRealtorTitle(text) {
    if (!text || text.length < 2) return false;
    const titleKeywords = ['agent', 'realtor', 'broker', 'associate', 'specialist', 'consultant', 'representative'];
    return titleKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  isValidLocation(text) {
    if (!text || text.length < 2) return false;
    return text.length < 100 && /[a-zA-Z]/.test(text);
  }

  isValidSpecialty(text) {
    if (!text || text.length < 2 || text.length > 50) return false;
    return /[a-zA-Z]/.test(text) && !/^\d+$/.test(text);
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export default RealtorExtractor;