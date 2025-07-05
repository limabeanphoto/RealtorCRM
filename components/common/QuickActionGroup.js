// Quick Action Group Component
// Groups multiple quick actions with consistent spacing and layout

import React from 'react';
import QuickActionButton from './QuickActionButton';
import { getQuickActionConfig } from '../../utils/callStatus';
import theme from '../../styles/theme';

const QuickActionGroup = ({ 
  actions = [],
  onActionClick,
  contactData = null,
  callData = null,
  size = 'medium',
  variant = 'outline',
  orientation = 'horizontal',
  wrap = false,
  className = '',
  ...props 
}) => {
  // Handle individual action clicks
  const handleActionClick = async (actionId, data) => {
    if (onActionClick) {
      await onActionClick(actionId, data);
    } else {
      // Default action handlers
      await handleDefaultAction(actionId, data);
    }
  };

  // Default action handlers
  const handleDefaultAction = async (actionId, { contactData, callData }) => {
    switch (actionId) {
      case 'call_back':
        await handleCallBack(contactData);
        break;
      case 'send_sms':
        await handleSendSMS(contactData);
        break;
      case 'create_task':
        await handleCreateTask(contactData, callData);
        break;
      case 'edit_call':
        await handleEditCall(callData);
        break;
      case 'view_contact':
        await handleViewContact(contactData);
        break;
      case 'update_contact':
        await handleUpdateContact(contactData);
        break;
      case 'add_note':
        await handleAddNote(contactData);
        break;
      default:
        console.warn(`No default handler for action: ${actionId}`);
    }
  };

  // Default action implementations
  const handleCallBack = async (contactData) => {
    if (!contactData?.phone) {
      alert('Contact phone number is required for callback');
      return;
    }

    try {
      const response = await fetch(`/api/openphone?action=click-to-call&contactId=${contactData.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to initiate callback');
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        throw new Error(result.message || 'Failed to generate callback URL');
      }
    } catch (error) {
      console.error('Error initiating callback:', error);
      alert('Failed to initiate callback. Please try again.');
    }
  };

  const handleSendSMS = async (contactData) => {
    if (!contactData?.phone) {
      alert('Contact phone number is required for SMS');
      return;
    }

    const message = prompt('Enter SMS message:');
    if (!message) return;

    try {
      const response = await fetch('/api/openphone?action=send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          contactId: contactData.id,
          message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      const result = await response.json();
      
      if (result.success) {
        alert('SMS sent successfully');
      } else {
        throw new Error(result.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS. Please try again.');
    }
  };

  const handleCreateTask = async (contactData, callData) => {
    // This would typically open a task creation modal
    // For now, we'll create a basic follow-up task
    const title = prompt('Enter task title:', 'Follow up call');
    if (!title) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          description: `Follow up task for ${contactData?.name || 'contact'}`,
          contactId: contactData?.id || null,
          callId: callData?.id || null,
          dueDate: tomorrow.toISOString(),
          status: 'Active',
          priority: 'Medium'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      alert('Follow-up task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const handleEditCall = async (callData) => {
    // This would typically open a call editing modal
    console.log('Edit call:', callData);
    alert('Call editing feature coming soon!');
  };

  const handleViewContact = async (contactData) => {
    // This would typically open a contact details modal or navigate to contact page
    console.log('View contact:', contactData);
    alert('Contact viewing feature coming soon!');
  };

  const handleUpdateContact = async (contactData) => {
    // This would typically open a contact editing modal
    console.log('Update contact:', contactData);
    alert('Contact updating feature coming soon!');
  };

  const handleAddNote = async (contactData) => {
    if (!contactData) {
      alert('Contact data is required to add notes');
      return;
    }

    const note = prompt('Enter note:');
    if (!note) return;

    try {
      const response = await fetch(`/api/contacts/${contactData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          notes: contactData.notes ? `${contactData.notes}\n\n${new Date().toLocaleString()}: ${note}` : `${new Date().toLocaleString()}: ${note}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      alert('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  // Filter out invalid actions
  const validActions = actions.filter(action => {
    const config = getQuickActionConfig(action);
    return config !== null;
  });

  if (validActions.length === 0) {
    return null;
  }

  const containerStyle = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: theme.spacing[2],
    flexWrap: wrap ? 'wrap' : 'nowrap',
    alignItems: orientation === 'horizontal' ? 'center' : 'stretch'
  };

  return (
    <div className={className} style={containerStyle} {...props}>
      {validActions.map((actionId, index) => (
        <QuickActionButton
          key={`${actionId}-${index}`}
          actionId={actionId}
          onClick={handleActionClick}
          contactData={contactData}
          callData={callData}
          size={size}
          variant={variant}
        />
      ))}
    </div>
  );
};

// Pre-defined action groups for common scenarios
export const CallActionGroup = ({ contactData, callData, ...props }) => (
  <QuickActionGroup
    actions={['call_back', 'send_sms', 'create_task', 'edit_call']}
    contactData={contactData}
    callData={callData}
    {...props}
  />
);

export const ContactActionGroup = ({ contactData, ...props }) => (
  <QuickActionGroup
    actions={['view_contact', 'update_contact', 'add_note', 'call_back']}
    contactData={contactData}
    {...props}
  />
);

export const FollowUpActionGroup = ({ contactData, callData, ...props }) => (
  <QuickActionGroup
    actions={['create_task', 'send_sms', 'add_note']}
    contactData={contactData}
    callData={callData}
    {...props}
  />
);

export default QuickActionGroup;