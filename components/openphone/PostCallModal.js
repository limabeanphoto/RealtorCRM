// Post-Call Modal Component
// Shows after a call is completed to capture notes and update status

import React, { useState, useEffect } from 'react';
import { FaTimes, FaPhone, FaUser, FaCheck, FaSms } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';

const PostCallModal = ({ 
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

  useEffect(() => {
    if (isOpen && contactData) {
      setContactStatus(contactData.status || 'Open');
      setNotes('');
      setOutcome('Completed');
      setIsDeal(false);
      setFollowUpMessage('');
      setSendSms(false);
    }
  }, [isOpen, contactData]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Update call with notes
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
          followUpMessage: sendSms ? followUpMessage : null
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

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: theme.shadows.lg
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #eee'
        }}>
          <div>
            <h2 style={{ margin: 0, color: theme.colors.brand.primary }}>
              Call Completed
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              color: theme.colors.brand.text,
              fontSize: '0.9rem'
            }}>
              <FaPhone size={14} />
              <span>{contactData?.name || 'Unknown Contact'}</span>
              <span>•</span>
              <span>{formatDuration(callData?.duration)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: theme.colors.brand.text,
              padding: '0.5rem'
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Call Notes */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: theme.colors.brand.dark
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
              border: '1px solid #ddd',
              borderRadius: theme.borderRadius.sm,
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Call Outcome */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: theme.colors.brand.dark
          }}>
            Call Outcome
          </label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: theme.borderRadius.sm,
              fontSize: '0.9rem'
            }}
          >
            <option value="Completed">Call Completed</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Follow Up Required">Follow Up Required</option>
            <option value="Voicemail Left">Voicemail Left</option>
            <option value="No Answer">No Answer</option>
            <option value="Callback Requested">Callback Requested</option>
          </select>
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
            <span style={{ fontWeight: 'bold', color: theme.colors.brand.dark }}>
              Mark as Deal
            </span>
          </label>
        </div>

        {/* Contact Status */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: theme.colors.brand.dark
          }}>
            Contact Status
          </label>
          <select
            value={contactStatus}
            onChange={(e) => setContactStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: theme.borderRadius.sm,
              fontSize: '0.9rem'
            }}
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Qualified">Qualified</option>
            <option value="Not Qualified">Not Qualified</option>
            <option value="Closed">Closed</option>
          </select>
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
            <FaSms size={14} color={theme.colors.brand.primary} />
            <span style={{ fontWeight: 'bold', color: theme.colors.brand.dark }}>
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
                border: '1px solid #ddd',
                borderRadius: theme.borderRadius.sm,
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                marginTop: '0.5rem'
              }}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          paddingTop: '1rem',
          borderTop: '1px solid #eee'
        }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: '120px' }}
          >
            {saving ? 'Saving...' : 'Save & Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostCallModal;