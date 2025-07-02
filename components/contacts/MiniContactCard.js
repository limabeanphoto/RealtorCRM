import { useState } from 'react';
import { 
  FaPhone, 
  FaEnvelope, 
  FaBuilding, 
  FaEdit, 
  FaHistory, 
  FaUser,
  FaExternalLinkAlt
} from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';
import { getOutcomeStyle, getVolumeStyle, getStatusStyle } from '../../utils/badgeUtils';

// Using badge utilities from badgeUtils.js for consistency
// Wrapper functions to handle case differences and maintain compatibility
const getAssignedStyle = (status) => {
  const style = getStatusStyle(status);
  return { backgroundColor: style.bg, color: style.text };
};

const getLocalVolumeStyle = (volume) => {
  // Convert lowercase to uppercase for badgeUtils compatibility
  const capitalizedVolume = volume ? volume.charAt(0).toUpperCase() + volume.slice(1) : 'Medium';
  const style = getVolumeStyle(capitalizedVolume);
  return { backgroundColor: style.bg, color: style.text };
};

const getLocalOutcomeStyle = (outcome) => {
  const style = getOutcomeStyle(outcome);
  return { backgroundColor: style.bg, color: style.text };
};

// Utility function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'No calls yet';
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Utility function to get profile link display
const getProfileLinkDisplay = (profileLink) => {
  if (!profileLink) return null;
  
  try {
    const url = new URL(profileLink);
    const domain = url.hostname.replace('www.', '');
    
    return (
      <a 
        href={profileLink} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          color: theme.colors.brand.primary,
          textDecoration: 'none',
          fontSize: '0.8rem',
          gap: '0.25rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <FaExternalLinkAlt size={12} />
        {domain}
      </a>
    );
  } catch (e) {
    return null;
  }
};

export default function MiniContactCard({ 
  contact, 
  onEditClick, 
  onLogCallClick, 
  onSelect,
  isSelected = false,
  currentUser,
  volumeOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ],
  regionOptions = [
    { value: 'OC', label: 'Orange County' },
    { value: 'LA', label: 'Los Angeles' },
    { value: 'SD', label: 'San Diego' },
    { value: 'SF', label: 'San Francisco' },
    { value: 'other', label: 'Other' }
  ]
}) {
  // Helper to display assignment information
  const getAssignmentInfo = () => {
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (contact.status === 'Open') {
      return 'Open';
    } else if (contact.assignedToUser) {
      // For admins, show who is assigned to the contact
      if (isAdmin) {
        return `Assigned to: ${contact.assignedToUser.firstName} ${contact.assignedToUser.lastName}`;
      } 
      // For the assigned user, show "Assigned to you"
      else if (currentUser && contact.assignedTo === currentUser.id) {
        return 'Assigned to you';
      }
      // Fallback
      return 'Assigned';
    }
    
    return 'Unassigned';
  };
  
  // Helper to get volume label
  const getVolumeLabel = (value) => {
    const option = volumeOptions.find(o => o.value === value);
    return option ? option.label : value;
  };

  // Helper to get region label
  const getRegionLabel = (value) => {
    const option = regionOptions.find(o => o.value === value);
    return option ? option.label : value;
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
        <div style={{ flex: 1, marginRight: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <strong>{contact.name}</strong>
            
            {/* Last call outcome badge */}
            {contact.lastCallOutcome && (
              <span style={{
                display: 'inline-block',
                padding: '0.15rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.75rem',
                ...getLocalOutcomeStyle(contact.lastCallOutcome)
              }}>
                {contact.lastCallOutcome}
              </span>
            )}
            
            {/* Assignment status badge (subtle) */}
            {contact.status && (
              <span style={{
                display: 'inline-block',
                padding: '0.15rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.7rem',
                opacity: 0.8, // Make it more subtle
                ...getAssignedStyle(contact.status)
              }}>
                {contact.status}
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
            
            {/* New: Profile Link */}
            {contact.profileLink && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                {getProfileLinkDisplay(contact.profileLink)}
              </div>
            )}
            
            {/* New: Volume and Region information */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
              {/* Volume badge */}
              {contact.volume && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.3rem',
                    borderRadius: '3px',
                    fontSize: '0.7rem',
                    ...getLocalVolumeStyle(contact.volume)
                  }}>
                    {getVolumeLabel(contact.volume)}
                  </span>
                </div>
              )}
              
              {/* Region badge */}
              {contact.region && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.3rem',
                    borderRadius: '3px',
                    fontSize: '0.7rem',
                    backgroundColor: '#f0f0f0', 
                    color: theme.colors.brand.text
                  }}>
                    {getRegionLabel(contact.region)}
                  </span>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Last call date */}
              {contact.lastCallDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FaHistory size={12} />
                  Last call: {formatDate(contact.lastCallDate)}
                </div>
              )}
              
              {/* Assignment info (subtle) */}
              {contact.status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.8 }}>
                  <FaUser size={12} />
                  {getAssignmentInfo()}
                </div>
              )}
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
                style={miniIconButtonStyle}
                variant="secondary"
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
                style={miniIconButtonStyle}
                variant="primary"
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