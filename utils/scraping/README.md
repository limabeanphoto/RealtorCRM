# Scraping Service Abstraction Layer

A flexible, provider-based architecture for web scraping in the RealtorCRM application. This system replaces the current hardcoded scraping implementation with a comprehensive, extensible solution.

## Architecture Overview

```
ScrapingOrchestrator
├── Provider 1 (ScraperAPI)
├── Provider 2 (AI Vision)
├── Provider 3 (Selenium)
└── Provider N (Custom)
```

## Core Components

### 1. ScrapingServiceProvider (Abstract Base Class)
- **Purpose**: Defines the interface for all scraping providers
- **Features**: 
  - Rate limiting
  - Usage metrics
  - Capability management
  - Error handling
  - Confidence scoring

### 2. ScrapingOrchestrator
- **Purpose**: Manages multiple providers with fallback logic
- **Features**:
  - Provider prioritization
  - Retry strategies
  - Caching
  - Parallel/sequential execution
  - Progress callbacks

### 3. ContactExtractor
- **Purpose**: Standardized contact data extraction and normalization
- **Features**:
  - Multiple extraction strategies
  - Confidence scoring
  - Data validation
  - Field normalization

### 4. Types & Constants
- **Purpose**: TypeScript-style type definitions and constants
- **Features**:
  - Comprehensive type definitions
  - Validation utilities
  - Error types
  - Configuration constants

## Usage Examples

### Basic Usage

```javascript
import { ScrapingOrchestrator, ScrapingUtils } from './utils/scraping';
import { ScraperAPIProvider } from './utils/scraping/providers/ScraperAPIProvider';

// Create orchestrator
const orchestrator = new ScrapingOrchestrator({
  retryMaxAttempts: 3,
  cacheEnabled: true,
  confidenceThreshold: 60
});

// Register providers
const scraperApiProvider = new ScraperAPIProvider({
  apiKey: process.env.SCRAPERAPI_KEY,
  priority: 8,
  rateLimit: 100
});

orchestrator.registerProvider(scraperApiProvider);

// Scrape with progress tracking
const result = await orchestrator.scrape(
  { url: 'https://realtor.com/agent/profile' },
  (progress) => {
    console.log(`${progress.stage}: ${progress.progress}% - ${progress.message}`);
  }
);

if (result.success) {
  console.log('Contact data:', result.data);
  console.log('Confidence:', result.confidence);
} else {
  console.error('Scraping failed:', result.error);
}
```

### Advanced Configuration

```javascript
// Create orchestrator with advanced options
const orchestrator = new ScrapingOrchestrator({
  // Retry configuration
  retryConfig: {
    maxAttempts: 5,
    strategy: 'exponential',
    baseDelay: 1000,
    maxDelay: 30000
  },
  
  // Cache configuration
  cacheConfig: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 1000
  },
  
  // Parallel provider execution
  parallelProviders: true,
  
  // Minimum confidence threshold
  confidenceThreshold: 70
});

// Register multiple providers with different priorities
orchestrator.registerProvider(new ScraperAPIProvider({
  apiKey: process.env.SCRAPERAPI_KEY,
  priority: 9,
  supportedDomains: ['realtor.com', 'zillow.com']
}));

orchestrator.registerProvider(new AIVisionProvider({
  apiKey: process.env.OPENAI_API_KEY,
  priority: 7,
  supportedDomains: [] // Universal provider
}));
```

### Custom Provider Implementation

```javascript
import { ScrapingServiceProvider } from './utils/scraping/ScrapingServiceProvider';

class CustomProvider extends ScrapingServiceProvider {
  constructor(config) {
    super({
      name: 'CustomProvider',
      type: 'custom',
      priority: 5,
      ...config
    });
  }

  initialize() {
    // Set up provider capabilities
    this.addCapability('custom_extraction');
  }

  async scrape(request, onProgress) {
    // Implement custom scraping logic
    const startTime = Date.now();
    
    try {
      // Your scraping implementation
      const data = await this.customScrapeLogic(request.url);
      const contactData = await this.extractContactData(data, request.url);
      
      return this.createResponse(
        true, 
        contactData, 
        null, 
        Date.now() - startTime
      );
    } catch (error) {
      return this.createResponse(
        false, 
        null, 
        this.handleError(error), 
        Date.now() - startTime
      );
    }
  }

  async extractContactData(html, url) {
    // Implement custom extraction logic
    // Return ContactData object
  }
}
```

## Provider Capabilities

Each provider can declare its capabilities:

