// Click-to-Call Button Component for OpenPhone Integration

import React, { useState } from 'react';
import { FaPhone, FaSpinner } from 'react-icons/fa';
import theme from '../../styles/theme';

const ClickToCallButton = ({ 
  contactId, 
  phoneNumber, 
  size = 12, 
  showNumber = true, 
  compact = false,
  disabled = false,
  className = '',
  style = {}
}) => {
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState('');

  const handleCall = async (e) => {
    e.stopPropagation();
    
    if (!contactId || !phoneNumber || calling || disabled) {
      return;
    }

    setCalling(true);
    setError('');

    try {
      const response = await fetch(`/api/openphone?action=click-to-call&contactId=${contactId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // Open the click-to-call URL
        window.location.href = result.url;
      } else {
        setError(result.error || 'Failed to initiate call');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Click-to-call error:', error);
      setError('Failed to initiate call');
      setTimeout(() => setError(''), 3000);
    } finally {
      setCalling(false);
    }
  };

  // Check if user has OpenPhone configured
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hasOpenPhone = user.openPhoneApiKey;

  if (!hasOpenPhone) {
    // Show regular phone icon if OpenPhone not configured
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: compact ? '0.25rem' : '0.4rem',
          ...style
        }}
        className={className}
        title={`Phone: ${phoneNumber}`}
      >
        <FaPhone size={size} color={theme.colors.brand.text} />
        {showNumber && phoneNumber}
      </div>
    );
  }

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: compact ? '0.25rem' : '0.4rem',
    cursor: calling || disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    padding: compact ? '0.125rem 0.25rem' : '0.25rem 0.5rem',
    borderRadius: theme.borderRadius.sm,
    border: 'none',
    background: 'transparent',
    transition: 'all 0.2s ease',
    color: calling ? theme.colors.brand.primary : theme.colors.brand.text,
    fontSize: 'inherit',
    ...style
  };

  const hoverStyle = {
    backgroundColor: calling ? 'transparent' : theme.colors.brand.secondary + '20',
    color: calling ? theme.colors.brand.primary : theme.colors.brand.primary
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleCall}
        disabled={calling || disabled}
        className={className}
        style={buttonStyle}
        title={calling ? 'Initiating call...' : `Click to call ${phoneNumber}`}
        onMouseEnter={(e) => {
          if (!calling && !disabled) {
            Object.assign(e.target.style, hoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          if (!calling && !disabled) {
            Object.assign(e.target.style, buttonStyle);
          }
        }}
      >
        {calling ? (
          <FaSpinner size={size} className="fa-spin" />
        ) : (
          <FaPhone size={size} />
        )}
        {showNumber && phoneNumber}
      </button>

      {error && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.5rem',
            borderRadius: theme.borderRadius.sm,
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            border: '1px solid #f5c6cb',
            boxShadow: theme.shadows.sm
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default ClickToCallButton;