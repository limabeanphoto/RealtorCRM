// components/contacts/MiniContactCard.js
import { useState } from 'react';
import { FaPhone, FaEdit, FaBuilding, FaEnvelope, FaHistory } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button'; // Import Button

export default function MiniContactCard({ 
  contact, 
  onEditClick, 
  onLogCallClick, 
  onSelect,
  isSelected = false
}) {
  // Get outcome badge style
  const getOutcomeStyle = (outcome) => {
    const styles = {
      'Interested': { backgroundColor: '#d4edda', color: '#155724' },
      'Not Interested': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Follow Up': { backgroundColor: '#fff3cd', color: '#856404' },
      'No Answer': { backgroundColor: '#e2e3e5', color: '#383d41' },
      'Left Message': { backgroundColor: '#cce5ff', color: '#004085' },
      'Wrong Number': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Deal Closed': { backgroundColor: '#d4edda', color: '#155724' }
    };
    
    return styles[outcome] || { backgroundColor: '#e2e3e5', color: '#383d41' };
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No calls yet';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Custom styles for mini icon buttons
  const miniIconButtonStyle = {
    width: '28px',
    height: '28px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px'
  };

  return (
    <div 
      style={{ 
        backgroundColor: isSelected ? '#f0f7ff' : 'white', 
        padding: '0.75rem', 
        borderRadius: theme.borderRadius.sm,
        border: `1px solid ${isSelected ? theme.colors.brand.accent : '#eee'}`,
        marginBottom: '0.5rem',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
      onClick={onSelect ? () => onSelect(contact) : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Contact Info */}
        <div style={{ flex: 1, marginRight: '0.5rem' }}> {/* Added margin for spacing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <strong>{contact.name}</strong>
            
            {/* Last call outcome badge - NEW */}
            {contact.lastCallOutcome && (
              <span style={{
                display: 'inline-block',
                padding: '0.15rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.75rem',
                ...getOutcomeStyle(contact.lastCallOutcome)
              }}>
                {contact.lastCallOutcome}
              </span>
            )}
          </div>
          
          <div style={{ fontSize: '0.9rem', color: theme.colors.brand.text }}>
            {contact.company && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <FaBuilding size={12} />
                {contact.company}
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
              <FaPhone size={12} />
              {contact.phone}
            </div>
            
            {contact.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                <FaEnvelope size={12} />
                {contact.email}
              </div>
            )}
            
            {/* Last call date - NEW */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaHistory size={12} />
              Last call: {formatDate(contact.lastCallDate)}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        {(onEditClick || onLogCallClick) && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {onEditClick && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(contact);
                }}
                style={miniIconButtonStyle} // Use specific style
                variant="secondary" // Example variant
                tooltip="Edit contact details"
              >
                <FaEdit size={12} />
              </Button>
            )}
            
            {onLogCallClick && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogCallClick(contact);
                }}
                style={miniIconButtonStyle} // Use specific style
                variant="primary" // Example variant
                tooltip="Log a call with this contact"
              >
                <FaPhone size={12} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}