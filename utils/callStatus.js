// Call Status Management Utility
// Centralizes call status definitions, styling, and business logic

import { FaPhone, FaPhoneSlash, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSms, FaVoicemail, FaRedo, FaEye, FaEdit, FaUserPlus, FaCalendarPlus, FaComments } from 'react-icons/fa';
import theme from '../styles/theme';

// Standardized Call Status Definitions
export const CALL_STATUSES = {
  // CRM Call Outcomes
  'No Answer': {
    id: 'no_answer',
    label: 'No Answer',
    description: 'Call was not answered',
    color: theme.colors.warning[500],
    backgroundColor: theme.colors.warning[50],
    borderColor: theme.colors.warning[200],
    icon: FaPhoneSlash,
    category: 'incomplete',
    priority: 1,
    followUpRequired: true
  },
  'Follow Up': {
    id: 'follow_up',
    label: 'Follow Up',
    description: 'Requires follow-up action',
    color: theme.colors.info[500],
    backgroundColor: theme.colors.info[50],
    borderColor: theme.colors.info[200],
    icon: FaRedo,
    category: 'incomplete',
    priority: 2,
    followUpRequired: true
  },
  'Deal Closed': {
    id: 'deal_closed',
    label: 'Deal Closed',
    description: 'Call resulted in closed deal',
    color: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
    borderColor: theme.colors.success[200],
    icon: FaCheckCircle,
    category: 'success',
    priority: 5,
    followUpRequired: false
  },
  'Not Interested': {
    id: 'not_interested',
    label: 'Not Interested',
    description: 'Contact not interested',
    color: theme.colors.error[500],
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
    icon: FaTimesCircle,
    category: 'closed',
    priority: 0,
    followUpRequired: false
  },
  
  // OpenPhone Call Outcomes
  'No Answer / Voicemail': {
    id: 'no_answer_voicemail',
    label: 'No Answer / Voicemail',
    description: 'Call went to voicemail',
    color: theme.colors.warning[600],
    backgroundColor: theme.colors.warning[50],
    borderColor: theme.colors.warning[200],
    icon: FaVoicemail,
    category: 'incomplete',
    priority: 1,
    followUpRequired: true
  },
  'Brief Contact': {
    id: 'brief_contact',
    label: 'Brief Contact',
    description: 'Short contact made',
    color: theme.colors.info[400],
    backgroundColor: theme.colors.info[50],
    borderColor: theme.colors.info[200],
    icon: FaPhone,
    category: 'partial',
    priority: 3,
    followUpRequired: true
  },
  'Connected': {
    id: 'connected',
    label: 'Connected',
    description: 'Call connected successfully',
    color: theme.colors.success[400],
    backgroundColor: theme.colors.success[50],
    borderColor: theme.colors.success[200],
    icon: FaPhone,
    category: 'success',
    priority: 4,
    followUpRequired: false
  },
  'Completed': {
    id: 'completed',
    label: 'Completed',
    description: 'Call completed successfully',
    color: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
    borderColor: theme.colors.success[200],
    icon: FaCheckCircle,
    category: 'success',
    priority: 4,
    followUpRequired: false
  },
  'SMS Sent': {
    id: 'sms_sent',
    label: 'SMS Sent',
    description: 'SMS message sent',
    color: theme.colors.accent[500],
    backgroundColor: theme.colors.accent[50],
    borderColor: theme.colors.accent[200],
    icon: FaSms,
    category: 'communication',
    priority: 3,
    followUpRequired: false
  },
  'SMS Received': {
    id: 'sms_received',
    label: 'SMS Received',
    description: 'SMS message received',
    color: theme.colors.accent[600],
    backgroundColor: theme.colors.accent[50],
    borderColor: theme.colors.accent[200],
    icon: FaSms,
    category: 'communication',
    priority: 3,
    followUpRequired: false
  }
};

// Contact Status Options
export const CONTACT_STATUSES = {
  'Open': {
    id: 'open',
    label: 'Open',
    description: 'New lead, needs qualification',
    color: theme.colors.info[500],
    backgroundColor: theme.colors.info[50],
    borderColor: theme.colors.info[200],
    priority: 1
  },
  'In Progress': {
    id: 'in_progress',
    label: 'In Progress',
    description: 'Actively working with contact',
    color: theme.colors.warning[500],
    backgroundColor: theme.colors.warning[50],
    borderColor: theme.colors.warning[200],
    priority: 2
  },
  'Qualified': {
    id: 'qualified',
    label: 'Qualified',
    description: 'Contact is qualified prospect',
    color: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
    borderColor: theme.colors.success[200],
    priority: 3
  },
  'Not Qualified': {
    id: 'not_qualified',
    label: 'Not Qualified',
    description: 'Contact does not meet criteria',
    color: theme.colors.error[500],
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
    priority: 0
  },
  'Closed': {
    id: 'closed',
    label: 'Closed',
    description: 'Deal closed or contact inactive',
    color: theme.colors.neutral[500],
    backgroundColor: theme.colors.neutral[50],
    borderColor: theme.colors.neutral[200],
    priority: 0
  }
};

