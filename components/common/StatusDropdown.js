// Modern Status Dropdown Component
// Provides inline status editing with color coding and animations

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaSpinner } from 'react-icons/fa';
import { getStatusConfig, getStatusStyles, handleStatusChange, executeStatusChangeActions } from '../../utils/callStatus';
import theme from '../../styles/theme';

const StatusDropdown = ({ 
  currentStatus, 
  options, 
  onStatusChange, 
  callData = null, 
  contactData = null,
  disabled = false,
  showIcon = true,
  showDescription = false,
  size = 'medium',
  variant = 'badge',
  className = '',
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(currentStatus);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update local status when prop changes
  useEffect(() => {
    setLocalStatus(currentStatus);
  }, [currentStatus]);

  const currentConfig = getStatusConfig(localStatus);
  const currentStyles = getStatusStyles(localStatus, variant);

  const handleStatusClick = async (newStatus) => {
    if (disabled || isLoading || newStatus === localStatus) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setLocalStatus(newStatus);
    setIsOpen(false);

    try {
      // Execute business logic actions
      const actions = await handleStatusChange(localStatus, newStatus, callData, contactData);
      
      if (actions.length > 0) {
        await executeStatusChangeActions(actions);
      }

      // Call the parent's change handler
      if (onStatusChange) {
        await onStatusChange(newStatus, localStatus);
      }
    } catch (error) {
      console.error('Error changing status:', error);
      // Revert to original status on error
      setLocalStatus(currentStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeStyles = {
    small: {
      fontSize: theme.typography.fontSize.xs,
      padding: '0.25rem 0.5rem',
      gap: '0.25rem'
    },
    medium: {
      fontSize: theme.typography.fontSize.sm,
      padding: '0.375rem 0.75rem',
      gap: '0.375rem'
    },
    large: {
      fontSize: theme.typography.fontSize.base,
      padding: '0.5rem 1rem',
      gap: '0.5rem'
    }
  };

  const currentSizeStyle = sizeStyles[size];

  const buttonStyle = {
    ...currentStyles,
    ...currentSizeStyle,
    display: 'inline-flex',
    alignItems: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: `1px solid ${currentConfig.borderColor}`,
    borderRadius: theme.borderRadius.md,
    transition: 'all 0.2s ease',
    position: 'relative',
    userSelect: 'none',
    fontWeight: theme.typography.fontWeight.medium,
    opacity: disabled ? 0.6 : 1,
    minWidth: variant === 'button' ? '120px' : 'auto',
    justifyContent: 'space-between',
    ...(isOpen && {
      boxShadow: `0 0 0 2px ${currentConfig.color}40`,
      borderColor: currentConfig.color
    })
  };

  const IconComponent = currentConfig.icon;

  return (
    <div ref={dropdownRef} className={className} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        style={buttonStyle}
        {...props}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: currentSizeStyle.gap }}>
          {showIcon && IconComponent && (
            <IconComponent 
              size={size === 'small' ? 12 : size === 'large' ? 16 : 14} 
              style={{ 
                color: currentConfig.color,
                flexShrink: 0
              }} 
            />
          )}
          
          <span style={{ 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '150px'
          }}>
            {currentConfig.label}
          </span>
          
          {showDescription && (
            <span style={{ 
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.neutral[600],
              marginLeft: '0.5rem'
            }}>
              {currentConfig.description}
            </span>
          )}
        </div>

        {isLoading ? (
          <FaSpinner 
            size={size === 'small' ? 10 : 12} 
            style={{ 
              animation: 'spin 1s linear infinite',
              color: currentConfig.color
            }} 
          />
        ) : !disabled && (
          <FaChevronDown 
            size={size === 'small' ? 10 : 12} 
            style={{ 
              color: currentConfig.color,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} 
          />
        )}
      </button>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: theme.zIndex.dropdown,
          backgroundColor: 'white',
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.lg,
          border: `1px solid ${theme.colors.neutral[200]}`,
          marginTop: '0.25rem',
          overflow: 'hidden',
          minWidth: '180px'
        }}>
          {options.map((option) => {
            const optionConfig = getStatusConfig(option.value);
            const isSelected = option.value === localStatus;
            const OptionIcon = optionConfig.icon;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStatusClick(option.value)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  backgroundColor: isSelected ? optionConfig.backgroundColor : 'transparent',
                  color: isSelected ? optionConfig.color : theme.colors.neutral[700],
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  ':hover': {
                    backgroundColor: optionConfig.backgroundColor,
                    color: optionConfig.color
                  }
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = optionConfig.backgroundColor;
                    e.target.style.color = optionConfig.color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = theme.colors.neutral[700];
                  }
                }}
              >
                {OptionIcon && (
                  <OptionIcon 
                    size={14} 
                    style={{ 
                      color: isSelected ? optionConfig.color : theme.colors.neutral[500],
                      flexShrink: 0
                    }} 
                  />
                )}
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: theme.typography.fontWeight.medium }}>
                    {option.label}
                  </div>
                  {showDescription && (
                    <div style={{ 
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.neutral[500],
                      marginTop: '0.125rem'
                    }}>
                      {optionConfig.description}
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: optionConfig.color
                  }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StatusDropdown;