// OpenPhone Webhook Handler
// Receives webhooks from OpenPhone for call events, messages, etc.

import OpenPhoneService from '../../../utils/openPhoneService';
import { logError, logInfo, logWarning } from '../../../utils/logger';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }
  
  try {
    // Verify webhook signature (if configured)
    const signature = req.headers['x-openphone-signature'];
    const webhookSecret = process.env.OPENPHONE_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        logWarning('Invalid OpenPhone webhook signature');
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid signature' 
        });
      }
    }
    
    const { type, data, id, apiVersion, createdAt } = req.body;
    
    logInfo('Received OpenPhone webhook', {
      type,
      webhookId: id,
      apiVersion,
      timestamp: createdAt
    });
    
    // Process different webhook types
    switch (type) {
      case 'call.ringing':
        await handleCallRinging(data);
        break;
        
      case 'call.completed':
        await handleCallCompleted(data);
        break;
        
      case 'call.recording.completed':
        await handleCallRecordingCompleted(data);
        break;
        
      case 'message.received':
        await handleMessageReceived(data);
        break;
        
      case 'message.delivered':
        await handleMessageDelivered(data);
        break;
        
      default:
        logInfo('Unhandled webhook type', { type });
    }
    
    // Always respond with success to prevent retries
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed',
      type 
    });
    
  } catch (error) {
    logError('Error processing OpenPhone webhook', error);
    
    // Still return 200 to prevent retries for non-recoverable errors
    res.status(200).json({ 
      success: false, 
      message: 'Webhook processing failed',
      error: error.message 
    });
  }
}

async function handleCallRinging(callData) {
  logInfo('Call ringing', {
    callId: callData.id,
    direction: callData.direction,
    from: callData.from,
    to: callData.to
  });
  
  // Could implement real-time notifications here
  // For now, just log the event
}

async function handleCallCompleted(callData) {
  try {
    logInfo('Call completed', {
      callId: callData.id,
      direction: callData.direction,
      duration: callData.duration,
      from: callData.from,
      to: callData.to
    });
    
    // Find the user by matching phone numbers or using a mapping
    const phoneNumber = callData.to || callData.from;
    
    // Try to find user by assigned call number or by finding contacts
    let userId = null;
    
    // First, try to find user by their assigned OpenPhone number
    const userByNumber = await prisma.user.findFirst({
      where: {
        assignedCallNumber: phoneNumber,
        openPhoneApiKey: { not: null }
      }
    });
    
    if (userByNumber) {
      userId = userByNumber.id;
    } else {
      // Try to find user through their contacts
      const contact = await prisma.contact.findFirst({
        where: {
          phone: callData.direction === 'inbound' ? callData.from : callData.to,
          assignedTo: { not: null }
        },
        include: {
          assignedToUser: {
            select: {
              id: true,
              openPhoneApiKey: true
            }
          }
        }
      });
      
      if (contact?.assignedToUser?.openPhoneApiKey) {
        userId = contact.assignedTo;
      }
    }
    
    if (!userId) {
      logWarning('Could not determine user for call', { 
        callId: callData.id, 
        phoneNumber 
      });
      return;
    }
    
    // Use OpenPhone service to log the call
    const openPhoneService = new OpenPhoneService(userId);
    const result = await openPhoneService.logCallFromWebhook({
      type: 'call.completed',
      data: callData
    });
    
    if (result.success && result.data?.shouldShowPopup) {
      // Could trigger real-time notification to user's browser here
      logInfo('Call logged successfully, popup should be shown', {
        callId: result.data.call.id,
        contactId: result.data.contact.id
      });
    }
    
  } catch (error) {
    logError('Error handling call completed webhook', error);
  }
}

async function handleCallRecordingCompleted(callData) {
  logInfo('Call recording completed', {
    callId: callData.id,
    recordingUrl: callData.recordingUrl
  });
  
  // Could store recording URL in call record
  try {
    // Find the call in our database
    const call = await prisma.call.findFirst({
      where: {
        notes: {
          contains: callData.id // Find by OpenPhone call ID in notes
        }
      }
    });
    
    if (call) {
      await prisma.call.update({
        where: { id: call.id },
        data: {
          notes: `${call.notes}\nRecording: ${callData.recordingUrl}`
        }
      });
    }
  } catch (error) {
    logError('Error updating call with recording URL', error);
  }
}

async function handleMessageReceived(messageData) {
  logInfo('Message received', {
    messageId: messageData.id,
    from: messageData.from,
    to: messageData.to,
    text: messageData.text?.substring(0, 100) + '...' // Log first 100 chars
  });
  
  // Could log as communication record in CRM
  try {
    // Find user and contact similar to call handling
    const contact = await prisma.contact.findFirst({
      where: {
        phone: messageData.from,
        assignedTo: { not: null }
      }
    });
    
    if (contact) {
      await prisma.call.create({
        data: {
          contactId: contact.id,
          userId: contact.assignedTo,
          date: new Date(messageData.createdAt),
          duration: 0,
          notes: `SMS Received: ${messageData.text}`,
          outcome: 'SMS Received',
          isDeal: false
        }
      });
    }
  } catch (error) {
    logError('Error logging received message', error);
  }
}

async function handleMessageDelivered(messageData) {
  logInfo('Message delivered', {
    messageId: messageData.id,
    to: messageData.to
  });
  
  // Could update message status in CRM
}