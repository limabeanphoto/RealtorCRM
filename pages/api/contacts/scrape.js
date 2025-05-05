// pages/api/contacts/scrape.js
import axios from 'axios';
import cheerio from 'cheerio';
import withAuth from '../../../utils/withAuth';

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
    // Scrape the contact info
    const contactInfo = await scrapeRealtorProfile(url);
    
    if (!contactInfo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Could not extract contact information from this profile' 
      });
    }

    // Check if the profile has at least name and phone
    if (!contactInfo.name || !contactInfo.phone) {
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
 * Scrapes a Realtor.com profile for contact information
 * @param {string} url - URL of the profile to scrape
 * @returns {Object} - Extracted contact information
 */
async function scrapeRealtorProfile(url) {
  try {
    // Set headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.realtor.com/',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Make request to the profile URL
    const response = await axios.get(url, { 
      headers,
      timeout: 15000  // 15-second timeout
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
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

    // Try multiple selector strategies for each field
    contactInfo.name = extractName($, html);
    contactInfo.company = extractCompany($, html);
    contactInfo.phone = extractPhone($, html);
    contactInfo.email = extractEmail($, html);

    // Clean up extracted data
    Object.keys(contactInfo).forEach(key => {
      if (typeof contactInfo[key] === 'string') {
        // Remove extra whitespace
        contactInfo[key] = contactInfo[key].replace(/\s+/g, ' ').trim();
      }
    });

    return contactInfo;
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  }
}

/**
 * Extract the agent's name using multiple selector strategies
 * @param {Object} $ - Cheerio instance
 * @param {string} html - Raw HTML content
 * @returns {string} - Extracted name
 */
function extractName($, html) {
  // Try multiple selectors in order of specificity
  const selectors = [
    '.agent-name',                  // Specific class
    'h1[data-testid="agent-name"]', // Data attribute
    'h1.agent-details-title',       // Heading with class
    'h1',                           // Any H1
    '[itemprop="name"]',            // Schema.org markup
    '.profile-card h1',             // Context-based
    '.profile-section-header',      // Generic profile section
  ];
  
  // Try each selector
  for (const selector of selectors) {
    const name = $(selector).first().text().trim();
    if (name && name.length > 0) {
      return name;
    }
  }
  
  // Fallback: try to find a name pattern in the text
  const namePattern = /Agent: ([A-Z][a-z]+ [A-Z][a-z]+)/;
  const nameMatch = html.match(namePattern);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1];
  }
  
  return '';
}

/**
 * Extract the agent's company using multiple selector strategies
 * @param {Object} $ - Cheerio instance
 * @param {string} html - Raw HTML content
 * @returns {string} - Extracted company
 */
function extractCompany($, html) {
  // Try multiple selectors in order of specificity
  const selectors = [
    '.agent-company',                // Specific class
    '[data-testid="agent-company"]', // Data attribute
    '.agent-details .company-details', // Nested structure
    '[itemprop="affiliation"]',     // Schema.org markup
    '.agent-brokerage',             // Alternative class
    '.profile-card .company',        // Context-based
    '.office-info',                 // Generic profile section
  ];
  
  // Try each selector
  for (const selector of selectors) {
    const company = $(selector).first().text().trim();
    if (company && company.length > 0) {
      return company;
    }
  }
  
  // Fallback: try to find a company pattern in the text
  const companyPattern = /(?:with|at) ([\w\s]+,\s*(?:LLC|Inc|Realty))/i;
  const companyMatch = html.match(companyPattern);
  if (companyMatch && companyMatch[1]) {
    return companyMatch[1];
  }
  
  return '';
}

/**
 * Extract the agent's phone number using multiple selector strategies
 * @param {Object} $ - Cheerio instance
 * @param {string} html - Raw HTML content
 * @returns {string} - Extracted phone number
 */
function extractPhone($, html) {
  // Try multiple selectors in order of specificity
  const selectors = [
    '.agent-phone',                 // Specific class
    '[data-testid="agent-phone"]',  // Data attribute
    'a[href^="tel:"]',              // Tel links
    '.contact-info .phone',         // Nested structure
    '[itemprop="telephone"]',       // Schema.org markup
    '.profile-contact-phone',       // Alternative class
  ];
  
  // Try each selector
  for (const selector of selectors) {
    const phoneElement = $(selector).first();
    
    // Check for href attribute first (for tel: links)
    const hrefPhone = phoneElement.attr('href');
    if (hrefPhone && hrefPhone.startsWith('tel:')) {
      return hrefPhone.replace('tel:', '');
    }
    
    // Otherwise get text content
    const phone = phoneElement.text().trim();
    if (phone && phone.length > 0) {
      return phone;
    }
  }
  
  // Fallback: try to find a phone number pattern in the page
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = html.match(phoneRegex);
  if (phoneMatch) {
    return phoneMatch[0];
  }
  
  return '';
}

/**
 * Extract the agent's email using multiple selector strategies
 * @param {Object} $ - Cheerio instance
 * @param {string} html - Raw HTML content
 * @returns {string} - Extracted email
 */
function extractEmail($, html) {
  // Try multiple selectors in order of specificity
  const selectors = [
    '.agent-email',                 // Specific class
    '[data-testid="agent-email"]',  // Data attribute
    'a[href^="mailto:"]',           // Email links
    '.contact-info .email',         // Nested structure
    '[itemprop="email"]',           // Schema.org markup
    '.profile-contact-email',       // Alternative class
  ];
  
  // Try each selector
  for (const selector of selectors) {
    const emailElement = $(selector).first();
    
    // Check for href attribute first (for mailto: links)
    const hrefEmail = emailElement.attr('href');
    if (hrefEmail && hrefEmail.startsWith('mailto:')) {
      return hrefEmail.replace('mailto:', '');
    }
    
    // Otherwise get text content
    const email = emailElement.text().trim();
    if (email && email.length > 0 && email.includes('@')) {
      return email;
    }
  }
  
  // Fallback: try to find email pattern in the page
  // Note: emails are often obfuscated, so this might not work well
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = html.match(emailRegex);
  if (emailMatch) {
    return emailMatch[0];
  }
  
  return '';
}

export default withAuth(handler);