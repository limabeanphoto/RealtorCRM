/**
 * Optimized Vision Prompts for AI Contact Extraction
 * Provides specialized prompts for reliable contact information extraction
 * from HTML content and screenshots using AI vision models
 */

/**
 * Vision prompts optimized for contact extraction
 * Contains structured prompts for different input types and scenarios
 */
export class VisionPrompts {
  /**
   * Get HTML extraction prompt for contact information
   * @param {string} url - Original URL for context
   * @returns {string} - Optimized HTML extraction prompt
   */
  static getHtmlExtractionPrompt(url) {
    return `You are an expert at extracting contact information from HTML content. 

TASK: Extract contact information from the provided HTML content and return a JSON object.

IMPORTANT REQUIREMENTS:
1. ONLY extract information that is clearly visible and reliable
2. DO NOT make up or guess information
3. Return valid JSON format only
4. Be conservative - better to miss information than to provide incorrect data
5. Focus on real estate professionals (agents, brokers, property managers)

EXTRACTION RULES:
- Name: Extract full name of the person or business
- Company: Extract company/brokerage name if different from person name
- Phone: Extract phone numbers (format as (XXX) XXX-XXXX if possible)
- Email: Extract email addresses
- Description: Extract brief professional description or title
- ProfileLink: Use the provided URL: ${url}

QUALITY INDICATORS (higher confidence):
- Clear contact sections or "Contact" headers
- Professional titles (Realtor, Agent, Broker, etc.)
- Multiple contact methods available
- Business addresses or license numbers
- Professional headshots or company logos

AVOID:
- Generic website contact forms
- Footer information that's not person-specific
- Social media links without clear professional context
- Partial or unclear information
- Information that appears to be from advertisements

RETURN FORMAT:
{
  "name": "Full Name",
  "company": "Company Name",
  "phone": "(555) 123-4567",
  "email": "email@example.com",
  "description": "Professional title/description",
  "profileLink": "${url}",
  "confidence": 0.95
}

If no reliable contact information is found, return:
{
  "name": null,
  "company": null,
  "phone": null,
  "email": null,
  "description": null,
  "profileLink": "${url}",
  "confidence": 0.0
}

Analyze the HTML content and extract contact information:`;
  }

  /**
   * Get screenshot extraction prompt for contact information
   * @param {string} url - Original URL for context
   * @returns {string} - Optimized screenshot extraction prompt
   */
  static getScreenshotExtractionPrompt(url) {
    return `You are an expert at extracting contact information from webpage screenshots.

TASK: Analyze the provided screenshot and extract contact information as JSON.

IMPORTANT REQUIREMENTS:
1. ONLY extract text that is clearly visible and readable in the image
2. DO NOT make up or guess information
3. Return valid JSON format only
4. Be conservative - better to miss information than to provide incorrect data
5. Focus on real estate professionals (agents, brokers, property managers)

WHAT TO LOOK FOR:
- Contact sections or "Contact" headers
- Phone numbers (look for patterns like (XXX) XXX-XXXX or XXX-XXX-XXXX)
- Email addresses (look for @ symbols and domain names)
- Names with professional titles (Realtor, Agent, Broker, etc.)
- Company/brokerage names
- Professional descriptions or titles

VISUAL CUES FOR QUALITY:
- Clear, professional layout
- Contact information in prominent sections
- Professional headshots
- Company logos or branding
- Multiple contact methods displayed together
- Professional design and typography

AVOID:
- Blurry or unclear text
- Information that appears to be in advertisements
- Generic website headers/footers
- Social media icons without context
- Partial phone numbers or email addresses

RETURN FORMAT:
{
  "name": "Full Name",
  "company": "Company Name", 
  "phone": "(555) 123-4567",
  "email": "email@example.com",
  "description": "Professional title/description",
  "profileLink": "${url}",
  "confidence": 0.95
}

If no reliable contact information is visible, return:
{
  "name": null,
  "company": null,
  "phone": null,
  "email": null,
  "description": null,
  "profileLink": "${url}",
  "confidence": 0.0
}

Analyze the screenshot and extract contact information:`;
  }

