// Task Status Badge Component
// Enhanced status display showing overdue, due today, upcoming with styling

import React, { useState, useEffect } from 'react';
import { FaClock, FaExclamationTriangle, FaCalendarCheck, FaCalendarAlt, FaCheck, FaHourglassHalf } from 'react-icons/fa';
import { getTaskStatusConfig, getTaskStatusStyles, calculateTaskStatus } from '../../utils/taskPriority';
import theme from '../../styles/theme';

const TaskStatusBadge = ({ 
  task,
  dueDate,
  completed = false,
  status = null,
  animated = true,
  showIcon = true,
  showLabel = true,
  showRelativeTime = true,
  size = 'medium',
  variant = 'badge',
  className = '',
  onClick = null,
  ...props 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for accurate relative time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (animated) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [status, completed, animated]);

  // Calculate status based on task data
  const calculatedStatus = status || calculateTaskStatus(task || { dueDate, completed });
  const config = getTaskStatusConfig(calculatedStatus);
  const styles = getTaskStatusStyles(calculatedStatus, variant);

  const sizeVariants = {
    small: {
      fontSize: theme.typography.fontSize.xs,
      padding: '0.125rem 0.375rem',
      gap: '0.25rem',
      iconSize: 10
    },
    medium: {
      fontSize: theme.typography.fontSize.sm,
      padding: '0.25rem 0.5rem',
      gap: '0.375rem',
      iconSize: 12
    },
    large: {
      fontSize: theme.typography.fontSize.base,
      padding: '0.375rem 0.75rem',
      gap: '0.5rem',
      iconSize: 16
    }
  };

  const sizeConfig = sizeVariants[size];
  const IconComponent = config.icon;

  // Calculate relative time text
  const getRelativeTimeText = () => {
    if (completed || calculatedStatus === 'completed') {
      return 'Completed';
    }

    if (!dueDate && !task?.dueDate) {
      return 'No due date';
    }

    const targetDate = new Date(dueDate || task.dueDate);
    const now = currentTime;
    const diffTime = targetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffTime < 0) {
      const overdueDays = Math.abs(diffDays);
      const overdueHours = Math.abs(diffHours);
      
      if (overdueDays >= 1) {
        return `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`;
      } else if (overdueHours >= 1) {
        return `Overdue by ${overdueHours} hour${overdueHours !== 1 ? 's' : ''}`;
      } else {
        return 'Overdue';
      }
    } else if (diffDays <= 0) {
      if (diffHours <= 1) {
        return 'Due within 1 hour';
      } else if (diffHours <= 6) {
        return `Due in ${diffHours} hours`;
      } else {
        return 'Due today';
      }
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return `Due in ${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) !== 1 ? 's' : ''}`;
    }
  };

  const relativeTimeText = getRelativeTimeText();

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
    },
    compact: {
      ...styles,
      padding: '0.125rem 0.25rem',
      fontSize: theme.typography.fontSize.xs,
      borderRadius: theme.borderRadius.sm,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontWeight: theme.typography.fontWeight.medium,
      border: `1px solid ${config.borderColor}`,
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

  // Pulse animation for overdue tasks
  const pulseStyles = calculatedStatus === 'overdue' ? {
    animation: 'statusPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  } : {};

  // Hover effects
  const hoverStyles = onClick ? {
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows.md,
      backgroundColor: config.color,
      color: 'white'
    }
  } : {};

  const handleClick = (e) => {
    if (onClick) {
      onClick(e, calculatedStatus, task);
    }
  };

  // Get display text based on showRelativeTime and showLabel
  const getDisplayText = () => {
    if (showRelativeTime) {
      return relativeTimeText;
    }
    if (showLabel) {
      return config.label;
    }
    return '';
  };

  const displayText = getDisplayText();

  return (
    <>
      <div
        className={`task-status-${variant} ${className}`}
        style={{
          ...currentStyle,
          ...animationStyles,
          ...pulseStyles,
          ...hoverStyles,
          position: 'relative'
        }}
        onClick={handleClick}
        title={`Status: ${config.label}${showRelativeTime ? ` - ${relativeTimeText}` : ''}`}
        {...props}
      >
        {showIcon && IconComponent && (
          <IconComponent 
            size={sizeConfig.iconSize} 
            style={{ 
              color: variant === 'outline' ? config.color : 'inherit',
              flexShrink: 0
            }} 
          />
        )}
        
        {(showLabel || showRelativeTime) && displayText && (
          <span style={{ 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: variant === 'compact' ? '100px' : '200px'
          }}>
            {displayText}
          </span>
        )}
        
        {/* Pulse overlay for overdue tasks */}
        {calculatedStatus === 'overdue' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 'inherit',
            backgroundColor: config.color,
            opacity: 0.2,
            animation: 'statusPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            pointerEvents: 'none'
          }} />
        )}
      </div>
      
      {/* CSS animations and hover effects */}
      <style jsx>{`
        @keyframes statusPulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.03);
          }
        }
        
        @keyframes statusBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        
        @keyframes statusGlow {
          0%, 100% {
            box-shadow: 0 0 5px ${config.color}40;
          }
          50% {
            box-shadow: 0 0 15px ${config.color}60;
          }
        }

        .task-status-badge:hover,
        .task-status-pill:hover,
        .task-status-compact:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.md};
        }

        .task-status-outline:hover {
          background-color: ${config.color};
          color: white;
        }

        .task-status-minimal:hover {
          color: ${config.color};
          text-shadow: 0 0 8px ${config.color}40;
        }

        /* Special styling for overdue tasks */
        .task-status-badge.overdue,
        .task-status-pill.overdue {
          animation: statusPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Accessibility improvements */
        .task-status-badge:focus,
        .task-status-pill:focus,
        .task-status-outline:focus,
        .task-status-minimal:focus,
        .task-status-compact:focus {
          outline: 2px solid ${config.color};
          outline-offset: 2px;
        }

        /* Responsive behavior */
        @media (max-width: 768px) {
          .task-status-badge,
          .task-status-pill {
            padding: 0.125rem 0.25rem;
            font-size: 0.75rem;
          }
          
          .task-status-badge span,
          .task-status-pill span {
            max-width: 80px;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .task-status-badge,
          .task-status-pill,
          .task-status-compact {
            background-color: ${config.darkBackgroundColor || config.backgroundColor};
            color: ${config.darkColor || config.color};
          }
        }
      `}</style>
    </>
  );
};

// Specialized status badge components
export const TaskStatusBadgeCompact = ({ task, ...props }) => (
  <TaskStatusBadge
    task={task}
    variant="compact"
    showIcon={true}
    showLabel={false}
    showRelativeTime={true}
    {...props}
  />
);

export const TaskStatusBadgeMinimal = ({ task, ...props }) => (
  <TaskStatusBadge
    task={task}
    variant="minimal"
    showIcon={true}
    showLabel={false}
    showRelativeTime={true}
    {...props}
  />
);

export const TaskStatusBadgeDetailed = ({ task, ...props }) => (
  <TaskStatusBadge
    task={task}
    variant="badge"
    showIcon={true}
    showLabel={true}
    showRelativeTime={true}
    size="large"
    {...props}
  />
);

// Status badge with live updates
export const LiveTaskStatusBadge = ({ 
  task, 
  updateInterval = 60000, // Update every minute
  ...props 
}) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return (
    <TaskStatusBadge
      task={task}
      animated={true}
      key={lastUpdate} // Force re-render on update
      {...props}
    />
  );
};

export default TaskStatusBadge;