```javascript
// Available capabilities
PROVIDER_CAPABILITIES = {
  JAVASCRIPT_RENDERING: 'javascript_rendering',
  PROXY_SUPPORT: 'proxy_support',
  RATE_LIMITING: 'rate_limiting',
  CACHING: 'caching',
  MOBILE_EMULATION: 'mobile_emulation',
  CAPTCHA_SOLVING: 'captcha_solving',
  CUSTOM_HEADERS: 'custom_headers',
  COOKIES: 'cookies',
  SESSION_MANAGEMENT: 'session_management',
  STRUCTURED_DATA: 'structured_data',
  AI_EXTRACTION: 'ai_extraction'
};
```

## Error Handling

The system provides comprehensive error handling:

```javascript
// Error types
ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  VALIDATION_ERROR: 'validation_error',
  PROVIDER_ERROR: 'provider_error',
  EXTRACTION_ERROR: 'extraction_error',
  CONFIGURATION_ERROR: 'configuration_error',
  UNKNOWN_ERROR: 'unknown_error'
};

// Error handling example
try {
  const result = await orchestrator.scrape(request);
} catch (error) {
  console.error(`Error type: ${error.type}`);
  console.error(`Provider: ${error.provider}`);
  console.error(`Message: ${error.message}`);
}
```

## Metrics and Monitoring

### Orchestrator Metrics
```javascript
const metrics = orchestrator.getMetrics();
console.log({
  totalRequests: metrics.totalRequests,
  successRate: metrics.successfulRequests / metrics.totalRequests * 100,
  averageResponseTime: metrics.averageResponseTime,
  cacheHitRate: metrics.cacheHits / metrics.totalRequests * 100,
  providerUsage: metrics.providerUsage
});
```

### Provider Status
```javascript
const status = orchestrator.getStatus();
console.log({
  healthy: status.healthy,
  totalProviders: status.totalProviders,
  healthyProviders: status.healthyProviders,
  providers: status.providers
});
```

## Configuration Reference

### Orchestrator Configuration
```javascript
{
  // Retry configuration
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    strategy: 'exponential', // 'fixed', 'linear', 'exponential'
    retriableStatusCodes: [429, 500, 502, 503, 504],
    retriableErrors: ['network_error', 'timeout_error', 'rate_limit_error']
  },
  
  // Cache configuration
  cacheConfig: {
    enabled: true,
    ttl: 3600, // seconds
    maxSize: 1000,
    keyPrefix: 'scraping:'
  },
  
  // General settings
  confidenceThreshold: 50,
  parallelProviders: false,
  timeout: 30000
}
```

### Provider Configuration
```javascript
{
  name: 'ProviderName',
  type: 'api', // 'api', 'selenium', 'puppeteer', 'ai', 'custom'
  priority: 8, // 1-10, higher is better
  rateLimit: 100, // requests per minute
  timeout: 30000, // milliseconds
  enabled: true,
  supportedDomains: ['example.com'],
  credentials: {
    apiKey: 'your-api-key'
  },
  options: {
    // Provider-specific options
  }
}
```

## Migration from Existing System

To migrate from the current hardcoded scraping system:

1. **Create the orchestrator**:
```javascript
const orchestrator = ScrapingUtils.createOrchestrator({
  retryMaxAttempts: 3,
  cacheEnabled: true
});
```

2. **Register ScraperAPI provider**:
```javascript
import scraperConfig from '../pages/api/contacts/scrape.config';

const provider = new ScraperAPIProvider({
  apiKey: scraperConfig.apiKey,
  baseUrl: scraperConfig.baseUrl,
  supportedDomains: ['realtor.com']
});

orchestrator.registerProvider(provider);
```

3. **Replace existing scrape calls**:
```javascript
// Old way
const result = await scrapeRealtorProfile(url);

// New way
const result = await orchestrator.scrape({ url });
```

## Testing

The system includes comprehensive testing utilities:

```javascript
// Test provider connectivity
const isHealthy = await provider.testConnection();

// Test extraction with sample data
const extractor = new ContactExtractor();
const contactData = extractor.extractContactData($, url);
```

## Performance Considerations

1. **Caching**: Enable caching for frequently accessed URLs
2. **Rate Limiting**: Configure appropriate rate limits for each provider
3. **Parallel Execution**: Use parallel providers for faster results
4. **Retry Strategy**: Choose appropriate retry strategies based on provider characteristics
5. **Confidence Thresholds**: Set appropriate confidence thresholds to balance speed vs. accuracy

## Future Enhancements

1. **AI Vision Provider**: For screenshot-based extraction
2. **Selenium Provider**: For complex JavaScript-heavy sites
3. **Queue System**: For background processing
4. **Webhook Support**: For real-time updates
5. **Machine Learning**: For improved confidence scoring

## Contributing

When adding new providers:

1. Extend `ScrapingServiceProvider`
2. Implement required methods (`scrape`, `extractContactData`)
3. Add appropriate capabilities
4. Include comprehensive error handling
5. Add tests for your provider

## License

This scraping service abstraction layer is part of the RealtorCRM application.