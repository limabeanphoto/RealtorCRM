// components/contacts/DuplicateContactModal.js
import { useState } from 'react';
import Button from '../common/Button';
import theme from '../../styles/theme';
import { FaUser, FaPhone, FaEnvelope, FaBuilding } from 'react-icons/fa';

export default function DuplicateContactModal({ isOpen, onClose, duplicates, onViewContact, onCreateAnyway, formData }) {
  if (!isOpen) return null;
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050, // Higher than other modals
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: theme.colors.brand.accent }}>Potential Duplicate Contacts</h2>
          <Button
            onClick={onClose}
            variant="text"
            style={{ fontSize: '1.5rem', padding: '0.2rem' }}
          >
            &times;
          </Button>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: theme.colors.brand.text }}>
            We found existing contacts that may be duplicates of the contact you're trying to add:
          </p>
          
          {/* New contact info */}
          <div style={{ 
            backgroundColor: '#f0f9ff',
            padding: '1rem',
            borderRadius: theme.borderRadius.sm,
            marginBottom: '1rem',
            border: `1px solid ${theme.colors.brand.accent}`
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: theme.colors.brand.accent }}>New Contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
          </div>
          
          {/* Existing contacts */}
          <h3 style={{ margin: '1rem 0 0.5rem 0' }}>Existing Contacts</h3>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
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
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{contact.name}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
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
      </div>
    </div>
  );
}