  /**
   * Get enhanced extraction prompt for complex scenarios
   * @param {string} url - Original URL for context
   * @param {Object} options - Additional options for prompt customization
   * @returns {string} - Enhanced extraction prompt
   */
  static getEnhancedExtractionPrompt(url, options = {}) {
    const {
      industry = 'real estate',
      requireMultipleContacts = false,
      confidenceThreshold = 0.7,
      includePartialData = false
    } = options;

    const industryContext = this.getIndustryContext(industry);
    const multipleContactsGuidance = requireMultipleContacts ? 
      'PRIORITY: Look for multiple contact methods (phone AND email preferred)' : 
      'ACCEPTABLE: Single contact method is sufficient if reliable';

    const confidenceGuidance = `CONFIDENCE THRESHOLD: Only return data with confidence >= ${confidenceThreshold}`;

    const partialDataGuidance = includePartialData ? 
      'PARTIAL DATA: Include partial information if clearly visible and reliable' : 
      'COMPLETE DATA: Only include complete, verified information';

    return `You are an expert at extracting contact information with specialized knowledge in ${industry}.

TASK: Extract contact information from the provided content and return a JSON object.

INDUSTRY CONTEXT:
${industryContext}

EXTRACTION REQUIREMENTS:
${multipleContactsGuidance}
${confidenceGuidance}
${partialDataGuidance}

QUALITY ASSESSMENT:
Rate your confidence (0.0-1.0) based on:
- Clarity and completeness of information
- Professional context and presentation
- Multiple verification sources in content
- Industry-specific indicators
- Absence of ambiguous or generic information

ENHANCED VALIDATION:
- Phone numbers: Must be complete and properly formatted
- Email addresses: Must include valid domain extensions
- Names: Must appear to be real person/business names
- Company names: Should be recognizable business entities
- Professional titles: Should match industry standards

RETURN FORMAT:
{
  "name": "Full Name",
  "company": "Company Name",
  "phone": "(555) 123-4567",
  "email": "email@example.com",
  "description": "Professional title/description",
  "profileLink": "${url}",
  "confidence": 0.95,
  "extractionNotes": "Brief note about data quality/source"
}

If confidence is below threshold, return:
{
  "name": null,
  "company": null,
  "phone": null,
  "email": null,
  "description": null,
  "profileLink": "${url}",
  "confidence": 0.0,
  "extractionNotes": "Reason for low confidence"
}

Analyze the content and extract contact information:`;
  }

  /**
   * Get industry-specific context for prompts
   * @param {string} industry - Industry type
   * @returns {string} - Industry context description
   * @private
   */
  static getIndustryContext(industry) {
    const contexts = {
      'real estate': `
REAL ESTATE CONTEXT:
- Look for: Realtors, Real Estate Agents, Brokers, Property Managers
- Common titles: Licensed Realtor, Listing Agent, Buyer's Agent, Broker Associate
- Company types: Realty companies, brokerages, property management firms
- Professional indicators: MLS listings, property details, agent photos
- License information: State licensing numbers, professional certifications`,

      'business': `
BUSINESS CONTEXT:
- Look for: Business owners, executives, sales representatives
- Common titles: CEO, Manager, Director, Sales Representative
- Company types: Various business entities, corporations, partnerships
- Professional indicators: Business cards, company websites, professional profiles`,

      'professional': `
PROFESSIONAL CONTEXT:
- Look for: Licensed professionals, consultants, service providers
- Common titles: Professional certifications, industry-specific roles
- Company types: Professional service firms, consulting companies
- Professional indicators: Certifications, professional memberships, credentials`
    };

    return contexts[industry] || contexts['business'];
  }