// Quick Action Definitions
export const QUICK_ACTIONS = {
  'call_back': {
    id: 'call_back',
    label: 'Call Back',
    description: 'Initiate callback via OpenPhone',
    icon: FaPhone,
    color: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
    requiresContact: true,
    requiresPhone: true
  },
  'create_task': {
    id: 'create_task',
    label: 'Create Task',
    description: 'Create follow-up task',
    icon: FaCalendarPlus,
    color: theme.colors.info[500],
    backgroundColor: theme.colors.info[50],
    requiresContact: false,
    requiresPhone: false
  },
  'send_sms': {
    id: 'send_sms',
    label: 'Send SMS',
    description: 'Send SMS message',
    icon: FaSms,
    color: theme.colors.accent[500],
    backgroundColor: theme.colors.accent[50],
    requiresContact: true,
    requiresPhone: true
  },
  'edit_call': {
    id: 'edit_call',
    label: 'Edit Call',
    description: 'Edit call details',
    icon: FaEdit,
    color: theme.colors.neutral[500],
    backgroundColor: theme.colors.neutral[50],
    requiresContact: false,
    requiresPhone: false
  },
  'view_contact': {
    id: 'view_contact',
    label: 'View Contact',
    description: 'View contact details',
    icon: FaEye,
    color: theme.colors.neutral[500],
    backgroundColor: theme.colors.neutral[50],
    requiresContact: true,
    requiresPhone: false
  },
  'update_contact': {
    id: 'update_contact',
    label: 'Update Contact',
    description: 'Update contact information',
    icon: FaUserPlus,
    color: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
    requiresContact: true,
    requiresPhone: false
  },
  'add_note': {
    id: 'add_note',
    label: 'Add Note',
    description: 'Add note to contact',
    icon: FaComments,
    color: theme.colors.warning[500],
    backgroundColor: theme.colors.warning[50],
    requiresContact: true,
    requiresPhone: false
  }
};

// Helper Functions
export const getStatusConfig = (status) => {
  return CALL_STATUSES[status] || {
    id: 'unknown',
    label: status || 'Unknown',
    description: 'Unknown status',
    color: theme.colors.neutral[500],
    backgroundColor: theme.colors.neutral[50],
    borderColor: theme.colors.neutral[200],
    icon: FaExclamationTriangle,
    category: 'unknown',
    priority: 0,
    followUpRequired: false
  };
};

export const getContactStatusConfig = (status) => {
  return CONTACT_STATUSES[status] || {
    id: 'unknown',
    label: status || 'Unknown',
    description: 'Unknown status',
    color: theme.colors.neutral[500],
    backgroundColor: theme.colors.neutral[50],
    borderColor: theme.colors.neutral[200],
    priority: 0
  };
};

export const getQuickActionConfig = (actionId) => {
  return QUICK_ACTIONS[actionId] || null;
};

// Status Change Business Logic
export const handleStatusChange = async (oldStatus, newStatus, callData, contactData) => {
  const actions = [];
  const oldConfig = getStatusConfig(oldStatus);
  const newConfig = getStatusConfig(newStatus);

  // Auto-create follow-up tasks for certain status changes
  if (newConfig.followUpRequired && !oldConfig.followUpRequired) {
    actions.push({
      type: 'create_task',
      data: {
        title: `Follow up on ${newConfig.label.toLowerCase()} call`,
        description: `Follow up with ${contactData?.name || 'contact'} regarding ${newConfig.description.toLowerCase()}`,
        contactId: contactData?.id,
        callId: callData?.id,
        dueDate: getDefaultFollowUpDate(newStatus),
        priority: 'High'
      }
    });
  }

  // Update contact status based on call outcome
  if (newStatus === 'Deal Closed' && contactData?.status !== 'Closed') {
    actions.push({
      type: 'update_contact_status',
      data: {
        contactId: contactData?.id,
        newStatus: 'Closed'
      }
    });
  }

  if (newStatus === 'Not Interested' && contactData?.status !== 'Not Qualified') {
    actions.push({
      type: 'update_contact_status',
      data: {
        contactId: contactData?.id,
        newStatus: 'Not Qualified'
      }
    });
  }

  if ((newStatus === 'Connected' || newStatus === 'Completed') && contactData?.status === 'Open') {
    actions.push({
      type: 'update_contact_status',
      data: {
        contactId: contactData?.id,
        newStatus: 'In Progress'
      }
    });
  }

  return actions;
};

