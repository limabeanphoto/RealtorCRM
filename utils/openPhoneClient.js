// OpenPhone API Client
// Handles all interactions with the OpenPhone API

import axios from 'axios';
import { logError, logInfo } from './logger';

class OpenPhoneClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenPhone API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openphone.com/v1';
    
    // Create axios instance with defaults
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }
  
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      logError('OpenPhone API Error', null, {
        status,
        message: data?.message || 'Unknown error',
        endpoint: error.config?.url,
        method: error.config?.method?.toUpperCase()
      });
      
      // Handle specific error codes
      switch (status) {
        case 401:
          throw new Error('Invalid OpenPhone API key');
        case 403:
          throw new Error('OpenPhone API access forbidden');
        case 429:
          throw new Error('OpenPhone API rate limit exceeded');
        case 500:
          throw new Error('OpenPhone API server error');
        default:
          throw new Error(data?.message || `OpenPhone API error: ${status}`);
      }
    } else if (error.request) {
      logError('OpenPhone API Network Error', error);
      throw new Error('Unable to connect to OpenPhone API');
    } else {
      logError('OpenPhone Client Error', error);
      throw new Error('OpenPhone client error');
    }
  }
  
  // Test API connection
  async testConnection() {
    try {
      const response = await this.client.get('/user');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Contact Management
  async getContacts(options = {}) {
    const { page = 1, limit = 50 } = options;
    
    try {
      const response = await this.client.get('/contacts', {
        params: { page, limit }
      });
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createContact(contactData) {
    const { name, phoneNumbers = [], emails = [], customFields = {} } = contactData;
    
    if (!name) {
      throw new Error('Contact name is required');
    }
    
    try {
      const response = await this.client.post('/contacts', {
        name,
        phoneNumbers: phoneNumbers.map(phone => ({
          number: this.formatPhoneNumber(phone),
          type: 'mobile'
        })),
        emails: emails.map(email => ({ email, type: 'work' })),
        customFields
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async updateContact(contactId, updates) {
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    try {
      const response = await this.client.patch(`/contacts/${contactId}`, updates);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async deleteContact(contactId) {
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    try {
      await this.client.delete(`/contacts/${contactId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Call Management
  async getCalls(options = {}) {
    const { page = 1, limit = 50, startDate, endDate } = options;
    
    try {
      const params = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await this.client.get('/calls', { params });
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getCallDetails(callId) {
    if (!callId) {
      throw new Error('Call ID is required');
    }
    
    try {
      const response = await this.client.get(`/calls/${callId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getCallSummary(callId) {
    if (!callId) {
      throw new Error('Call ID is required');
    }
    
    try {
      const response = await this.client.get(`/calls/${callId}/summary`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getCallTranscript(callId) {
    if (!callId) {
      throw new Error('Call ID is required');
    }
    
    try {
      const response = await this.client.get(`/calls/${callId}/transcript`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // SMS/Messaging
  async sendSms(options) {
    const { to, message, phoneNumberId } = options;
    
    if (!to || !message) {
      throw new Error('Recipient phone number and message are required');
    }
    
    try {
      const response = await this.client.post('/messages', {
        to: this.formatPhoneNumber(to),
        text: message,
        phoneNumberId
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getMessages(options = {}) {
    const { page = 1, limit = 50, phoneNumber } = options;
    
    try {
      const params = { page, limit };
      if (phoneNumber) params.phoneNumber = this.formatPhoneNumber(phoneNumber);
      
      const response = await this.client.get('/messages', { params });
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {}
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Webhook Management
  async createWebhook(webhookData) {
    const { url, events = [], secret } = webhookData;
    
    if (!url) {
      throw new Error('Webhook URL is required');
    }
    
    try {
      const response = await this.client.post('/webhooks', {
        url,
        events,
        secret
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getWebhooks() {
    try {
      const response = await this.client.get('/webhooks');
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async deleteWebhook(webhookId) {
    if (!webhookId) {
      throw new Error('Webhook ID is required');
    }
    
    try {
      await this.client.delete(`/webhooks/${webhookId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Utility methods
  formatPhoneNumber(phone) {
    if (!phone) return phone;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Add +1 for US numbers if not present
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // Return as-is if already formatted or international
    return phone.startsWith('+') ? phone : `+${digits}`;
  }
  
  generateClickToCallUrl(phoneNumber, phoneNumberId = null) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    
    if (phoneNumberId) {
      return `openphone://call?number=${encodeURIComponent(formattedNumber)}&phoneNumberId=${phoneNumberId}`;
    }
    
    return `openphone://call?number=${encodeURIComponent(formattedNumber)}`;
  }
}

export default OpenPhoneClient;