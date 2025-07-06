# Enhanced Scraping System Migration Guide

This guide helps you migrate from the current hardcoded scraping implementation to the new enhanced system with modern selector strategies and intelligent fallbacks.

## Overview of Improvements

### What's New
- **Modern Selector Strategies**: Avoid brittle hash-based CSS classes
- **Multiple Extraction Methods**: Structured data, semantic HTML, pattern matching
- **Confidence Scoring**: Real-time quality assessment of extracted data
- **Specialized Extractors**: Realtor.com-specific extraction logic
- **Smart Fallbacks**: Multi-level fallback strategies for robust extraction
- **Better Error Handling**: Comprehensive error recovery and logging

### Before vs After

#### Old Implementation (scrape.config.js)
```javascript
// Brittle hash-based selectors
selectors: {
  primary: {
    name: '.profile-details h2.base__StyledType-rui__sc-108xfm0-0.dQAzyh',
    company: '.profile-details p.base__StyledType-rui__sc-108xfm0-0.GLfFQ',
    phone: 'a[data-linkname="realtors:_details:top:phone_number"]'
  }
}
```

#### New Implementation
```javascript
// Modern, resilient selectors with fallbacks
name: [
  {
    strategy: 'structured_data',
    selectors: ['[itemProp="name"]', '[data-testid*="agent-name"]'],
    confidence: 95,
    priority: 100
  },
  {
    strategy: 'semantic_headings', 
    selectors: ['h1:not(:has(a))', 'h2:not(:has(a))'],
    confidence: 80,
    priority: 90
  }
]
```

## Migration Steps

### Step 1: Update ScraperAPI Provider

Replace the existing ScraperAPIProvider with the enhanced version:

```javascript
// OLD: Basic provider initialization
const provider = new ScraperAPIProvider({
  apiKey: 'your-api-key',
  // basic config
});

// NEW: Enhanced provider with modern extractors
const provider = new ScraperAPIProvider({
  apiKey: process.env.SCRAPERAPI_KEY,
  priority: 8,
  rateLimit: 100,
  timeout: 30000,
  render: true,
  supportedDomains: ['realtor.com'],
  confidenceThreshold: 60,
  enableFallbacks: true
});
```

### Step 2: Update API Endpoints

Modify your scraping API endpoints to use the enhanced system:

```javascript
// pages/api/contacts/scrape.js

import { ScraperAPIProvider } from '../../../utils/scraping/providers/ScraperAPIProvider.js';

export default async function handler(req, res) {
  try {
    const { url } = req.body;
    
    // Initialize enhanced provider
    const provider = new ScraperAPIProvider({
      apiKey: process.env.SCRAPERAPI_KEY,
      confidenceThreshold: 60
    });
    
    // Create scraping request
    const request = {
      url,
      options: {
        render: true,
        timeout: 30000
      }
    };
    
    // Scrape with progress tracking
    const result = await provider.scrape(request, (progress) => {
      console.log(`Progress: ${progress.progress}% - ${progress.message}`);
    });
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        confidence: result.data.confidence,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error.message,
        type: result.error.type
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

### Step 3: Update Utility Functions

Replace the old utility functions with the new extraction system:

```javascript
// OLD: scrapeUtils.js functions
import { extractName, extractCompany, extractPhone } from './scrapeUtils.js';

// NEW: Enhanced extraction
import { RealtorExtractor } from '../utils/scraping/extractors/RealtorExtractor.js';

const extractor = new RealtorExtractor();
const contactData = extractor.extractContactData($, url);
```

### Step 4: Configure Confidence Thresholds

Set appropriate confidence thresholds for your use case:

```javascript
// Configuration based on your quality requirements
const config = {
  // Strict mode: Only accept high-confidence extractions
  strict: {
    confidenceThreshold: 80,
    requireMinimumFields: ['name', 'phone'],
    strictMode: true
  },
  
  // Balanced mode: Accept medium-confidence with fallbacks
  balanced: {
    confidenceThreshold: 60,
    enableFallbacks: true,
    strictMode: false
  },
  
  // Permissive mode: Accept any extraction with validation
  permissive: {
    confidenceThreshold: 40,
    enableFallbacks: true,
    strictMode: false
  }
};
```

### Step 5: Update Frontend Components

Modify your frontend to handle the new response format:

```javascript
// OLD: Simple success/failure handling
const handleScrape = async (url) => {
  const response = await fetch('/api/contacts/scrape', {
    method: 'POST',
    body: JSON.stringify({ url })
  });
  const data = await response.json();
  // Basic handling
};

// NEW: Enhanced handling with confidence scores
const handleScrape = async (url) => {
  const response = await fetch('/api/contacts/scrape', {
    method: 'POST',
    body: JSON.stringify({ url })
  });
  const result = await response.json();
  
  if (result.success) {
    const { data, confidence } = result;
    
    // Show confidence scores to user
    setExtractionConfidence(confidence.overall);
    
    // Highlight fields with low confidence
    const lowConfidenceFields = Object.entries(confidence)
      .filter(([field, score]) => score < 70 && score > 0)
      .map(([field]) => field);
    
    if (lowConfidenceFields.length > 0) {
      showWarning(`Low confidence in: ${lowConfidenceFields.join(', ')}`);
    }
    
    // Handle extraction data
    setContactData(data);
  } else {
    // Enhanced error handling
    handleExtractionError(result.error, result.type);
  }
};
```

## Configuration Options

### ScraperAPI Provider Options

```javascript
const providerConfig = {
  // Authentication
  apiKey: process.env.SCRAPERAPI_KEY,
  baseUrl: 'http://api.scraperapi.com',
  
  // Provider settings
  priority: 8,
  rateLimit: 100, // requests per minute
  timeout: 30000, // milliseconds
  enabled: true,
  
  // Supported domains
  supportedDomains: ['realtor.com'],
  
  // ScraperAPI options
  render: true, // Enable JavaScript rendering
  keepHeaders: true,
  countryCode: 'us',
  premium: false,
  deviceType: 'desktop',
  
  // Enhanced extraction options
  confidenceThreshold: 60,
  enableFallbacks: true,
  strictMode: false
};
```

### Realtor Extractor Options

```javascript
const extractorConfig = {
  strictMode: false, // Allow flexible extraction
  confidenceThreshold: 60, // Minimum confidence for acceptance
  enableFallbacks: true, // Use fallback strategies
  
  // Field-specific thresholds
  fieldThresholds: {
    name: 70,
    phone: 80,
    email: 75,
    company: 65,
    description: 50
  }
};
```

## Testing the Migration

### 1. Test with Known URLs

```javascript
const testUrls = [
  'https://www.realtor.com/realestateagents/...',
  // Add your test URLs
];

