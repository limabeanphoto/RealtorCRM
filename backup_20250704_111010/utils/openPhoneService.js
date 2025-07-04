// OpenPhone Service
// High-level service functions for OpenPhone integration with CRM

import { PrismaClient } from '@prisma/client';
import OpenPhoneClient from './openPhoneClient';
import { logError, logInfo, logWarning } from './logger';

const prisma = new PrismaClient();

class OpenPhoneService {
  constructor(userId) {
    this.userId = userId;
    this.client = null;
  }
  
  // Initialize client with user's API key
  async initialize() {
    if (this.client) return this.client;
    
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { openPhoneApiKey: true }
    });
    
    if (!user?.openPhoneApiKey) {
      throw new Error('OpenPhone API key not configured for user');
    }
    
    this.client = new OpenPhoneClient(user.openPhoneApiKey);
    return this.client;
  }
  
  // Test user's OpenPhone connection
  async testConnection() {
    try {
      await this.initialize();
      return await this.client.testConnection();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Contact Synchronization
  async syncContactToOpenPhone(contactId) {
    try {
      await this.initialize();
      
      // Get CRM contact
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      });
      
      if (!contact) {
        throw new Error('Contact not found in CRM');
      }
      
      // Create contact in OpenPhone
      const contactData = {
        name: contact.name,
        phoneNumbers: contact.phone ? [contact.phone] : [],
        emails: contact.email ? [contact.email] : [],
        customFields: {
          crmId: contact.id,
          company: contact.company || '',
          notes: contact.notes || ''
        }
      };
      
      const result = await this.client.createContact(contactData);
      
      if (result.success) {
        // Store OpenPhone contact ID in CRM for future reference
        await prisma.contact.update({
          where: { id: contactId },
          data: {
            notes: contact.notes 
              ? `${contact.notes}\n\nOpenPhone ID: ${result.data.id}`
              : `OpenPhone ID: ${result.data.id}`
          }
        });
        
        logInfo('Contact synced to OpenPhone', {
          crmContactId: contactId,
          openPhoneContactId: result.data.id
        });
      }
      
      return result;
    } catch (error) {
      logError('Error syncing contact to OpenPhone', error);
      return { success: false, error: error.message };
    }
  }
  
  async syncAllContactsToOpenPhone() {
    try {
      await this.initialize();
      
      const contacts = await prisma.contact.findMany({
        where: { 
          assignedTo: this.userId,
          phone: { not: null }
        }
      });
      
      const results = {
        total: contacts.length,
        synced: 0,
        failed: 0,
        errors: []
      };
      
      for (const contact of contacts) {
        const result = await this.syncContactToOpenPhone(contact.id);
        if (result.success) {
          results.synced++;
        } else {
          results.failed++;
          results.errors.push({
            contactId: contact.id,
            contactName: contact.name,
            error: result.error
          });
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return { success: true, results };
    } catch (error) {
      logError('Error syncing all contacts to OpenPhone', error);
      return { success: false, error: error.message };
    }
  }
  
  async syncContactsFromOpenPhone() {
    try {
      await this.initialize();
      
      const result = await this.client.getContacts({ limit: 100 });
      
      if (!result.success) {
        return result;
      }
      
      const syncResults = {
        total: result.data.length,
        created: 0,
        updated: 0,
        errors: []
      };
      
      for (const openPhoneContact of result.data) {
        try {
          // Check if contact already exists in CRM
          const phoneNumber = openPhoneContact.phoneNumbers?.[0]?.number;
          const email = openPhoneContact.emails?.[0]?.email;
          
          let existingContact = null;
          
          if (phoneNumber) {
            existingContact = await prisma.contact.findFirst({
              where: { 
                phone: phoneNumber,
                assignedTo: this.userId
              }
            });
          }
          
          if (!existingContact && email) {
            existingContact = await prisma.contact.findFirst({
              where: { 
                email,
                assignedTo: this.userId
              }
            });
          }
          
          const contactData = {
            name: openPhoneContact.name || 'Unknown',
            phone: phoneNumber || '',
            email: email || '',
            company: openPhoneContact.customFields?.company || '',
            notes: openPhoneContact.customFields?.notes || `Synced from OpenPhone ID: ${openPhoneContact.id}`,
            assignedTo: this.userId
          };
          
          if (existingContact) {
            // Update existing contact
            await prisma.contact.update({
              where: { id: existingContact.id },
              data: contactData
            });
            syncResults.updated++;
          } else {
            // Create new contact
            await prisma.contact.create({
              data: contactData
            });
            syncResults.created++;
          }
          
        } catch (error) {
          syncResults.errors.push({
            openPhoneContactId: openPhoneContact.id,
            error: error.message
          });
        }
      }
      
      return { success: true, results: syncResults };
    } catch (error) {
      logError('Error syncing contacts from OpenPhone', error);
      return { success: false, error: error.message };
    }
  }
  
  // Call Logging
  async logCallFromWebhook(webhookData) {
    try {
      const { type, data } = webhookData;
      
      if (type !== 'call.completed') {
        return { success: true, message: 'Not a completed call event' };
      }
      
      const callData = data;
      
      // Only process outbound calls (system-initiated)
      if (callData.direction !== 'outbound') {
        return { success: true, message: 'Not an outbound call, skipping' };
      }
      
      // Find matching pending call using phone number and timestamp
      const callStartTime = new Date(callData.startedAt || callData.createdAt);
      const phoneNumber = callData.to || callData.from;
      
      // Look for pending calls within ±60 seconds of call start time
      const matchingPendingCall = await prisma.pendingCall.findFirst({
        where: {
          phoneNumber: phoneNumber,
          status: 'initiated',
          initiatedAt: {
            gte: new Date(callStartTime.getTime() - 60000), // 60 seconds before
            lte: new Date(callStartTime.getTime() + 60000)  // 60 seconds after
          }
        },
        include: {
          contact: true,
          user: true
        },
        orderBy: {
          initiatedAt: 'desc' // Get the most recent matching call
        }
      });
      
      if (!matchingPendingCall) {
        logWarning('No matching pending call found for webhook', { 
          phoneNumber, 
          callStartTime: callStartTime.toISOString(),
          openPhoneCallId: callData.id 
        });
        return { success: false, error: 'No matching pending call found' };
      }
      
      // Update pending call with OpenPhone call ID and completion status
      await prisma.pendingCall.update({
        where: { id: matchingPendingCall.id },
        data: {
          openPhoneCallId: callData.id,
          status: 'completed',
          completedAt: new Date(callData.endedAt || callData.completedAt || new Date())
        }
      });
      
      // Create call record
      const call = await prisma.call.create({
        data: {
          contactId: matchingPendingCall.contactId,
          userId: matchingPendingCall.userId,
          date: new Date(callData.startedAt || callData.createdAt),
          duration: Math.round((callData.duration || 0) / 60), // Convert seconds to minutes
          notes: `OpenPhone Call ID: ${callData.id}\nPending Call ID: ${matchingPendingCall.id}`,
          outcome: this.determineCallOutcome(callData),
          isDeal: false
        }
      });
      
      // Update contact's last call info
      await prisma.contact.update({
        where: { id: matchingPendingCall.contactId },
        data: {
          lastCallDate: new Date(callData.startedAt || callData.createdAt),
          lastCallOutcome: call.outcome
        }
      });
      
      logInfo('System-initiated call logged from OpenPhone webhook', {
        callId: call.id,
        contactId: matchingPendingCall.contactId,
        openPhoneCallId: callData.id,
        pendingCallId: matchingPendingCall.id,
        duration: callData.duration
      });
      
      return { 
        success: true, 
        data: { 
          call,
          contact: matchingPendingCall.contact,
          pendingCall: matchingPendingCall,
          shouldShowPopup: true // Indicate to show post-call popup
        }
      };
      
    } catch (error) {
      logError('Error logging call from webhook', error);
      return { success: false, error: error.message };
    }
  }
  
  // Helper method to determine call outcome based on OpenPhone data
  determineCallOutcome(callData) {
    const duration = callData.duration || 0;
    
    // Very short calls (< 10 seconds) likely went to voicemail or weren't answered
    if (duration < 10) {
      return 'No Answer / Voicemail';
    }
    
    // Short calls (10-30 seconds) might be brief pickups or quick voicemails
    if (duration < 30) {
      return 'Brief Contact';
    }
    
    // Longer calls indicate actual conversation
    return 'Connected';
  }
  
  async updateCallWithNotes(callId, notes, outcome, isDeal = false) {
    try {
      const call = await prisma.call.update({
        where: { id: callId },
        data: {
          notes: notes || '',
          outcome: outcome || 'Completed',
          isDeal: isDeal
        }
      });
      
      // Update contact's last call outcome
      await prisma.contact.update({
        where: { id: call.contactId },
        data: {
          lastCallOutcome: call.outcome
        }
      });
      
      return { success: true, data: call };
    } catch (error) {
      logError('Error updating call with notes', error);
      return { success: false, error: error.message };
    }
  }
  
  // SMS Integration
  async sendSms(contactId, message) {
    try {
      await this.initialize();
      
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      });
      
      if (!contact || !contact.phone) {
        throw new Error('Contact not found or has no phone number');
      }
      
      const result = await this.client.sendSms({
        to: contact.phone,
        message
      });
      
      if (result.success) {
        // Log SMS as a call/communication record
        await prisma.call.create({
          data: {
            contactId: contactId,
            userId: this.userId,
            date: new Date(),
            duration: 0,
            notes: `SMS: ${message}`,
            outcome: 'SMS Sent',
            isDeal: false
          }
        });
      }
      
      return result;
    } catch (error) {
      logError('Error sending SMS', error);
      return { success: false, error: error.message };
    }
  }
  
  // Click-to-Call
  generateClickToCallUrl(contactId) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.initialize();
        
        const contact = await prisma.contact.findUnique({
          where: { id: contactId }
        });
        
        if (!contact || !contact.phone) {
          reject(new Error('Contact not found or has no phone number'));
          return;
        }
        
        const url = this.client.generateClickToCallUrl(contact.phone);
        
        // Create pending call record for webhook matching
        const pendingCall = await prisma.pendingCall.create({
          data: {
            contactId: contactId,
            userId: this.userId,
            phoneNumber: contact.phone,
            initiatedAt: new Date(),
            status: 'initiated'
          }
        });
        
        logInfo('Pending call created', {
          pendingCallId: pendingCall.id,
          contactId,
          phoneNumber: contact.phone
        });
        
        resolve({ success: true, url, pendingCallId: pendingCall.id });
      } catch (error) {
        logError('Error generating click-to-call URL', error);
        reject({ success: false, error: error.message });
      }
    });
  }
  
  // Get user's call history from OpenPhone
  async getCallHistory(options = {}) {
    try {
      await this.initialize();
      
      const { page = 1, limit = 50, startDate, endDate } = options;
      
      const result = await this.client.getCalls({
        page,
        limit,
        startDate,
        endDate
      });
      
      return result;
    } catch (error) {
      logError('Error getting call history', error);
      return { success: false, error: error.message };
    }
  }
}

export default OpenPhoneService;