  /**
   * Get validation prompt for extracted data
   * @param {Object} extractedData - Previously extracted data
   * @returns {string} - Validation prompt
   */
  static getValidationPrompt(extractedData) {
    return `You are an expert at validating contact information quality.

TASK: Validate the quality and accuracy of the provided contact information.

EXTRACTED DATA TO VALIDATE:
${JSON.stringify(extractedData, null, 2)}

VALIDATION CRITERIA:
1. Name validation:
   - Is it a real person/business name?
   - Does it match professional standards?
   - Is it complete and properly formatted?

2. Phone validation:
   - Is it a complete phone number?
   - Is the format correct (XXX) XXX-XXXX?
   - Does it appear to be a real number?

3. Email validation:
   - Is the format correct (user@domain.com)?
   - Does the domain appear legitimate?
   - Is it a professional email address?

4. Company validation:
   - Is it a recognizable business entity?
   - Does it match the industry context?
   - Is it properly formatted?

5. Overall consistency:
   - Do all fields work together logically?
   - Is the professional context consistent?
   - Are there any red flags or inconsistencies?

RETURN FORMAT:
{
  "isValid": true/false,
  "confidence": 0.95,
  "issues": ["List of any issues found"],
  "recommendations": ["Suggestions for improvement"],
  "qualityScore": 0.95
}

Validate the extracted contact information:`;
  }

  /**
   * Get cleanup prompt for messy extracted data
   * @param {Object} rawData - Raw extracted data
   * @returns {string} - Cleanup prompt
   */
  static getCleanupPrompt(rawData) {
    return `You are an expert at cleaning and formatting contact information.

TASK: Clean and properly format the provided contact information.

RAW DATA TO CLEAN:
${JSON.stringify(rawData, null, 2)}

CLEANUP RULES:
1. Name formatting:
   - Proper capitalization (Title Case)
   - Remove extra spaces or characters
   - Standardize prefixes (Mr., Mrs., Dr., etc.)

2. Phone formatting:
   - Format as (XXX) XXX-XXXX
   - Remove extensions or additional numbers
   - Validate area codes

3. Email formatting:
   - Convert to lowercase
   - Remove spaces or invalid characters
   - Validate domain format

4. Company formatting:
   - Proper capitalization
   - Standard business suffixes (Inc., LLC, etc.)
   - Remove redundant information

5. Description formatting:
   - Professional title format
   - Remove extra punctuation
   - Standardize industry terms

RETURN FORMAT:
{
  "name": "Cleaned Name",
  "company": "Cleaned Company",
  "phone": "(555) 123-4567",
  "email": "cleaned@example.com",
  "description": "Cleaned Description",
  "profileLink": "original_url",
  "confidence": 0.95,
  "cleanupNotes": "What was cleaned/changed"
}

Clean and format the contact information:`;
  }

  /**
   * Get multi-contact extraction prompt for pages with multiple contacts
   * @param {string} url - Original URL for context
   * @returns {string} - Multi-contact extraction prompt
   */
  static getMultiContactExtractionPrompt(url) {
    return `You are an expert at extracting multiple contact information entries from content.

TASK: Extract ALL contact information from the provided content and return an array of JSON objects.

IMPORTANT REQUIREMENTS:
1. Extract each distinct person/business contact separately
2. Ensure each contact has reliable information
3. Avoid duplicate entries for the same person/business
4. Return valid JSON array format
5. Focus on real estate professionals

EXTRACTION RULES:
- Look for multiple agent profiles, team members, or business contacts
- Each contact should have at least a name and one contact method
- Maintain high quality standards for each individual contact
- Associate contact information with the correct person

RETURN FORMAT:
[
  {
    "name": "First Contact Name",
    "company": "Company Name",
    "phone": "(555) 123-4567",
    "email": "email1@example.com",
    "description": "Professional title/description",
    "profileLink": "${url}",
    "confidence": 0.95
  },
  {
    "name": "Second Contact Name",
    "company": "Company Name",
    "phone": "(555) 123-4568",
    "email": "email2@example.com",
    "description": "Professional title/description",
    "profileLink": "${url}",
    "confidence": 0.90
  }
]

If no reliable contacts are found, return:
[]

Analyze the content and extract all contact information:`;
  }

