// Task Priority Indicator Component
// Displays task priority with color-coded dots/badges and animations

import React, { useState, useEffect } from 'react';
import { FaCircle, FaExclamationTriangle, FaMinus, FaChevronDown } from 'react-icons/fa';
import { getPriorityConfig, getPriorityStyles } from '../../utils/taskPriority';
import theme from '../../styles/theme';

const TaskPriorityIndicator = ({ 
  priority, 
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
  }, [priority, animated]);

  const config = getPriorityConfig(priority);
  const styles = getPriorityStyles(priority, variant);

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
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease'
    },
    dot: {
      width: sizeConfig.indicatorSize,
      height: sizeConfig.indicatorSize,
      borderRadius: '50%',
      backgroundColor: config.color,
      display: 'inline-block',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease'
    },
    pill: {
      ...styles,
      ...sizeConfig,
      borderRadius: theme.borderRadius.full,
      display: 'inline-flex',
      alignItems: 'center',
      fontWeight: theme.typography.fontWeight.medium,
      border: `1px solid ${config.borderColor}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease'
    },
    minimal: {
      color: config.color,
      fontSize: sizeConfig.fontSize,
      fontWeight: theme.typography.fontWeight.medium,
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizeConfig.gap,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease'
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
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease'
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

  // Hover effects
  const hoverStyles = onClick ? {
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows.md,
      backgroundColor: variant === 'outline' ? config.backgroundColor : config.color,
      color: variant === 'outline' ? config.color : 'white'
    }
  } : {};

  // Pulse animation for high priority
  const pulseStyles = (showPulse || priority === 'high') ? {
    animation: 'priorityPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  } : {};

  const handleClick = (e) => {
    if (onClick) {
      onClick(e, priority);
    }
  };

  // Render different variants
  const renderContent = () => {
    switch (variant) {
      case 'dot':
        return (
          <div
            className={`priority-dot ${className}`}
            style={{
              ...currentStyle,
              ...animationStyles,
              ...pulseStyles,
              position: 'relative'
            }}
            onClick={handleClick}
            title={`Priority: ${config.label}`}
            {...props}
          />
        );

      case 'minimal':
        return (
          <div
            className={`priority-minimal ${className}`}
            style={{
              ...currentStyle,
              ...animationStyles,
              ...hoverStyles
            }}
            onClick={handleClick}
            title={`Priority: ${config.label}`}
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
            className={`priority-${variant} ${className}`}
            style={{
              ...currentStyle,
              ...animationStyles,
              ...hoverStyles,
              position: 'relative'
            }}
            onClick={handleClick}
            title={`Priority: ${config.label} - ${config.description}`}
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
            
            {/* Pulse overlay for high priority */}
            {(showPulse || priority === 'high') && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'inherit',
                backgroundColor: config.color,
                opacity: 0.2,
                animation: 'priorityPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
        @keyframes priorityPulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.05);
          }
        }
        
        @keyframes priorityBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        @keyframes priorityGlow {
          0%, 100% {
            box-shadow: 0 0 5px ${config.color}40;
          }
          50% {
            box-shadow: 0 0 20px ${config.color}60;
          }
        }

        .priority-dot:hover {
          transform: scale(1.2);
          box-shadow: 0 0 10px ${config.color}60;
        }

        .priority-badge:hover,
        .priority-pill:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.md};
        }

        .priority-outline:hover {
          background-color: ${config.backgroundColor};
          border-color: ${config.color};
        }

        .priority-minimal:hover {
          color: ${config.color};
          text-shadow: 0 0 8px ${config.color}40;
        }

        /* Accessibility improvements */
        .priority-dot:focus,
        .priority-badge:focus,
        .priority-pill:focus,
        .priority-outline:focus,
        .priority-minimal:focus {
          outline: 2px solid ${config.color};
          outline-offset: 2px;
        }

        /* Responsive behavior */
        @media (max-width: 768px) {
          .priority-badge,
          .priority-pill {
            padding: 0.125rem 0.25rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </>
  );
};

// Specialized priority indicator components
export const TaskPriorityBadge = ({ priority, ...props }) => (
  <TaskPriorityIndicator
    priority={priority}
    variant="badge"
    showIcon={true}
    showLabel={true}
    {...props}
  />
);

export const TaskPriorityDot = ({ priority, ...props }) => (
  <TaskPriorityIndicator
    priority={priority}
    variant="dot"
    showIcon={false}
    showLabel={false}
    {...props}
  />
);

export const TaskPriorityPill = ({ priority, ...props }) => (
  <TaskPriorityIndicator
    priority={priority}
    variant="pill"
    showIcon={true}
    showLabel={true}
    {...props}
  />
);

export const TaskPriorityMinimal = ({ priority, ...props }) => (
  <TaskPriorityIndicator
    priority={priority}
    variant="minimal"
    showIcon={true}
    showLabel={true}
    {...props}
  />
);

// Priority indicator with quick actions
export const InteractiveTaskPriorityIndicator = ({ 
  priority, 
  onPriorityChange,
  priorities = ['high', 'medium', 'low'],
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrioritySelect = (newPriority) => {
    setIsOpen(false);
    if (onPriorityChange && newPriority !== priority) {
      onPriorityChange(newPriority);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <TaskPriorityIndicator
        priority={priority}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      />
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: theme.zIndex.dropdown,
          backgroundColor: 'white',
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.lg,
          border: `1px solid ${theme.colors.neutral[200]}`,
          marginTop: '0.25rem',
          overflow: 'hidden',
          minWidth: '120px'
        }}>
          {priorities.map((priorityOption) => (
            <button
              key={priorityOption}
              type="button"
              onClick={() => handlePrioritySelect(priorityOption)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                border: 'none',
                backgroundColor: priorityOption === priority ? getPriorityConfig(priorityOption).backgroundColor : 'transparent',
                color: priorityOption === priority ? getPriorityConfig(priorityOption).color : theme.colors.neutral[700],
                fontSize: theme.typography.fontSize.sm,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <TaskPriorityDot priority={priorityOption} size="small" />
              <span>{getPriorityConfig(priorityOption).label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskPriorityIndicator;