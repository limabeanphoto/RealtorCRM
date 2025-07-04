// pages/api/contacts/scrapeUtils.js - Updated with precise selector logic
import cheerio from 'cheerio';
import scraperConfig from './scrape.config';

/**
 * Builds a ScraperAPI URL with the provided options
 * @param {string} targetUrl - The URL to scrape
 * @param {Object} options - Additional options for ScraperAPI
 * @returns {string} - The complete ScraperAPI URL
 */
export function buildScraperUrl(targetUrl, options = {}) {
  const { apiKey, baseUrl, defaultOptions } = scraperConfig;
  
  // Combine default options with provided options
  const combinedOptions = { ...defaultOptions, ...options };
  
  // Start with the base URL and API key
  let scraperUrl = `${baseUrl}?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
  
  // Add all options to the URL
  Object.entries(combinedOptions).forEach(([key, value]) => {
    // Convert option key from camelCase to snake_case if needed
    const optionKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    // Add the option to the URL
    if (typeof value === 'boolean') {
      scraperUrl += `&${optionKey}=${value}`;
    } else if (value !== null && value !== undefined) {
      scraperUrl += `&${optionKey}=${encodeURIComponent(value)}`;
    }
  });
  
  return scraperUrl;
}

/**
 * Extract agent name using precise selectors
 * @param {Object} $ - Cheerio instance
 * @returns {string} - Extracted name
 */
export function extractName($) {
  // Try primary selector first
  const primarySelector = scraperConfig.selectors.primary.name;
  const nameFromPrimary = $(primarySelector).text().trim();
  
  if (nameFromPrimary) {
    return nameFromPrimary;
  }
  
  // Try fallback selectors if primary fails
  for (const selector of scraperConfig.selectors.fallback.name) {
    const name = $(selector).first().text().trim();
    if (name) {
      return name;
    }
  }
  
  return '';
}

/**
 * Extract company/brokerage name using precise selectors
 * @param {Object} $ - Cheerio instance
 * @returns {string} - Extracted company name
 */
export function extractCompany($) {
  // Try primary selector first
  const primarySelector = scraperConfig.selectors.primary.company;
  const companyFromPrimary = $(primarySelector).first().text().trim();
  
  if (companyFromPrimary) {
    return companyFromPrimary;
  }
  
  // Try fallback selectors if primary fails
  for (const selector of scraperConfig.selectors.fallback.company) {
    const company = $(selector).first().text().trim();
    if (company) {
      return company;
    }
  }
  
  return '';
}

/**
 * Extract phone number using precise selectors
 * @param {Object} $ - Cheerio instance
 * @returns {string} - Extracted phone number
 */
export function extractPhone($) {
  // Try primary selector first - check href attribute
  const primaryHrefSelector = scraperConfig.selectors.primary.phoneHref;
  const phoneElement = $(primaryHrefSelector).first();
  const hrefPhone = phoneElement.attr('href');
  
  if (hrefPhone && hrefPhone.startsWith('tel:')) {
    return hrefPhone.replace('tel:', '');
  }
  
  // Try the primary selector for direct text content
  const primarySelector = scraperConfig.selectors.primary.phone;
  const phoneFromPrimary = $(primarySelector).text().trim();
  
  if (phoneFromPrimary) {
    return phoneFromPrimary;
  }
  
  // Try fallback selectors if primary fails
  for (const selector of scraperConfig.selectors.fallback.phone) {
    const element = $(selector).first();
    
    // Check for href attribute first
    const hrefAttr = element.attr('href');
    if (hrefAttr && hrefAttr.startsWith('tel:')) {
      return hrefAttr.replace('tel:', '');
    }
    
    // Otherwise get text content
    const phone = element.text().trim();
    if (phone) {
      return phone;
    }
  }
  
  return '';
}

/**
 * Extract bio/description using precise selectors
 * @param {Object} $ - Cheerio instance
 * @returns {string} - Extracted description
 */
export function extractDescription($) {
  // Try primary selector first
  const primarySelector = scraperConfig.selectors.primary.description;
  const descFromPrimary = $(primarySelector).text().trim();
  
  if (descFromPrimary) {
    return descFromPrimary;
  }
  
  // Try fallback selectors if primary fails
  for (const selector of scraperConfig.selectors.fallback.description) {
    const desc = $(selector).text().trim();
    if (desc) {
      return desc;
    }
  }
  
  return '';
}

/**
 * Validates that a scraped contact has all required fields
 * @param {Object} contact - The contact information object
 * @returns {boolean} - Whether the contact has all required fields
 */
export function validateContact(contact) {
  const required = scraperConfig.required || [];
  
  return required.every(field => {
    return contact[field] && contact[field].trim().length > 0;
  });
}

/**
 * Extract a profile picture URL if available
 * @param {Object} $ - Cheerio instance
 * @returns {string} - URL to profile picture
 */
export function extractProfilePicture($) {
  const imgSelector = scraperConfig.selectors.primary.profileImg;
  const imgElement = $(imgSelector).first();
  const imgSrc = imgElement.attr('src');
  
  return imgSrc || '';
}

/**
 * Cleans and normalizes the contact data
 * @param {Object} contact - The raw contact information
 * @returns {Object} - Cleaned contact information
 */
export function cleanContactData(contact) {
  const cleaned = { ...contact };
  
  // Clean each string field
  Object.keys(cleaned).forEach(key => {
    if (typeof cleaned[key] === 'string') {
      // Remove extra whitespace
      cleaned[key] = cleaned[key].replace(/\s+/g, ' ').trim();
      
      // Field-specific cleaning
      if (key === 'phone') {
        // Standardize phone format
        cleaned[key] = standardizePhoneNumber(cleaned[key]);
      }
    }
  });
  
  return cleaned;
}

/**
 * Standardizes a phone number to a consistent format
 * @param {string} phone - The raw phone number
 * @returns {string} - Standardized phone number
 */
export function standardizePhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if we have a valid US number (10 digits)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Check if we have a valid US number with country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return the original number if it doesn't match expected patterns
  return phone;
}

/**
 * Logs detailed information about a scraping attempt for debugging
 * @param {string} url - The URL being scraped
 * @param {Object} extractedData - The data extracted from the page
 * @param {Error} error - Optional error object if an error occurred
 */
export function logScrapingAttempt(url, extractedData, error = null) {
  console.log(`----- Scraping Attempt: ${new Date().toISOString()} -----`);
  console.log(`URL: ${url}`);
  
  if (error) {
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
  } else {
    console.log('Extracted Data:');
    console.log(JSON.stringify(extractedData, null, 2));
    
    // Log validation results
    const isValid = validateContact(extractedData);
    console.log(`Validation Result: ${isValid ? 'Valid' : 'Invalid'}`);
    
    if (!isValid) {
      const required = scraperConfig.required || [];
      const missing = required.filter(field => !extractedData[field] || !extractedData[field].trim());
      console.log(`Missing required fields: ${missing.join(', ')}`);
    }
  }
  
  console.log('---------------------------------------------');
}

export default {
  buildScraperUrl,
  extractName,
  extractCompany,
  extractPhone,
  extractDescription,
  extractProfilePicture,
  validateContact,
  cleanContactData,
  standardizePhoneNumber,
  logScrapingAttempt
};