for (const url of testUrls) {
  const result = await provider.scrape({ url });
  console.log(`URL: ${url}`);
  console.log(`Success: ${result.success}`);
  console.log(`Confidence: ${result.data?.confidence?.overall}%`);
  console.log(`Fields: ${Object.keys(result.data || {}).length}`);
}
```

### 2. Compare Old vs New Results

```javascript
// Run both old and new systems side by side
const oldResult = await oldScrapingFunction(url);
const newResult = await enhancedProvider.scrape({ url });

console.log('Comparison:');
console.log('Old:', oldResult);
console.log('New:', newResult.data);
console.log('Confidence:', newResult.data.confidence);
```

### 3. Monitor Extraction Quality

```javascript
// Track extraction metrics
const metrics = {
  totalExtractions: 0,
  successfulExtractions: 0,
  averageConfidence: 0,
  fieldSuccessRates: {
    name: 0,
    phone: 0,
    email: 0,
    company: 0
  }
};

// Update metrics after each extraction
function updateMetrics(result) {
  metrics.totalExtractions++;
  
  if (result.success) {
    metrics.successfulExtractions++;
    metrics.averageConfidence += result.data.confidence.overall;
    
    // Track field success rates
    Object.keys(metrics.fieldSuccessRates).forEach(field => {
      if (result.data[field]) {
        metrics.fieldSuccessRates[field]++;
      }
    });
  }
}
```

## Error Handling

### Common Migration Issues

1. **Import Errors**
   ```javascript
   // Make sure all imports are correct
   import { ScraperAPIProvider } from '../utils/scraping/providers/ScraperAPIProvider.js';
   import { RealtorExtractor } from '../utils/scraping/extractors/RealtorExtractor.js';
   ```

2. **Configuration Errors**
   ```javascript
   // Ensure environment variables are set
   if (!process.env.SCRAPERAPI_KEY) {
     throw new Error('SCRAPERAPI_KEY environment variable is required');
   }
   ```

3. **Async/Await Issues**
   ```javascript
   // All extraction methods are now async
   const result = await provider.scrape(request);
   ```

### Error Recovery

```javascript
const scrapeWithFallback = async (url) => {
  try {
    // Try enhanced scraping first
    const result = await enhancedProvider.scrape({ url });
    
    if (result.success && result.data.confidence.overall >= 60) {
      return result.data;
    }
    
    // Fallback to old system if confidence is low
    console.warn('Low confidence, falling back to old scraper');
    return await oldScrapingFunction(url);
    
  } catch (error) {
    console.error('Enhanced scraping failed:', error);
    
    // Final fallback
    return await oldScrapingFunction(url);
  }
};
```

## Performance Considerations

### Caching

```javascript
// Enable caching for better performance
const cacheConfig = {
  enabled: true,
  ttl: 3600, // 1 hour
  strategy: 'memory',
  maxSize: 1000
};
```

### Rate Limiting

```javascript
// Respect ScraperAPI rate limits
const rateLimitConfig = {
  requestsPerMinute: 100,
  burstLimit: 10,
  backoffStrategy: 'exponential'
};
```

### Monitoring

```javascript
// Monitor performance metrics
const performanceMetrics = {
  averageResponseTime: 0,
  successRate: 0,
  quotaUsage: 0,
  errorRate: 0
};
```

## Rollback Plan

If issues arise, you can easily rollback:

1. **Immediate Rollback**
   ```javascript
   // Switch back to old implementation
   const useEnhancedScraping = false;
   
   if (useEnhancedScraping) {
     return await enhancedProvider.scrape(request);
   } else {
     return await oldScrapingFunction(url);
   }
   ```

2. **Gradual Rollback**
   ```javascript
   // Rollback for specific domains or error rates
   const shouldUseEnhanced = (url, errorRate) => {
     if (errorRate > 0.1) return false; // 10% error rate threshold
     if (url.includes('problematic-domain.com')) return false;
     return true;
   };
   ```

## Support and Troubleshooting

### Debug Logging

Enable detailed logging for troubleshooting:

```javascript
const provider = new ScraperAPIProvider({
  // ... config
  debug: true,
  logLevel: 'verbose'
});
```

### Common Issues

1. **Low Confidence Scores**
   - Check if selectors are working
   - Verify page structure hasn't changed
   - Adjust confidence thresholds

2. **Missing Fields**
   - Review extraction strategies
   - Add custom selectors if needed
   - Check validation rules

3. **Performance Issues**
   - Enable caching
   - Optimize selector strategies
   - Reduce timeout values

### Getting Help

- Check the extraction logs for detailed information
- Use the demo file to test individual components
- Review confidence scores to identify issues
- Test with different threshold settings

The enhanced scraping system provides significant improvements in reliability, accuracy, and maintainability while maintaining backward compatibility with your existing implementation.