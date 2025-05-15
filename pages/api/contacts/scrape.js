// pages/api/contacts/scrape.js - Updated with ScraperAPI
import axios from 'axios';
import cheerio from 'cheerio';
import withAuth from '../../../utils/withAuth';
import scraperConfig from './scrape.config';
import {
  buildScraperUrl,
  extractWithSelectors,
  validateContact,
  cleanContactData,
  logScrapingAttempt
} from './scrapeUtils';

/**
 * API endpoint to scrape realtor contact information from Realtor.com
 */
async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed` 
    });
  }

  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ 
      success: false, 
      message: 'URL is required' 
    });
  }

  // Validate that the URL is from Realtor.com
  if (!isValidRealtorUrl(url)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid URL. Only Realtor.com profile URLs are supported at this time.' 
    });
  }

  try {
    // Scrape the contact info using ScraperAPI
    const contactInfo = await scrapeRealtorProfile(url);
    
    if (!contactInfo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Could not extract contact information from this profile' 
      });
    }

    // Check if the profile has the required fields
    if (!validateContact(contactInfo)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Profile missing required information (name and phone)' 
      });
    }

    // Return the scraped contact info
    return res.status(200).json({ 
      success: true, 
      data: contactInfo
    });
  } catch (error) {
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
 * Scrapes a Realtor.com profile for contact information using ScraperAPI
 * @param {string} url - URL of the profile to scrape
 * @returns {Object} - Extracted contact information
 */
async function scrapeRealtorProfile(url) {
  try {
    // Build the ScraperAPI URL with the appropriate options
    const scraperUrl = buildScraperUrl(url, {
      render: true,
      keepHeaders: true,
      countryCode: 'us'
    });
    
    // Make request to ScraperAPI
    const response = await axios.get(scraperUrl, { 
      timeout: scraperConfig.defaultOptions.timeout  // Use timeout from config
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
      profileLink: url
    };

    // Extract each field using the utility function
    contactInfo.name = extractWithSelectors($, html, 'name');
    contactInfo.company = extractWithSelectors($, html, 'company');
    contactInfo.phone = extractWithSelectors($, html, 'phone');
    contactInfo.email = extractWithSelectors($, html, 'email');

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
export { handler as default, isValidRealtorUrl, scrapeRealtorProfile };