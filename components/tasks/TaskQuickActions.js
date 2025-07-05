import React from 'react';
import { FaCheck, FaEdit, FaCopy, FaTrash, FaEye, FaPlay, FaPause } from 'react-icons/fa';
import Button from '../common/Button';
import theme from '../../styles/theme';

/**
 * TaskQuickActions - Reusable quick action buttons for tasks
 * Provides consistent action buttons across different contexts
 */
export default function TaskQuickActions({ 
  task,
  onStatusChange,
  onEdit,
  onDuplicate,
  onDelete,
  onView,
  showLabels = false,
  size = 'medium',
  variant = 'outline',
  orientation = 'horizontal',
  className = '',
  style = {}
}) {
  if (!task) return null;

  const isCompleted = task.status === 'Completed';
  
  // Action button configuration
  const actions = [
    {
      id: 'status',
      icon: isCompleted ? FaPlay : FaCheck,
      label: isCompleted ? 'Mark Active' : 'Mark Complete',
      onClick: (e) => {
        e.stopPropagation();
        onStatusChange?.(task.id, isCompleted ? 'Active' : 'Completed');
      },
      color: isCompleted ? theme.colors.secondary[500] : theme.colors.success[500],
      visible: !!onStatusChange
    },
    {
      id: 'view',
      icon: FaEye,
      label: 'View Details',
      onClick: (e) => {
        e.stopPropagation();
        onView?.(task);
      },
      color: theme.colors.info[500],
      visible: !!onView
    },
    {
      id: 'edit',
      icon: FaEdit,
      label: 'Edit Task',
      onClick: (e) => {
        e.stopPropagation();
        onEdit?.(task);
      },
      color: theme.colors.primary[500],
      visible: !!onEdit
    },
    {
      id: 'duplicate',
      icon: FaCopy,
      label: 'Duplicate Task',
      onClick: (e) => {
        e.stopPropagation();
        onDuplicate?.(task);
      },
      color: theme.colors.warning[500],
      visible: !!onDuplicate
    },
    {
      id: 'delete',
      icon: FaTrash,
      label: 'Delete Task',
      onClick: (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this task?')) {
          onDelete?.(task.id);
        }
      },
      color: theme.colors.error[500],
      visible: !!onDelete
    }
  ];

  const visibleActions = actions.filter(action => action.visible);

  if (visibleActions.length === 0) return null;

  // Button size configuration
  const buttonSizes = {
    small: { width: '28px', height: '28px', iconSize: 12 },
    medium: { width: '32px', height: '32px', iconSize: 14 },
    large: { width: '40px', height: '40px', iconSize: 16 }
  };

  const buttonConfig = buttonSizes[size] || buttonSizes.medium;

  // Container styles
  const containerStyles = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: '0.5rem',
    alignItems: 'center',
    ...style
  };

  // Individual button styles
  const buttonStyle = {
    ...buttonConfig,
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: buttonConfig.width,
    borderRadius: showLabels ? '6px' : '50%'
  };

  return (
    <div className={`task-quick-actions ${className}`} style={containerStyles}>
      {visibleActions.map(action => {
        const Icon = action.icon;
        
        return (
          <Button
            key={action.id}
            onClick={action.onClick}
            variant={variant}
            style={{
              ...buttonStyle,
              ...(showLabels ? { 
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                minWidth: 'auto',
                gap: '0.5rem'
              } : {})
            }}
            tooltip={action.label}
            className="hover-lift-gentle focus-ring"
          >
            <Icon 
              size={buttonConfig.iconSize} 
              style={{ 
                color: variant === 'outline' ? action.color : undefined
              }} 
            />
            {showLabels && (
              <span style={{ 
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                fontWeight: '500'
              }}>
                {action.label}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Specialized variants for different contexts
export const TaskCardActions = (props) => (
  <TaskQuickActions 
    {...props}
    size="medium"
    variant="outline"
    orientation="horizontal"
    showLabels={false}
  />
);

export const TaskModalActions = (props) => (
  <TaskQuickActions 
    {...props}
    size="medium"
    variant="outline"
    orientation="horizontal"
    showLabels={true}
  />
);

export const TaskListActions = (props) => (
  <TaskQuickActions 
    {...props}
    size="small"
    variant="outline"
    orientation="horizontal"
    showLabels={false}
  />
);

export const TaskBoardActions = (props) => (
  <TaskQuickActions 
    {...props}
    size="small"
    variant="outline"
    orientation="vertical"
    showLabels={false}
  />
);