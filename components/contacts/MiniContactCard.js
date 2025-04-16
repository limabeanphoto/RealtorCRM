import { useState } from 'react';
import { FaUser, FaBuilding, FaPhone, FaEnvelope, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import theme from '../../styles/theme';

export default function MiniContactCard({ 
  contact,
  isExpanded = false
}) {
  const [expanded, setExpanded] = useState(isExpanded);
  
  // Toggle expanded state
  const toggleExpand = (e) => {
    e.stopPropagation(); // Stop propagation to prevent parent card from toggling
    setExpanded(!expanded);
  };
  
  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '0.75rem', 
      borderRadius: theme.borderRadius.sm,
      border: '1px solid #eee',
      marginBottom: '0.5rem',
      cursor: 'pointer'
    }} onClick={toggleExpand}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Contact Name and Company */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: theme.colors.brand.primary,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaUser size={16} />
          </div>
          
          <div>
            <div style={{ fontWeight: 'bold' }}>{contact.name}</div>
            {contact.company && <div style={{ fontSize: '0.85rem', color: theme.colors.brand.text }}>{contact.company}</div>}
          </div>
        </div>
        
        {/* Expand/Collapse Icon */}
        <div style={{ color: theme.colors.brand.text }}>
          {expanded ? <FaAngleUp size={14} /> : <FaAngleDown size={14} />}
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div style={{ 
          marginTop: '0.75rem', 
          paddingTop: '0.75rem', 
          borderTop: '1px solid #eee'
        }}>
          {/* Contact Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {contact.phone && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}>
                <FaPhone size={14} color={theme.colors.brand.accent} />
                <span>{contact.phone}</span>
              </div>
            )}
            
            {contact.email && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}>
                <FaEnvelope size={14} color={theme.colors.brand.accent} />
                <span>{contact.email}</span>
              </div>
            )}
            
            {contact.company && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}>
                <FaBuilding size={14} color={theme.colors.brand.accent} />
                <span>{contact.company}</span>
              </div>
            )}
          </div>
          
          {/* Notes if available */}
          {contact.notes && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Notes:</div>
              <div style={{ 
                fontSize: '0.85rem', 
                padding: '0.5rem', 
                backgroundColor: '#f8f9fa',
                borderRadius: '4px'
              }}>
                {contact.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}