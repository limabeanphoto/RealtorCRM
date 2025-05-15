// pages/api/contacts/scrape.js - Final version with precise selectors
import axios from 'axios';
import cheerio from 'cheerio';
import withAuth from '../../../utils/withAuth';
import scraperConfig from './scrape.config';
import {
  buildScraperUrl,
  extractName,
  extractCompany,
  extractPhone,
  extractDescription,
  extractProfilePicture,
  validateContact,
  cleanContactData,
  logScrapingAttempt
} from './scrapeUtils';

/**
 * API endpoint to scrape realtor contact information from Realtor.com
 */
async function handler(req, res) {
  // Set a timeout for the entire request
  // This helps prevent function timeout issues with hosting providers
  const requestTimeout = setTimeout(() => {
    try {
      return res.status(408).json({
        success: false,
        message: 'Request timed out. The scraping operation took too long to complete.'
      });
    } catch (e) {
      // Response might have already been sent
      console.error('Error sending timeout response:', e);
    }
  }, scraperConfig.defaultOptions.timeout - 1000); // Set slightly below the ScraperAPI timeout

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      clearTimeout(requestTimeout);
      return res.status(405).json({ 
        success: false, 
        message: `Method ${req.method} not allowed` 
      });
    }

    const { url } = req.body;
    
    if (!url) {
      clearTimeout(requestTimeout);
      return res.status(400).json({ 
        success: false, 
        message: 'URL is required' 
      });
    }

    // Validate that the URL is from Realtor.com
    if (!isValidRealtorUrl(url)) {
      clearTimeout(requestTimeout);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid URL. Only Realtor.com profile URLs are supported at this time.' 
      });
    }

    // Log the start of scraping
    console.log(`Starting scrape of: ${url} at ${new Date().toISOString()}`);

    // Scrape the contact info using ScraperAPI with retry logic
    const contactInfo = await scrapeRealtorProfileWithRetry(url);
    
    if (!contactInfo) {
      clearTimeout(requestTimeout);
      return res.status(404).json({ 
        success: false, 
        message: 'Could not extract contact information from this profile' 
      });
    }

    // Check if the profile has the required fields
    if (!validateContact(contactInfo)) {
      clearTimeout(requestTimeout);
      return res.status(400).json({ 
        success: false, 
        message: 'Profile missing required information (name and phone)' 
      });
    }

    // Log successful scrape
    console.log(`Successfully scraped contact: ${contactInfo.name} at ${new Date().toISOString()}`);
    
    // Clear the timeout since we're responding successfully
    clearTimeout(requestTimeout);

    // Return the scraped contact info
    return res.status(200).json({ 
      success: true, 
      data: contactInfo
    });
  } catch (error) {
    // Clear the timeout since we're responding with an error
    clearTimeout(requestTimeout);
    
    console.error('Error scraping contact:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error scraping contact information: ' + error.message 
    });
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

/**
 * Scrapes a Realtor.com profile with retry logic
 * @param {string} url - URL of the profile to scrape
 * @returns {Object} - Extracted contact information
 */
async function scrapeRealtorProfileWithRetry(url) {
  const { maxAttempts, delay } = scraperConfig.retry;
  let lastError = null;
  
  // Try different rendering options for better success rate
  const options = [
    { render: true, fast: true },   // With JS rendering but fast
    { render: false, fast: true },  // Without JS rendering for speed
    { render: true, fast: false }   // Full rendering, slowest but most reliable
  ];
  
  // Try each set of options
  for (const opt of options) {
    // Try multiple attempts with each option
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Scraping attempt ${attempt} with options:`, opt);
        const result = await scrapeRealtorProfile(url, opt);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        // Wait before trying again, but only if we're not on the last attempt
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  // If we got here, all attempts failed
  throw lastError || new Error('All scraping attempts failed');
}

/**
 * Scrapes a Realtor.com profile for contact information using ScraperAPI
 * @param {string} url - URL of the profile to scrape
 * @param {Object} options - Options to override ScraperAPI defaults
 * @returns {Object} - Extracted contact information
 */
async function scrapeRealtorProfile(url, options = {}) {
  try {
    // Build the ScraperAPI URL with the appropriate options
    const scraperUrl = buildScraperUrl(url, options);
    
    // Make request to ScraperAPI with a shorter timeout
    const response = await axios.get(scraperUrl, { 
      timeout: scraperConfig.defaultOptions.timeout
    });
    
    if (response.status !== 200) {
      throw new Error(`ScraperAPI returned status: ${response.status}`);
    }

    const html = response.data;
    const $ = cheerio.load(html);
    
    // Initialize contact info
    const contactInfo = {
      name: '',
      company: '',
      phone: '',
      email: '',
      description: '',
      profilePicture: '',
      profileLink: url
    };

    // Extract each field using specific extraction functions
    contactInfo.name = extractName($);
    contactInfo.company = extractCompany($);
    contactInfo.phone = extractPhone($);
    contactInfo.description = extractDescription($);
    contactInfo.profilePicture = extractProfilePicture($);

    // Clean and normalize the contact data
    const cleanedContactInfo = cleanContactData(contactInfo);
    
    // Log the scraping attempt for debugging purposes
    logScrapingAttempt(url, cleanedContactInfo);

    return cleanedContactInfo;
  } catch (error) {
    // Log the error
    logScrapingAttempt(url, null, error);
    
    // Rethrow with a more descriptive message
    throw new Error(`ScraperAPI error: ${error.message}`);
  }
}

// Export the functions for testing
export { handler as default, isValidRealtorUrl, scrapeRealtorProfile, scrapeRealtorProfileWithRetry };