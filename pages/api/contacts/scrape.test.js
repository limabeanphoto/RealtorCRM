// pages/api/contacts/scrape.test.js
import axios from 'axios';
import { handler, isValidRealtorUrl, scrapeRealtorProfile } from './scrape';

// Mock axios for testing
jest.mock('axios');

describe('Contact Scraping API', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidRealtorUrl', () => {
    it('should return true for valid Realtor.com profile URLs', () => {
      expect(isValidRealtorUrl('https://www.realtor.com/realestateagents/5792866a7aeef201007a036e')).toBe(true);
      expect(isValidRealtorUrl('http://realtor.com/realestateagents/5792866a7aeef201007a036e')).toBe(true);
    });

    it('should return false for non-Realtor.com URLs', () => {
      expect(isValidRealtorUrl('https://example.com/profile')).toBe(false);
    });

    it('should return false for Realtor.com URLs that are not profile pages', () => {
      expect(isValidRealtorUrl('https://www.realtor.com/realestateandhomes-search/')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidRealtorUrl('not-a-url')).toBe(false);
    });
  });

  describe('scrapeRealtorProfile', () => {
    it('should extract contact information from HTML', async () => {
      // Mock successful response with sample HTML
      const mockHtml = `
        <html>
          <body>
            <h1 data-testid="agent-name">John Doe</h1>
            <div class="agent-company">XYZ Realty</div>
            <a href="tel:555-123-4567">555-123-4567</a>
            <a href="mailto:john@example.com">john@example.com</a>
          </body>
        </html>
      `;

      axios.get.mockResolvedValue({
        status: 200,
        data: mockHtml
      });

      const result = await scrapeRealtorProfile('https://www.realtor.com/realestateagents/12345');

      expect(result).toEqual({
        name: 'John Doe',
        company: 'XYZ Realty',
        phone: '555-123-4567',
        email: 'john@example.com',
        profileLink: 'https://www.realtor.com/realestateagents/12345'
      });

      // Verify ScraperAPI was called correctly
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('api.scraperapi.com'),
        expect.any(Object)
      );
    });

    it('should handle missing fields gracefully', async () => {
      // Mock HTML with only name and phone (minimum required fields)
      const mockHtml = `
        <html>
          <body>
            <h1>Jane Doe</h1>
            <div class="phone-number">555-987-6543</div>
          </body>
        </html>
      `;

      axios.get.mockResolvedValue({
        status: 200,
        data: mockHtml
      });

      const result = await scrapeRealtorProfile('https://www.realtor.com/realestateagents/67890');

      expect(result).toEqual({
        name: 'Jane Doe',
        company: '',
        phone: '555-987-6543',
        email: '',
        profileLink: 'https://www.realtor.com/realestateagents/67890'
      });
    });

    it('should throw an error when ScraperAPI returns non-200 status', async () => {
      axios.get.mockResolvedValue({
        status: 404,
        data: 'Not Found'
      });

      await expect(scrapeRealtorProfile('https://www.realtor.com/realestateagents/12345'))
        .rejects
        .toThrow('ScraperAPI returned status: 404');
    });

    it('should throw an error when ScraperAPI request fails', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(scrapeRealtorProfile('https://www.realtor.com/realestateagents/12345'))
        .rejects
        .toThrow('ScraperAPI error: Network error');
    });
  });

  describe('API handler', () => {
    const mockReq = {
      method: 'POST',
      body: {
        url: 'https://www.realtor.com/realestateagents/12345'
      }
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    it('should return 405 for non-POST requests', async () => {
      const req = { ...mockReq, method: 'GET' };
      
      await handler(req, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Method GET not allowed'
      });
    });

    it('should return 400 if URL is missing', async () => {
      const req = { ...mockReq, body: {} };
      
      await handler(req, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'URL is required'
      });
    });

    it('should return 400 if URL is invalid', async () => {
      const req = { ...mockReq, body: { url: 'https://example.com' } };
      
      await handler(req, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid URL. Only Realtor.com profile URLs are supported at this time.'
      });
    });

    it('should return 200 with contact info for valid URL', async () => {
      // Mock the scrapeRealtorProfile function
      jest.spyOn(global, 'scrapeRealtorProfile').mockImplementation(() => Promise.resolve({
        name: 'John Doe',
        company: 'XYZ Realty',
        phone: '555-123-4567',
        email: 'john@example.com',
        profileLink: 'https://www.realtor.com/realestateagents/12345'
      }));
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          name: 'John Doe',
          company: 'XYZ Realty',
          phone: '555-123-4567',
          email: 'john@example.com',
          profileLink: 'https://www.realtor.com/realestateagents/12345'
        }
      });
    });

    it('should return 400 if required fields are missing', async () => {
      // Mock missing phone number
      jest.spyOn(global, 'scrapeRealtorProfile').mockImplementation(() => Promise.resolve({
        name: 'John Doe',
        company: 'XYZ Realty',
        phone: '',
        email: 'john@example.com',
        profileLink: 'https://www.realtor.com/realestateagents/12345'
      }));
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Profile missing required information (name and phone)'
      });
    });

    it('should return 500 when scraping throws an error', async () => {
      jest.spyOn(global, 'scrapeRealtorProfile').mockImplementation(() => {
        throw new Error('Scraping failed');
      });
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error scraping contact information: Scraping failed'
      });
    });
  });
});