// OpenPhone API Endpoints
// Handles OpenPhone operations for authenticated users

import OpenPhoneService from '../../utils/openPhoneService';
import withAuth from '../../utils/withAuth';
import { logError, logInfo } from '../../utils/logger';

async function handler(req, res) {
  const { action } = req.query;
  const userId = req.user.id;
  
  try {
    const openPhoneService = new OpenPhoneService(userId);
    
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, openPhoneService, action);
        break;
        
      case 'POST':
        await handlePost(req, res, openPhoneService, action);
        break;
        
      case 'PUT':
        await handlePut(req, res, openPhoneService, action);
        break;
        
      default:
        return res.status(405).json({ 
          success: false, 
          message: `Method ${req.method} not allowed` 
        });
    }
  } catch (error) {
    logError('OpenPhone API error', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

async function handleGet(req, res, openPhoneService, action) {
  switch (action) {
    case 'test-connection':
      const connectionResult = await openPhoneService.testConnection();
      return res.status(200).json(connectionResult);
      
    case 'call-history':
      const { page, limit, startDate, endDate } = req.query;
      const historyResult = await openPhoneService.getCallHistory({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        startDate,
        endDate
      });
      return res.status(200).json(historyResult);
      
    case 'click-to-call':
      const { contactId } = req.query;
      if (!contactId) {
        return res.status(400).json({
          success: false,
          message: 'Contact ID is required'
        });
      }
      
      try {
        const callResult = await openPhoneService.generateClickToCallUrl(contactId);
        return res.status(200).json(callResult);
      } catch (error) {
        return res.status(400).json(error);
      }
      
    default:
      return res.status(400).json({
        success: false,
        message: `Unknown action: ${action}`
      });
  }
}

async function handlePost(req, res, openPhoneService, action) {
  switch (action) {
    case 'sync-contacts-to-openphone':
      const syncToResult = await openPhoneService.syncAllContactsToOpenPhone();
      return res.status(200).json(syncToResult);
      
    case 'sync-contacts-from-openphone':
      const syncFromResult = await openPhoneService.syncContactsFromOpenPhone();
      return res.status(200).json(syncFromResult);
      
    case 'sync-contact':
      const { contactId } = req.body;
      if (!contactId) {
        return res.status(400).json({
          success: false,
          message: 'Contact ID is required'
        });
      }
      
      const syncResult = await openPhoneService.syncContactToOpenPhone(contactId);
      return res.status(200).json(syncResult);
      
    case 'send-sms':
      const { contactId: smsContactId, message } = req.body;
      if (!smsContactId || !message) {
        return res.status(400).json({
          success: false,
          message: 'Contact ID and message are required'
        });
      }
      
      const smsResult = await openPhoneService.sendSms(smsContactId, message);
      return res.status(200).json(smsResult);
      
    case 'setup-webhooks':
      await setupWebhooks(req, res, openPhoneService);
      break;
      
    default:
      return res.status(400).json({
        success: false,
        message: `Unknown action: ${action}`
      });
  }
}

async function handlePut(req, res, openPhoneService, action) {
  switch (action) {
    case 'update-call-notes':
      const { callId, notes, outcome, isDeal } = req.body;
      if (!callId) {
        return res.status(400).json({
          success: false,
          message: 'Call ID is required'
        });
      }
      
      const updateResult = await openPhoneService.updateCallWithNotes(
        callId, 
        notes, 
        outcome, 
        isDeal
      );
      return res.status(200).json(updateResult);
      
    default:
      return res.status(400).json({
        success: false,
        message: `Unknown action: ${action}`
      });
  }
}

async function setupWebhooks(req, res, openPhoneService) {
  try {
    await openPhoneService.initialize();
    
    // Get current domain for webhook URL
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const webhookUrl = `${protocol}://${host}/api/webhooks/openphone`;
    
    // Define events we want to listen to
    const events = [
      'call.ringing',
      'call.completed',
      'call.recording.completed',
      'message.received',
      'message.delivered'
    ];
    
    // Create webhook
    const webhookResult = await openPhoneService.client.createWebhook({
      url: webhookUrl,
      events,
      secret: process.env.OPENPHONE_WEBHOOK_SECRET || 'your-webhook-secret'
    });
    
    if (webhookResult.success) {
      logInfo('Webhook created successfully', {
        webhookId: webhookResult.data.id,
        url: webhookUrl,
        events
      });
    }
    
    return res.status(200).json({
      success: webhookResult.success,
      message: webhookResult.success 
        ? 'Webhooks configured successfully' 
        : 'Failed to configure webhooks',
      data: webhookResult.data,
      error: webhookResult.error
    });
    
  } catch (error) {
    logError('Error setting up webhooks', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to setup webhooks',
      error: error.message
    });
  }
}

export default withAuth(handler);