// pages/api/contacts/scrape.config.js
/**
 * Configuration options for the ScraperAPI integration
 */
const scraperConfig = {
    // API key for ScraperAPI
    apiKey: '70ac05c680ca256611baa42243a1ad64',
    
    // Base URL for ScraperAPI
    baseUrl: 'http://api.scraperapi.com',
    
    // Default options for ScraperAPI
    defaultOptions: {
      // Whether to render JavaScript (needed for Realtor.com)
      render: true,
      
      // Whether to keep headers from the original request
      keepHeaders: true,
      
      // Timeout in milliseconds
      timeout: 30000,
      
      // Country to scrape from (US for Realtor.com)
      country_code: 'us',
      
      // Premium proxy option (if you have a premium ScraperAPI account)
      premium: false,
      
      // Device type to emulate
      device_type: 'desktop'
    },
    
    // Selectors to use for extraction
    selectors: {
      name: [
        '.agent-name',
        '[data-testid="agent-name"]',
        'h1[data-testid="agent-name"]',
        'h1.agent-details-title',
        'h1',
        '[itemprop="name"]',
        '.profile-card h1',
        '.profile-section-header',
        '.profile-display-name'
      ],
      company: [
        '.agent-company',
        '[data-testid="agent-company"]',
        '.agent-details .company-details',
        '[itemprop="affiliation"]',
        '.agent-brokerage',
        '.profile-card .company',
        '.office-info',
        '.broker-name',
        '.company-name'
      ],
      phone: [
        '.agent-phone',
        '[data-testid="agent-phone"]',
        'a[href^="tel:"]',
        '.contact-info .phone',
        '[itemprop="telephone"]',
        '.profile-contact-phone',
        '.phone-number',
        '[aria-label="phone"]'
      ],
      email: [
        '.agent-email',
        '[data-testid="agent-email"]',
        'a[href^="mailto:"]',
        '.contact-info .email',
        '[itemprop="email"]',
        '.profile-contact-email',
        '.email-address',
        '[aria-label="email"]'
      ]
    },
    
    // Regex patterns for extraction
    patterns: {
      name: [
        /Agent: ([A-Z][a-z]+ [A-Z][a-z]+)/,
        /Realtor®: ([A-Z][a-z]+ [A-Z][a-z]+)/,
        /([A-Z][a-z]+ [A-Z][a-z]+), Realtor®/
      ],
      company: [
        /(?:with|at) ([\w\s]+,\s*(?:LLC|Inc|Realty))/i,
        /Office: ([\w\s]+(?:LLC|Inc|Realty|Real Estate|Properties))/i,
        /([\w\s]+(?:LLC|Inc|Realty|Real Estate|Properties))/i
      ],
      phone: [
        /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
        /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
        /Phone:\s*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i
      ],
      email: [
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
        /Email:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
      ]
    },
    
    // Validation requirements
    required: ['name', 'phone', 'profileLink']
  };
  
  export default scraperConfig;