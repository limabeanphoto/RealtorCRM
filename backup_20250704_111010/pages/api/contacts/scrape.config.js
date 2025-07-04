// scrape.config.js - Updated with precise selectors from actual HTML
/**
 * Configuration options for the ScraperAPI integration with precise selectors
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
      timeout: 15000,
      
      // Country to scrape from (US for Realtor.com)
      country_code: 'us',
      
      // Premium proxy option (if you have a premium ScraperAPI account)
      premium: false,
      
      // Device type to emulate
      device_type: 'desktop'
    },
    
    // Precise selectors based on actual Realtor.com HTML
    selectors: {
      // Primary selectors - these are the most accurate based on the provided HTML
      primary: {
        name: '.profile-details h2.base__StyledType-rui__sc-108xfm0-0.dQAzyh',
        company: '.profile-details p.base__StyledType-rui__sc-108xfm0-0.GLfFQ',
        phone: 'a[data-linkname="realtors:_details:top:phone_number"]',
        phoneHref: 'a[href^="tel:"]',
        description: '#agent-description',
        profileImg: '.profile-details .profile-img'
      },
      
      // Fallback selectors in case the primary ones change
      fallback: {
        name: [
          'h2:contains("Justin")',
          '.profile-info h2',
          '.agent-name',
          '[data-testid="agent-name"]',
          'h1[data-testid="agent-name"]'
        ],
        company: [
          'p[content*="Harcourts"]',
          '.profile-info p:first-of-type',
          '.agent-company',
          '[data-testid="agent-company"]'
        ],
        phone: [
          '.profile-mobile-icon a',
          'a[href^="tel:"]',
          '.agent-phone',
          '[data-testid="agent-phone"]'
        ],
        description: [
          '#agent-description',
          '.profile-description',
          '.agent-bio'
        ]
      }
    },
    
    // Validation requirements
    required: ['name', 'phone', 'profileLink'],
    
    // Retry configuration
    retry: {
      // Maximum number of retry attempts
      maxAttempts: 2,
      // Delay between retries in milliseconds
      delay: 1000
    }
  };
  
  export default scraperConfig;