# AI Fallback Services Setup Guide

This guide explains how to set up and configure the AI fallback services for the RealtorCRM scraping system.

## Overview

The AI fallback services provide intelligent contact extraction when traditional scraping methods fail or return low-confidence results. The system includes:

- **Gemini Flash Provider**: Google's fast, cost-effective AI model with generous free tier
- **OpenAI GPT-4 Vision Provider**: High-quality vision analysis for complex scenarios
- **Screenshot Service**: Automated webpage capture for vision analysis
- **Optimized Prompts**: Specialized prompts for reliable contact extraction

## Quick Start

### 1. Environment Variables

Set up the required API keys in your environment:

```bash
# Google Gemini API (Primary AI fallback - generous free tier)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API (Secondary AI fallback - higher quality, higher cost)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORGANIZATION=your_openai_org_id_here  # Optional

# Screenshot API (Optional - for API-based screenshots)
SCREENSHOT_API_KEY=your_screenshot_api_key_here
```

### 2. Basic Integration

```javascript
import { ScrapingOrchestrator } from './utils/scraping/ScrapingOrchestrator.js';
import { GeminiProvider } from './utils/scraping/providers/GeminiProvider.js';
import { OpenAIProvider } from './utils/scraping/providers/OpenAIProvider.js';

// Create orchestrator
const orchestrator = new ScrapingOrchestrator({
  confidenceThreshold: 70,
  parallelProviders: false
});

// Add AI providers
orchestrator.registerProvider(new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY,
  priority: 3,
  monthlyCostLimit: 10
}));

orchestrator.registerProvider(new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  priority: 2,
  monthlyCostLimit: 100
}));

// Use the orchestrator
const result = await orchestrator.scrape({ url: 'https://example.com/realtor' });
```

## API Setup Instructions

### Google Gemini API

1. **Get API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your environment variables

2. **Free Tier Limits**:
   - 60 requests per minute
   - 1,500 requests per day
   - 32,000 tokens per minute
   - 50,000 tokens per day

3. **Pricing** (if you exceed free tier):
   - Gemini 1.5 Flash: $0.35 per 1M input tokens, $1.05 per 1M output tokens

### OpenAI API

1. **Get API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Set up billing (required for API access)

2. **Rate Limits** (default):
   - 20 requests per minute
   - 10,000 tokens per minute
   - Varies by usage tier

3. **Pricing**:
   - GPT-4 Vision: $0.01 per 1K tokens (input), $0.03 per 1K tokens (output)
   - Image analysis: Additional cost based on image size

## Configuration Options

### Gemini Provider Configuration

```javascript
const geminiProvider = new GeminiProvider({
  // Required
  apiKey: process.env.GEMINI_API_KEY,
  
  // Provider settings
  name: 'gemini-flash',
  priority: 3,
  enabled: true,
  
  // Rate limiting
  rateLimit: 60, // requests per minute
  timeout: 8000, // milliseconds
  
  // Cost management
  monthlyCostLimit: 10, // dollars
  costPerRequest: 0.0005,
  
  // AI settings
  modelName: 'gemini-1.5-flash',
  maxTokens: 2048,
  temperature: 0.1,
  confidenceThreshold: 0.7,
  
  // Input type
  inputType: 'html', // 'html' or 'screenshot'
  
  // Retry settings
  maxRetries: 3,
  backoffFactor: 2
});
```

### OpenAI Provider Configuration

```javascript
const openaiProvider = new OpenAIProvider({
  // Required
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION, // Optional
  
  // Provider settings
  name: 'openai-gpt4-vision',
  priority: 2,
  enabled: true,
  
  // Rate limiting
  rateLimit: 20, // requests per minute
  timeout: 15000, // milliseconds
  
  // Cost management
  monthlyCostLimit: 100, // dollars
  costPerRequest: 0.01,
  
  // AI settings
  modelName: 'gpt-4-vision-preview',
  maxTokens: 1000,
  temperature: 0.1,
  confidenceThreshold: 0.8,
  
  // Input type
  inputType: 'screenshot', // 'html' or 'screenshot'
  imageDetail: 'auto', // 'low', 'high', 'auto'
  
  // Retry settings
  maxRetries: 3,
  backoffFactor: 2
});
```

### Screenshot Service Configuration

```javascript
const screenshotService = new ScreenshotService({
  // Screenshot dimensions
  width: 1920,
  height: 1080,
  viewportWidth: 1920,
  viewportHeight: 1080,
  
  // Image settings
  quality: 85,
  format: 'jpeg', // 'jpeg' or 'png'
  fullPage: false,
  
  // Timing
  waitTime: 3000, // wait for page load
  timeout: 30000,
  
  // Methods (in order of preference)
  methods: ['puppeteer', 'playwright', 'api', 'fallback'],
  
  // API service (optional)
  apiConfig: {
    service: 'htmlcsstoimage',
    apiKey: process.env.SCREENSHOT_API_KEY,
    endpoint: 'https://hcti.io/v1/image'
  }
});
```

## Best Practices

### 1. Cost Management

```javascript
// Set reasonable cost limits
const geminiProvider = new GeminiProvider({
  monthlyCostLimit: 10, // Start low for Gemini
  // Monitor usage with getCostTracking()
});

const openaiProvider = new OpenAIProvider({
  monthlyCostLimit: 50, // Higher for OpenAI quality
  // Check costs regularly
});

// Monitor costs
const costAnalysis = geminiProvider.getCostTracking();
console.log('Projected monthly cost:', costAnalysis.projectedMonthlyCost);
```

