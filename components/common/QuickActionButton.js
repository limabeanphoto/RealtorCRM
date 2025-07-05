// Quick Action Button Component
// Provides common call-related actions with consistent styling

import React, { useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { getQuickActionConfig } from '../../utils/callStatus';
import theme from '../../styles/theme';

const QuickActionButton = ({ 
  actionId, 
  onClick, 
  disabled = false,
  loading = false,
  size = 'medium',
  variant = 'outline',
  tooltip = '',
  contactData = null,
  callData = null,
  className = '',
  children,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(loading);
  const [showTooltip, setShowTooltip] = useState(false);

  const actionConfig = getQuickActionConfig(actionId);
  
  if (!actionConfig) {
    return null;
  }

  // Check if action can be performed
  const canPerform = () => {
    if (disabled || isLoading) return false;
    
    if (actionConfig.requiresContact && !contactData) return false;
    if (actionConfig.requiresPhone && !contactData?.phone) return false;
    
    return true;
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canPerform()) return;

    setIsLoading(true);
    try {
      if (onClick) {
        await onClick(actionId, { contactData, callData });
      }
    } catch (error) {
      console.error('Error executing quick action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeStyles = {
    small: {
      padding: '0.25rem 0.5rem',
      fontSize: theme.typography.fontSize.xs,
      gap: '0.25rem',
      minWidth: '60px'
    },
    medium: {
      padding: '0.375rem 0.75rem',
      fontSize: theme.typography.fontSize.sm,
      gap: '0.375rem',
      minWidth: '80px'
    },
    large: {
      padding: '0.5rem 1rem',
      fontSize: theme.typography.fontSize.base,
      gap: '0.5rem',
      minWidth: '100px'
    }
  };

  const variantStyles = {
    solid: {
      backgroundColor: actionConfig.color,
      color: 'white',
      border: `1px solid ${actionConfig.color}`,
      ':hover': {
        backgroundColor: actionConfig.color,
        opacity: 0.9,
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${actionConfig.color}40`
      }
    },
    outline: {
      backgroundColor: 'transparent',
      color: actionConfig.color,
      border: `1px solid ${actionConfig.color}`,
      ':hover': {
        backgroundColor: actionConfig.backgroundColor,
        color: actionConfig.color,
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${actionConfig.color}20`
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: actionConfig.color,
      border: '1px solid transparent',
      ':hover': {
        backgroundColor: actionConfig.backgroundColor,
        color: actionConfig.color,
        border: `1px solid ${actionConfig.color}40`
      }
    },
    subtle: {
      backgroundColor: actionConfig.backgroundColor,
      color: actionConfig.color,
      border: `1px solid ${actionConfig.color}20`,
      ':hover': {
        backgroundColor: actionConfig.color,
        color: 'white',
        border: `1px solid ${actionConfig.color}`,
        transform: 'translateY(-1px)'
      }
    }
  };

  const currentSizeStyle = sizeStyles[size];
  const currentVariantStyle = variantStyles[variant];

  const buttonStyle = {
    ...currentSizeStyle,
    ...currentVariantStyle,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    cursor: canPerform() ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s ease',
    fontWeight: theme.typography.fontWeight.medium,
    opacity: canPerform() ? 1 : 0.5,
    position: 'relative',
    overflow: 'hidden',
    textDecoration: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap'
  };

  const IconComponent = actionConfig.icon;
  const displayText = children || actionConfig.label;
  const displayTooltip = tooltip || actionConfig.description;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={!canPerform()}
        className={className}
        style={buttonStyle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseOver={(e) => {
          if (canPerform()) {
            Object.assign(e.target.style, currentVariantStyle[':hover']);
          }
        }}
        onMouseOut={(e) => {
          if (canPerform()) {
            Object.assign(e.target.style, {
              ...currentVariantStyle,
              transform: 'translateY(0px)',
              boxShadow: 'none'
            });
          }
        }}
        {...props}
      >
        {isLoading ? (
          <FaSpinner 
            size={size === 'small' ? 12 : size === 'large' ? 16 : 14} 
            style={{ 
              animation: 'spin 1s linear infinite',
              marginRight: displayText ? '0.5rem' : 0
            }} 
          />
        ) : (
          IconComponent && (
            <IconComponent 
              size={size === 'small' ? 12 : size === 'large' ? 16 : 14} 
              style={{ 
                marginRight: displayText ? '0.5rem' : 0,
                flexShrink: 0
              }} 
            />
          )
        )}
        
        {displayText && (
          <span style={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {displayText}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && displayTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: theme.colors.neutral[800],
          color: 'white',
          padding: '0.5rem 0.75rem',
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.typography.fontSize.xs,
          whiteSpace: 'nowrap',
          zIndex: theme.zIndex.tooltip,
          marginBottom: '0.5rem',
          boxShadow: theme.shadows.md,
          '::after': {
            content: '""',
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            border: '4px solid transparent',
            borderTopColor: theme.colors.neutral[800]
          }
        }}>
          {displayTooltip}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: `4px solid ${theme.colors.neutral[800]}`
          }} />
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

export default QuickActionButton;