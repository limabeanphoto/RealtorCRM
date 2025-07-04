import React from 'react';
import Button from '../common/Button';
import BaseModal from '../common/BaseModal';
import theme from '../../styles/theme';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';

const DuplicateContactModal = ({ 
  isOpen, 
  onClose, 
  duplicates, 
  onViewContact, 
  onCreateAnyway, 
  formData 
}) => {
  // Volume options
  const volumeOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  // Region options
  const regionOptions = [
    { value: 'OC', label: 'Orange County' },
    { value: 'LA', label: 'Los Angeles' },
    { value: 'SD', label: 'San Diego' },
    { value: 'SF', label: 'San Francisco' },
    { value: 'other', label: 'Other' }
  ];

  // Get volume label
  const getVolumeLabel = (value) => {
    const option = volumeOptions.find(o => o.value === value);
    return option ? option.label : value;
  };

  // Get region label
  const getRegionLabel = (value) => {
    const option = regionOptions.find(o => o.value === value);
    return option ? option.label : value;
  };
  
  // Footer content for the modal
  const footerContent = (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button
        onClick={onClose}
        variant="outline"
      >
        Cancel
      </Button>
      <Button
        onClick={onCreateAnyway}
        variant="primary"
      >
        Create Contact Anyway
      </Button>
    </div>
  );
  
  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Potential Duplicate Contacts" 
      zIndex={1050} // Higher than other modals
      footerContent={footerContent}
    >
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start',
          gap: '1rem', 
          backgroundColor: '#fff3cd', 
          padding: '1rem',
          borderRadius: theme.borderRadius.sm,
          marginBottom: '1.5rem'
        }}>
          <FaExclamationTriangle size={24} color="#856404" />
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#856404' }}>
              We found existing contacts that may be duplicates of the contact you're trying to add.
            </p>
            <p style={{ margin: '0', color: '#856404' }}>
              Please review them before proceeding. You can either view an existing contact or create a new one anyway.
            </p>
          </div>
        </div>
        
        {/* New contact info */}
        <div style={{ 
          backgroundColor: '#f0f9ff',
          padding: '1rem',
          borderRadius: theme.borderRadius.sm,
          marginBottom: '1.5rem',
          border: `1px solid ${theme.colors.brand.accent}`
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: theme.colors.brand.accent }}>New Contact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaUser size={14} color={theme.colors.brand.text} />
              <span>{formData.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaPhone size={14} color={theme.colors.brand.text} />
              <span>{formData.phone}</span>
            </div>
            {formData.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaEnvelope size={14} color={theme.colors.brand.text} />
                <span>{formData.email}</span>
              </div>
            )}
            {formData.company && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaBuilding size={14} color={theme.colors.brand.text} />
                <span>{formData.company}</span>
              </div>
            )}
          </div>
          
          {/* Display new fields if they exist in form data */}
          {(formData.profileLink || formData.volume || formData.region) && (
            <div style={{ 
              marginTop: '0.75rem', 
              paddingTop: '0.75rem', 
              borderTop: '1px solid #cce5ff',
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '0.5rem'
            }}>
              {formData.profileLink && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaExternalLinkAlt size={14} color={theme.colors.brand.text} />
                  <span style={{ fontSize: '0.9rem' }}>Profile Link</span>
                </div>
              )}
              {formData.volume && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>Volume: {getVolumeLabel(formData.volume)}</span>
                </div>
              )}
              {formData.region && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>Region: {getRegionLabel(formData.region)}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Existing contacts */}
        <h3 style={{ margin: '1.5rem 0 0.75rem 0' }}>Existing Contacts</h3>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '0.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: theme.borderRadius.sm,
        }}>
          {duplicates.map(contact => (
            <div 
              key={contact.id}
              style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #eee',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{contact.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FaPhone size={14} color={theme.colors.brand.text} />
                      <span>{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaEnvelope size={14} color={theme.colors.brand.text} />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.company && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaBuilding size={14} color={theme.colors.brand.text} />
                        <span>{contact.company}</span>
                      </div>
                    )}
                    
                    {/* Display additional fields if they exist */}
                    {contact.profileLink && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaExternalLinkAlt size={14} color={theme.colors.brand.text} />
                        <a 
                          href={contact.profileLink}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: theme.colors.brand.primary,
                            textDecoration: 'none',
                            fontSize: '0.9rem'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Profile
                        </a>
                      </div>
                    )}
                    {contact.volume && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Volume: {getVolumeLabel(contact.volume)}</span>
                      </div>
                    )}
                    {contact.region && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Region: {getRegionLabel(contact.region)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => onViewContact(contact)}
                  variant="outline"
                  size="small"
                >
                  View Contact
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
};

export default DuplicateContactModal;