### 2. Provider Priority

```javascript
// Set up provider cascade: Fast -> AI Fallback -> High Quality AI
orchestrator.registerProvider(new ScraperAPIProvider({ priority: 10 })); // Primary
orchestrator.registerProvider(new GeminiProvider({ priority: 3 }));      // AI fallback
orchestrator.registerProvider(new OpenAIProvider({ priority: 2 }));      // Quality fallback
```

### 3. Confidence Thresholds

```javascript
// Set appropriate confidence thresholds
const orchestrator = new ScrapingOrchestrator({
  confidenceThreshold: 70, // Global threshold
});

// Provider-specific thresholds
const geminiProvider = new GeminiProvider({
  confidenceThreshold: 0.7, // 70%
});

const openaiProvider = new OpenAIProvider({
  confidenceThreshold: 0.8, // 80% (higher for expensive provider)
});
```

### 4. Error Handling

```javascript
try {
  const result = await orchestrator.scrape({ url: targetUrl });
  
  if (!result.success) {
    console.log('All providers failed:', result.error);
    // Implement fallback logic
  } else if (result.confidence < 70) {
    console.log('Low confidence result - manual review needed');
    // Flag for manual review
  }
} catch (error) {
  console.error('Scraping error:', error);
  // Implement error recovery
}
```

## Performance Optimization

### 1. Input Type Selection

```javascript
// HTML analysis (faster, cheaper)
const geminiProvider = new GeminiProvider({
  inputType: 'html',
  priority: 3
});

// Screenshot analysis (slower, more expensive, but better for complex layouts)
const openaiProvider = new OpenAIProvider({
  inputType: 'screenshot',
  priority: 2
});
```

### 2. Caching Strategy

```javascript
const orchestrator = new ScrapingOrchestrator({
  cacheConfig: {
    enabled: true,
    ttl: 3600, // 1 hour cache
    maxSize: 1000
  }
});
```

### 3. Rate Limiting

```javascript
// Batch processing with delays
const results = [];
for (const url of urls) {
  const result = await orchestrator.scrape({ url });
  results.push(result);
  
  // Respect rate limits
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

## Monitoring and Analytics

### 1. Provider Performance

```javascript
// Get detailed metrics
const metrics = orchestrator.getMetrics();
console.log('Success rate:', metrics.successfulRequests / metrics.totalRequests);
console.log('Average response time:', metrics.averageResponseTime);
console.log('Cache hit rate:', metrics.cacheStats.hitRate);

// Provider-specific metrics
const providerStatus = geminiProvider.getStatus();
console.log('Gemini daily usage:', providerStatus.geminiSpecific.dailyUsage);
```

### 2. Cost Tracking

```javascript
// Track costs across all providers
const geminiCosts = geminiProvider.getCostTracking();
const openaiCosts = openaiProvider.getCostTracking();

console.log('Total projected monthly cost:', 
  geminiCosts.projectedMonthlyCost + openaiCosts.projectedMonthlyCost);
```

### 3. Quality Assessment

```javascript
// Analyze extraction quality
const result = await orchestrator.scrape({ url });

if (result.success) {
  console.log('Confidence:', result.confidence);
  console.log('Provider used:', result.provider);
  console.log('Fields extracted:', Object.keys(result.data).length);
  
  // Check for required fields
  const hasPhone = result.data.phone && result.data.phone.length > 0;
  const hasEmail = result.data.email && result.data.email.length > 0;
  console.log('Contact methods available:', { hasPhone, hasEmail });
}
```

## Troubleshooting

### Common Issues

1. **API Key Errors**
   ```
   Error: Invalid or missing Gemini API key
   ```
   - Verify API key is correctly set in environment variables
   - Check API key permissions and quotas

2. **Rate Limit Exceeded**
   ```
   Error: Gemini API rate limit exceeded
   ```
   - Implement delays between requests
   - Check daily usage limits
   - Consider upgrading to paid tier

3. **Low Confidence Results**
   ```
   Warning: Low confidence result - manual review needed
   ```
   - Review the extracted data manually
   - Consider adjusting confidence thresholds
   - Try different AI providers

4. **Screenshot Capture Fails**
   ```
   Error: All screenshot methods failed
   ```
   - Install puppeteer or playwright: `npm install puppeteer`
   - Set up screenshot API service
   - Check URL accessibility

### Debug Mode

```javascript
// Enable detailed logging
const orchestrator = new ScrapingOrchestrator({
  logger: {
    info: console.log,
    warn: console.warn,
    error: console.error
  }
});

// Test individual providers
const testResult = await geminiProvider.testConnection();
console.log('Gemini connectivity:', testResult);
```

## Example Implementation

See `utils/scraping/examples/ai-fallback-integration.js` for a complete implementation example with:

- Provider setup and configuration
- Error handling and retry logic
- Cost monitoring and optimization
- Bulk processing capabilities
- Performance analytics

## Support

For additional help:

1. Check the provider status: `provider.getStatus()`
2. Review the orchestrator metrics: `orchestrator.getMetrics()`
3. Test connectivity: `provider.testConnection()`
4. Monitor API quotas and costs regularly
5. Implement proper error handling and fallbacks

The AI fallback system is designed to be robust and cost-effective while providing high-quality contact extraction when traditional methods fail.