  /**
   * Get contextual prompt based on page content type
   * @param {string} contentType - Type of content (profile, listing, team, etc.)
   * @param {string} url - Original URL for context
   * @returns {string} - Context-specific prompt
   */
  static getContextualPrompt(contentType, url) {
    const prompts = {
      'profile': this.getProfilePagePrompt(url),
      'listing': this.getListingPagePrompt(url),
      'team': this.getTeamPagePrompt(url),
      'contact': this.getContactPagePrompt(url),
      'about': this.getAboutPagePrompt(url),
      'default': this.getHtmlExtractionPrompt(url)
    };

    return prompts[contentType] || prompts['default'];
  }

  /**
   * Get profile page specific prompt
   * @param {string} url - Original URL for context
   * @returns {string} - Profile page prompt
   * @private
   */
  static getProfilePagePrompt(url) {
    return `You are extracting contact information from an individual's profile page.

FOCUS AREAS:
- Personal/professional name and title
- Direct contact methods (phone, email)
- Company/brokerage affiliation
- Professional credentials and experience
- Bio or professional description

PROFILE PAGE INDICATORS:
- Individual headshots or photos
- Personal bio or about section
- Professional achievements or credentials
- Individual contact information (not general company info)

${this.getHtmlExtractionPrompt(url)}`;
  }

  /**
   * Get listing page specific prompt
   * @param {string} url - Original URL for context
   * @returns {string} - Listing page prompt
   * @private
   */
  static getListingPagePrompt(url) {
    return `You are extracting contact information from a property listing page.

FOCUS AREAS:
- Listing agent name and contact info
- Listing office/brokerage information
- Agent phone numbers and email
- Professional titles related to the listing

LISTING PAGE INDICATORS:
- "Listed by" or "Contact Agent" sections
- Agent information alongside property details
- Professional real estate context
- MLS or listing-specific contact info

${this.getHtmlExtractionPrompt(url)}`;
  }

  /**
   * Get team page specific prompt
   * @param {string} url - Original URL for context
   * @returns {string} - Team page prompt
   * @private
   */
  static getTeamPagePrompt(url) {
    return `You are extracting contact information from a team or multiple agent page.

FOCUS AREAS:
- Individual team member names and roles
- Direct contact methods for each person
- Team lead or primary contact information
- Individual professional specialties

TEAM PAGE INDICATORS:
- Multiple professional headshots
- Individual bio sections for team members
- Role-specific contact information
- Team hierarchy or specialization areas

${this.getMultiContactExtractionPrompt(url)}`;
  }

  /**
   * Get contact page specific prompt
   * @param {string} url - Original URL for context
   * @returns {string} - Contact page prompt
   * @private
   */
  static getContactPagePrompt(url) {
    return `You are extracting contact information from a dedicated contact page.

FOCUS AREAS:
- Primary contact person name and details
- Direct phone numbers and email addresses
- Office locations and addresses
- Preferred contact methods and hours

CONTACT PAGE INDICATORS:
- "Contact Us" or "Get In Touch" sections
- Dedicated contact forms with agent info
- Office hours and location information
- Multiple contact methods clearly displayed

${this.getHtmlExtractionPrompt(url)}`;
  }

  /**
   * Get about page specific prompt
   * @param {string} url - Original URL for context
   * @returns {string} - About page prompt
   * @private
   */
  static getAboutPagePrompt(url) {
    return `You are extracting contact information from an about page.

FOCUS AREAS:
- Company or individual background information
- Key personnel names and roles
- Company contact information
- Professional history and credentials

ABOUT PAGE INDICATORS:
- Company history and background
- Key staff or leadership information
- Mission statements with contact context
- Professional credentials and certifications

${this.getHtmlExtractionPrompt(url)}`;
  }
}

export default VisionPrompts;