// Helper function to get default follow-up date based on status
export const getDefaultFollowUpDate = (status) => {
  const now = new Date();
  const config = getStatusConfig(status);
  
  switch (config.category) {
    case 'incomplete':
      // Follow up within 24 hours for incomplete calls
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'partial':
      // Follow up within 3 days for partial contacts
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    default:
      // Default to 1 week
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
};

// Execute status change actions
export const executeStatusChangeActions = async (actions) => {
  const results = [];
  
  for (const action of actions) {
    try {
      let result;
      
      switch (action.type) {
        case 'create_task':
          result = await createFollowUpTask(action.data);
          break;
        case 'update_contact_status':
          result = await updateContactStatus(action.data);
          break;
        default:
          result = { success: false, error: `Unknown action type: ${action.type}` };
      }
      
      results.push({ ...action, result });
    } catch (error) {
      results.push({ ...action, result: { success: false, error: error.message } });
    }
  }
  
  return results;
};

// Create follow-up task
const createFollowUpTask = async (taskData) => {
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error('Failed to create follow-up task');
    }

    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update contact status
const updateContactStatus = async ({ contactId, newStatus }) => {
  try {
    const response = await fetch(`/api/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('Failed to update contact status');
    }

    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sort statuses by priority (highest first)
export const sortStatusesByPriority = (statuses) => {
  return statuses.sort((a, b) => {
    const configA = getStatusConfig(a);
    const configB = getStatusConfig(b);
    return configB.priority - configA.priority;
  });
};

// Get status styles for consistent theming
export const getStatusStyles = (status, variant = 'badge') => {
  const config = getStatusConfig(status);
  
  const baseStyles = {
    color: config.color,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
  };

  switch (variant) {
    case 'badge':
      return {
        ...baseStyles,
        padding: '0.25rem 0.5rem',
        borderRadius: theme.borderRadius.sm,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        border: `1px solid ${config.borderColor}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      };
    case 'indicator':
      return {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: config.color,
        display: 'inline-block',
        marginRight: '0.5rem'
      };
    case 'button':
      return {
        ...baseStyles,
        padding: '0.375rem 0.75rem',
        borderRadius: theme.borderRadius.md,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        border: `1px solid ${config.borderColor}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: config.color,
          color: 'white',
          transform: 'translateY(-1px)'
        }
      };
    case 'dropdown':
      return {
        ...baseStyles,
        padding: '0.5rem 0.75rem',
        borderRadius: theme.borderRadius.md,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.normal,
        border: `1px solid ${config.borderColor}`,
        minWidth: '120px',
        cursor: 'pointer'
      };
    default:
      return baseStyles;
  }
};

// Get available statuses for dropdown
export const getCallStatusOptions = () => {
  return Object.keys(CALL_STATUSES).map(status => ({
    value: status,
    label: CALL_STATUSES[status].label,
    config: CALL_STATUSES[status]
  }));
};

export const getContactStatusOptions = () => {
  return Object.keys(CONTACT_STATUSES).map(status => ({
    value: status,
    label: CONTACT_STATUSES[status].label,
    config: CONTACT_STATUSES[status]
  }));
};

// Validation functions
export const isValidCallStatus = (status) => {
  return Object.keys(CALL_STATUSES).includes(status);
};

export const isValidContactStatus = (status) => {
  return Object.keys(CONTACT_STATUSES).includes(status);
};

// Get status category (for filtering/grouping)
export const getStatusCategory = (status) => {
  return getStatusConfig(status).category;
};

// Check if status requires follow-up
export const requiresFollowUp = (status) => {
  return getStatusConfig(status).followUpRequired;
};

export default {
  CALL_STATUSES,
  CONTACT_STATUSES,
  QUICK_ACTIONS,
  getStatusConfig,
  getContactStatusConfig,
  getQuickActionConfig,
  handleStatusChange,
  executeStatusChangeActions,
  getDefaultFollowUpDate,
  sortStatusesByPriority,
  getStatusStyles,
  getCallStatusOptions,
  getContactStatusOptions,
  isValidCallStatus,
  isValidContactStatus,
  getStatusCategory,
  requiresFollowUp
};