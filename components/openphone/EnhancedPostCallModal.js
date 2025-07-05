// Enhanced Post-Call Modal Component
// Integrates with the new call status management system

import React, { useState, useEffect } from 'react';
import { FaTimes, FaPhone } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';
import StatusDropdown from '../common/StatusDropdown';
import QuickActionGroup from '../common/QuickActionGroup';
import CallStatusIndicator from '../common/CallStatusIndicator';
import { getCallStatusOptions, getContactStatusOptions, handleStatusChange, executeStatusChangeActions } from '../../utils/callStatus';

const EnhancedPostCallModal = ({ 
  isOpen, 
  onClose, 
  callData, 
  contactData, 
  onSave 
}) => {
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('Completed');
  const [isDeal, setIsDeal] = useState(false);
  const [contactStatus, setContactStatus] = useState('');
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusActions, setStatusActions] = useState([]);

  useEffect(() => {
    if (isOpen && contactData) {
      setContactStatus(contactData.status || 'Open');
      setNotes('');
      setOutcome('Completed');
      setIsDeal(false);
      setFollowUpMessage('');
      setSendSms(false);
      setStatusActions([]);
    }
  }, [isOpen, contactData]);

  const handleStatusChange = async (newStatus, oldStatus) => {
    setOutcome(newStatus);
    
    // Get recommended actions based on status change
    const actions = await handleStatusChange(oldStatus, newStatus, callData, contactData);
    setStatusActions(actions);
    
    // Auto-set contact status based on call outcome
    if (newStatus === 'Deal Closed' && contactStatus !== 'Closed') {
      setContactStatus('Closed');
    } else if (newStatus === 'Not Interested' && contactStatus !== 'Not Qualified') {
      setContactStatus('Not Qualified');
    } else if ((newStatus === 'Connected' || newStatus === 'Completed') && contactStatus === 'Open') {
      setContactStatus('In Progress');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Update call with notes and outcome
      if (callData?.id) {
        const callResponse = await fetch('/api/openphone?action=update-call-notes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            callId: callData.id,
            notes,
            outcome,
            isDeal
          })
        });

        if (!callResponse.ok) {
          throw new Error('Failed to update call notes');
        }
      }

      // Update contact status if changed
      if (contactData?.id && contactStatus !== contactData.status) {
        const contactResponse = await fetch(`/api/contacts/${contactData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            status: contactStatus
          })
        });

        if (!contactResponse.ok) {
          throw new Error('Failed to update contact status');
        }
      }

      // Execute status change actions
      if (statusActions.length > 0) {
        await executeStatusChangeActions(statusActions);
      }

      // Send follow-up SMS if requested
      if (sendSms && followUpMessage.trim() && contactData?.id) {
        const smsResponse = await fetch('/api/openphone?action=send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            contactId: contactData.id,
            message: followUpMessage
          })
        });

        if (!smsResponse.ok) {
          console.warn('Failed to send follow-up SMS');
        }
      }

      // Notify parent component
      if (onSave) {
        onSave({
          notes,
          outcome,
          isDeal,
          contactStatus,
          followUpMessage: sendSms ? followUpMessage : null,
          statusActions
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving post-call data:', error);
      alert('Failed to save call information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (durationInMinutes) => {
    if (!durationInMinutes) return '0:00';
    const totalSeconds = durationInMinutes * 60;
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const callStatusOptions = getCallStatusOptions();
  const contactStatusOptions = getContactStatusOptions();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: theme.borderRadius.lg,
        padding: '2rem',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: theme.shadows.xl
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: `1px solid ${theme.colors.neutral[200]}`
        }}>
          <div>
            <h2 style={{ margin: 0, color: theme.colors.primary[600] }}>
              Call Completed
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              color: theme.colors.neutral[600],
              fontSize: theme.typography.fontSize.sm
            }}>
              <FaPhone size={14} />
              <span>{contactData?.name || 'Unknown Contact'}</span>
              <span>•</span>
              <span>{formatDuration(callData?.duration)}</span>
              {callData?.outcome && (
                <>
                  <span>•</span>
                  <CallStatusIndicator 
                    status={callData.outcome}
                    size="small"
                    variant="minimal"
                  />
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: theme.colors.neutral[500],
              padding: '0.5rem',
              borderRadius: theme.borderRadius.md
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Call Status Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '0.5rem',
            color: theme.colors.neutral[700]
          }}>
            Call Outcome
          </label>
          <StatusDropdown
            currentStatus={outcome}
            options={callStatusOptions}
            onStatusChange={handleStatusChange}
            callData={callData}
            contactData={contactData}
            variant="dropdown"
            size="medium"
            showDescription={true}
          />
        </div>

        {/* Status Actions Preview */}
        {statusActions.length > 0 && (
          <div style={{
            backgroundColor: theme.colors.info[50],
            border: `1px solid ${theme.colors.info[200]}`,
            borderRadius: theme.borderRadius.md,
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{
              margin: '0 0 0.5rem 0',
              color: theme.colors.info[700],
              fontSize: theme.typography.fontSize.sm
            }}>
              Recommended Actions
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.info[600]
            }}>
              {statusActions.map((action, index) => (
                <li key={index}>
                  {action.type === 'create_task' && `Create follow-up task: "${action.data.title}"`}
                  {action.type === 'update_contact_status' && `Update contact status to "${action.data.newStatus}"`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Call Notes */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '0.5rem',
            color: theme.colors.neutral[700]
          }}>
            Call Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was discussed during the call?"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.75rem',
              border: `1px solid ${theme.colors.neutral[300]}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'border-color 0.2s ease',
              ':focus': {
                borderColor: theme.colors.primary[500],
                outline: 'none'
              }
            }}
          />
        </div>

        {/* Deal Checkbox */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={isDeal}
              onChange={(e) => setIsDeal(e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <span style={{ 
              fontWeight: theme.typography.fontWeight.semibold, 
              color: theme.colors.neutral[700] 
            }}>
              Mark as Deal
            </span>
          </label>
        </div>

        {/* Contact Status */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '0.5rem',
            color: theme.colors.neutral[700]
          }}>
            Contact Status
          </label>
          <StatusDropdown
            currentStatus={contactStatus}
            options={contactStatusOptions}
            onStatusChange={(newStatus) => setContactStatus(newStatus)}
            contactData={contactData}
            variant="dropdown"
            size="medium"
            showDescription={true}
          />
        </div>

        {/* Follow-up SMS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <span style={{ 
              fontWeight: theme.typography.fontWeight.semibold, 
              color: theme.colors.neutral[700] 
            }}>
              Send Follow-up SMS
            </span>
          </label>
          
          {sendSms && (
            <textarea
              value={followUpMessage}
              onChange={(e) => setFollowUpMessage(e.target.value)}
              placeholder="Type your follow-up message..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '0.75rem',
                border: `1px solid ${theme.colors.neutral[300]}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                fontFamily: 'inherit',
                marginTop: '0.5rem'
              }}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: '0.5rem',
            color: theme.colors.neutral[700]
          }}>
            Quick Actions
          </label>
          <QuickActionGroup
            actions={['call_back', 'create_task', 'add_note']}
            contactData={contactData}
            callData={callData}
            size="small"
            variant="outline"
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          paddingTop: '1rem',
          borderTop: `1px solid ${theme.colors.neutral[200]}`
        }}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            style={{ minWidth: '140px' }}
          >
            {saving ? 'Saving...' : 'Save & Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPostCallModal;