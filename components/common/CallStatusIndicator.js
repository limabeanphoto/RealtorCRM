// Call Status Indicator Component
// Displays call status with animations and visual feedback

import React, { useState, useEffect } from 'react';
import { FaPulse } from 'react-icons/fa';
import { getStatusConfig, getStatusStyles } from '../../utils/callStatus';
import theme from '../../styles/theme';

const CallStatusIndicator = ({ 
  status, 
  animated = true,
  showLabel = true,
  showIcon = true,
  showPulse = false,
  size = 'medium',
  variant = 'badge',
  className = '',
  onClick = null,
  ...props 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (animated) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [status, animated]);

  const config = getStatusConfig(status);
  const styles = getStatusStyles(status, variant);

  const sizeVariants = {
    small: {
      fontSize: theme.typography.fontSize.xs,
      padding: '0.125rem 0.375rem',
      gap: '0.25rem',
      iconSize: 10,
      indicatorSize: 8
    },
    medium: {
      fontSize: theme.typography.fontSize.sm,
      padding: '0.25rem 0.5rem',
      gap: '0.375rem',
      iconSize: 12,
      indicatorSize: 10
    },
    large: {
      fontSize: theme.typography.fontSize.base,
      padding: '0.375rem 0.75rem',
      gap: '0.5rem',
      iconSize: 16,
      indicatorSize: 12
    }
  };

  const sizeConfig = sizeVariants[size];
  const IconComponent = config.icon;

  // Different variant styles
  const variantStyles = {
    badge: {
      ...styles,
      ...sizeConfig,
      borderRadius: theme.borderRadius.sm,
      display: 'inline-flex',
      alignItems: 'center',
      fontWeight: theme.typography.fontWeight.medium,
      border: `1px solid ${config.borderColor}`,
      cursor: onClick ? 'pointer' : 'default'
    },
    dot: {
      width: sizeConfig.indicatorSize,
      height: sizeConfig.indicatorSize,
      borderRadius: '50%',
      backgroundColor: config.color,
      display: 'inline-block',
      cursor: onClick ? 'pointer' : 'default'
    },
    pill: {
      ...styles,
      ...sizeConfig,
      borderRadius: theme.borderRadius.full,
      display: 'inline-flex',
      alignItems: 'center',
      fontWeight: theme.typography.fontWeight.medium,
      border: `1px solid ${config.borderColor}`,
      cursor: onClick ? 'pointer' : 'default'
    },
    minimal: {
      color: config.color,
      fontSize: sizeConfig.fontSize,
      fontWeight: theme.typography.fontWeight.medium,
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizeConfig.gap,
      cursor: onClick ? 'pointer' : 'default'
    },
    outline: {
      ...styles,
      ...sizeConfig,
      backgroundColor: 'transparent',
      border: `2px solid ${config.color}`,
      color: config.color,
      borderRadius: theme.borderRadius.md,
      display: 'inline-flex',
      alignItems: 'center',
      fontWeight: theme.typography.fontWeight.medium,
      cursor: onClick ? 'pointer' : 'default'
    }
  };

  const currentStyle = variantStyles[variant];

  // Animation styles
  const animationStyles = isAnimating ? {
    transform: 'scale(1.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  } : {
    transform: 'scale(1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // Pulse animation for active states
  const pulseStyles = showPulse ? {
    '::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 'inherit',
      backgroundColor: config.color,
      opacity: 0.3,
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }
  } : {};

  const handleClick = (e) => {
    if (onClick) {
      onClick(e, status);
    }
  };

  // Render different variants
  const renderContent = () => {
    switch (variant) {
      case 'dot':
        return (
          <div
            className={className}
            style={{
              ...currentStyle,
              ...animationStyles,
              position: 'relative',
              ...pulseStyles
            }}
            onClick={handleClick}
            {...props}
          />
        );

      case 'minimal':
        return (
          <div
            className={className}
            style={{
              ...currentStyle,
              ...animationStyles
            }}
            onClick={handleClick}
            {...props}
          >
            {showIcon && IconComponent && (
              <IconComponent size={sizeConfig.iconSize} />
            )}
            {showLabel && config.label}
          </div>
        );

      default:
        return (
          <div
            className={className}
            style={{
              ...currentStyle,
              ...animationStyles,
              position: 'relative'
            }}
            onClick={handleClick}
            {...props}
          >
            {showIcon && IconComponent && (
              <IconComponent size={sizeConfig.iconSize} />
            )}
            {showLabel && (
              <span style={{ 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {config.label}
              </span>
            )}
            
            {/* Pulse overlay for active states */}
            {showPulse && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'inherit',
                backgroundColor: config.color,
                opacity: 0.3,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                pointerEvents: 'none'
              }} />
            )}
          </div>
        );
    }
  };

  return (
    <>
      {renderContent()}
      
      {/* CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px ${config.color}40;
          }
          50% {
            box-shadow: 0 0 20px ${config.color}60;
          }
        }
      `}</style>
    </>
  );
};

// Specialized status indicator components
export const CallStatusBadge = ({ status, ...props }) => (
  <CallStatusIndicator
    status={status}
    variant="badge"
    showIcon={true}
    showLabel={true}
    {...props}
  />
);

export const CallStatusDot = ({ status, ...props }) => (
  <CallStatusIndicator
    status={status}
    variant="dot"
    showIcon={false}
    showLabel={false}
    {...props}
  />
);

export const CallStatusPill = ({ status, ...props }) => (
  <CallStatusIndicator
    status={status}
    variant="pill"
    showIcon={true}
    showLabel={true}
    {...props}
  />
);

export const CallStatusMinimal = ({ status, ...props }) => (
  <CallStatusIndicator
    status={status}
    variant="minimal"
    showIcon={true}
    showLabel={true}
    {...props}
  />
);

// Status indicator with live updates
export const LiveCallStatusIndicator = ({ 
  status, 
  isActive = false,
  lastUpdated = null,
  ...props 
}) => {
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, lastUpdated]);

  return (
    <CallStatusIndicator
      status={status}
      showPulse={shouldPulse}
      animated={true}
      {...props}
    />
  );
};

export default CallStatusIndicator;