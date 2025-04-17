import { useState, useEffect } from 'react';
import { FaUser, FaBuilding, FaClock, FaPhone, FaEdit, FaAngleDown, FaAngleUp, FaTrash, FaClipboard, FaTasks } from 'react-icons/fa';
import theme from '../../styles/theme';
import MiniContactCard from '../contacts/MiniContactCard';
import Button from '../common/Button'; // Import Button

export default function CallCard({ 
  call, 
  onEditClick, 
  onDeleteClick,
  onAddTaskClick
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [enhancedContact, setEnhancedContact] = useState(null);
  
  // Effect to ensure contact includes notes from the call when relevant
  useEffect(() => {
    if (call && call.contact) {
      // Create enhanced contact object with notes if not present
      const contactWithNotes = { 
        ...call.contact,
        // Only add notes from call if contact doesn't have notes
        notes: call.contact.notes || (call.notes ? `Call notes: ${call.notes}` : '')
      };
      setEnhancedContact(contactWithNotes);
    }
  }, [call]);
  
  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get color based on outcome
  const getOutcomeStyle = (outcome) => {
    const styles = {
      'Follow Up': { backgroundColor: '#fff3cd', color: '#856404' },
      'No Answer': { backgroundColor: '#e2e3e5', color: '#383d41' },
      'Deal Closed': { backgroundColor: '#d4edda', color: '#155724' },
      'Not Interested': { backgroundColor: '#f8d7da', color: '#721c24' }
    };
    
    return styles[outcome] || { backgroundColor: '#e2e3e5', color: '#383d41' };
  };
  
  // If call data isn't available yet, don't render
  if (!call || !call.contact) {
    return null;
  }
  
  // Custom styles for square icon buttons
  const iconButtonStyle = {
    width: '32px',
    height: '32px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px'
  };

  return (
    <div style={{ 
      border: '1px solid #e2e8f0', 
      borderRadius: theme.borderRadius.md,
      margin: '0 0 1rem 0',
      backgroundColor: 'white',
      boxShadow: theme.shadows.sm,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease',
      ':hover': {
        boxShadow: theme.shadows.md
      }
    }}>
      {/* Card Header - Always Visible */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: isExpanded ? '1px solid #ddd' : 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        cursor: 'pointer'
      }} onClick={toggleExpand}>
        <div style={{ flex: 1, marginRight: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ 
              margin: 0, 
              color: theme.colors.brand.primary
            }}>
              {call.contact.name}
            </h3>
            
            <span style={{ 
              display: 'inline-block',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              ...getOutcomeStyle(call.outcome)
            }}>
              {call.outcome}
            </span>
            
            {call.isDeal && (
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                backgroundColor: theme.colors.brand.secondary, // Use secondary color for deal
                color: 'white'
              }}>
                Deal {call.dealValue ? `($${parseFloat(call.dealValue).toFixed(2)})` : ''}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.9rem', 
              color: theme.colors.brand.text
            }}>
              <FaClock size={12} />
              {formatDate(call.date)}
            </span>
            
            <span style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.9rem', 
              color: theme.colors.brand.text
            }}>
              <FaPhone size={12} />
              {call.duration} min
            </span>
            
            {call.contact.company && (
              <span style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.9rem', 
                color: theme.colors.brand.text
              }}>
                <FaBuilding size={12} />
                {call.contact.company}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(call);
            }}
            style={iconButtonStyle}
            variant="secondary" // Use secondary for edit
            tooltip="Edit this call record"
          >
            <FaEdit size={14} />
          </Button>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddTaskClick(call);
            }}
            style={iconButtonStyle}
            tooltip="Create a follow-up task for this call"
          >
            <FaTasks size={14} />
          </Button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: theme.colors.brand.text,
            marginLeft: '0.5rem'
          }}>
            {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
          </div>
        </div>
      </div>
      
      {/* Card Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '1rem', backgroundColor: '#f9f9fa' }}>
          {/* Contact Information */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Contact Information</h4>
            {enhancedContact && <MiniContactCard contact={enhancedContact} />}
          </div>
          
          {/* Call Details */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Call Details</h4>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '0.75rem', 
              borderRadius: theme.borderRadius.sm,
              border: '1px solid #eee'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><strong>Date/Time:</strong> {formatDate(call.date)}</div>
                <div><strong>Duration:</strong> {call.duration} minutes</div>
                <div><strong>Outcome:</strong> {call.outcome}</div>
                <div><strong>Deal:</strong> {call.isDeal ? 'Yes' : 'No'}</div>
                {call.isDeal && call.dealValue && (
                  <div><strong>Deal Value:</strong> ${parseFloat(call.dealValue).toFixed(2)}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          {call.notes && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Notes</h4>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #eee'
              }}>
                {call.notes}
              </div>
            </div>
          )}
          
          {/* Action Buttons Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAddTaskClick(call);
              }}
              variant="primary"
              size="medium"
              tooltip="Create a task related to this call"
            >
              <FaTasks size={14} style={{ marginRight: '0.3rem' }} /> Create Follow-up Task
            </Button>
            
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this call record? This cannot be undone.')) {
                  onDeleteClick(call.id);
                }
              }}
              variant="outline"
              size="medium"
              style={{ color: '#e74c3c', borderColor: '#e74c3c' }} // Danger color
              tooltip="Permanently delete this call record"
            >
              <FaTrash size={14} style={{ marginRight: '0.3rem' }} /> Delete Call
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}