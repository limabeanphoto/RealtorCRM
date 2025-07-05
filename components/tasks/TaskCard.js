import { useState, useEffect } from 'react';
import { 
  FaCheck, 
  FaClock, 
  FaEdit, 
  FaTrash, 
  FaTasks,
  FaExclamation,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaCopy,
  FaGripVertical,
  FaEye,
  FaPlay,
  FaPause
} from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';
import BaseCard from '../common/BaseCard';
import MiniContactCard from '../contacts/MiniContactCard';
import QuickActionButton from '../common/QuickActionButton';
import QuickActionGroup from '../common/QuickActionGroup';

// Utility function to format date in Pacific Time
const formatDate = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles' // Display in Pacific Time
  };
  return new Date(dateString).toLocaleString('en-US', options);
};

// Priority configuration
const getPriorityConfig = (priority) => {
  const configs = {
    High: {
      icon: FaExclamation,
      color: theme.colors.error[500],
      backgroundColor: theme.colors.error[50],
      borderColor: theme.colors.error[200],
      label: 'High Priority',
      weight: 3
    },
    Medium: {
      icon: FaMinus,
      color: theme.colors.warning[600],
      backgroundColor: theme.colors.warning[50],
      borderColor: theme.colors.warning[200],
      label: 'Medium Priority',
      weight: 2
    },
    Low: {
      icon: FaArrowDown,
      color: theme.colors.success[600],
      backgroundColor: theme.colors.success[50],
      borderColor: theme.colors.success[200],
      label: 'Low Priority',
      weight: 1
    }
  };
  return configs[priority] || configs.Medium;
};

// Status badge configuration
const getStatusConfig = (status) => {
  const configs = {
    Completed: {
      color: theme.colors.success[600],
      backgroundColor: theme.colors.success[50],
      borderColor: theme.colors.success[200],
      icon: FaCheck,
      label: 'Completed'
    },
    Active: {
      color: theme.colors.info[600],
      backgroundColor: theme.colors.info[50],
      borderColor: theme.colors.info[200],
      icon: FaPlay,
      label: 'Active'
    },
    Paused: {
      color: theme.colors.warning[600],
      backgroundColor: theme.colors.warning[50],
      borderColor: theme.colors.warning[200],
      icon: FaPause,
      label: 'Paused'
    }
  };
  return configs[status] || configs.Active;
};

// Calculate time remaining or overdue
const getTimeStatus = (task) => {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (task.status === 'Completed') {
    return { text: 'Completed', style: { color: theme.colors.success[600] } };
  } else if (diffTime < 0) {
    return { 
      text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, 
      style: { color: theme.colors.error[600] },
      urgent: true
    };
  } else if (diffDays <= 0) {
    return { 
      text: 'Due today', 
      style: { color: theme.colors.warning[600] },
      urgent: true
    };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', style: { color: theme.colors.warning[500] } };
  } else {
    return { text: `Due in ${diffDays} days`, style: { color: theme.colors.neutral[600] } };
  }
};

export default function TaskCard({ 
  task, 
  onStatusChange,
  onDelete,
  onEdit,
  onDuplicate,
  onView,
  isDragging = false,
  dragHandle = false,
  className = '',
  ...props
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingToComplete, setAnimatingToComplete] = useState(false);
  const [enhancedContact, setEnhancedContact] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Effect to ensure contact includes all relevant information
  useEffect(() => {
    if (task && task.contact) {
      // Make sure contact includes notes
      setEnhancedContact({
        ...task.contact,
        notes: task.contact.notes || ''
      });
    }
  }, [task]);

  // Enhanced handle status change with better animations
  const handleStatusChange = (e) => {
    e.stopPropagation();
    
    // Don't allow changes while animating
    if (isAnimating) return;
    
    const isCurrentlyCompleted = task.status === 'Completed';
    
    // Set animation direction
    setAnimatingToComplete(!isCurrentlyCompleted);
    setIsAnimating(true);
    
    // Delay the actual status change
    setTimeout(() => {
      onStatusChange(task.id, isCurrentlyCompleted ? 'Active' : 'Completed');
      
      // Keep the animation state a bit longer to prevent flashing
      setTimeout(() => {
        setIsAnimating(false);
      }, 50); // Small additional delay to prevent flashing
    }, 300); // Main animation delay
  };

  // Handle duplicate task
  const handleDuplicate = (e) => {
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(task);
    }
  };

  // Handle view task
  const handleView = (e) => {
    e.stopPropagation();
    if (onView) {
      onView(task);
    }
  };

  // Handle complete task (quick action)
  const handleQuickComplete = (e) => {
    e.stopPropagation();
    if (task.status !== 'Completed') {
      handleStatusChange(e);
    }
  };
  
  // For visual display during animation
  const visualStatus = () => {
    if (isAnimating) {
      return animatingToComplete ? 'Completed' : 'Active';
    }
    return task.status;
  };
  
  // Is visually completed
  const isVisuallyCompleted = visualStatus() === 'Completed';
  
  // Get configurations
  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(visualStatus());
  const timeStatus = getTimeStatus(task);

  // If task data isn't available yet, don't render
  if (!task) {
    return null;
  }
  
  // Generate modern header content with enhanced features
  const headerContent = (
    <>
      {/* Top row: Priority, Status, Time */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: theme.spacing[3], 
        marginBottom: theme.spacing[3],
        flexWrap: 'wrap'
      }}>
        {/* Drag handle */}
        {dragHandle && (
          <div 
            className="drag-handle"
            style={{
              color: theme.colors.neutral[400],
              cursor: 'grab',
              padding: theme.spacing[1],
              borderRadius: theme.borderRadius.sm,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = theme.colors.neutral[600];
              e.target.style.backgroundColor = theme.colors.neutral[100];
            }}
            onMouseLeave={(e) => {
              e.target.style.color = theme.colors.neutral[400];
              e.target.style.backgroundColor = 'transparent';
            }}
            title="Drag to reorder"
          >
            <FaGripVertical size={12} />
          </div>
        )}

        {/* Priority indicator */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
            padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
            borderRadius: theme.borderRadius.full,
            backgroundColor: priorityConfig.backgroundColor,
            border: `1px solid ${priorityConfig.borderColor}`,
            color: priorityConfig.color,
            fontSize: theme.typography.fontSize.xs,
            fontWeight: theme.typography.fontWeight.medium,
            minWidth: '60px'
          }}
          title={priorityConfig.label}
        >
          <priorityConfig.icon size={10} />
          <span>{task.priority}</span>
        </div>

        {/* Status checkbox with enhanced styling */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange(e);
          }}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: `2px solid ${isVisuallyCompleted ? statusConfig.color : theme.colors.neutral[300]}`,
            backgroundColor: isVisuallyCompleted ? statusConfig.color : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isVisuallyCompleted ? `0 0 0 3px ${statusConfig.color}20` : 'none',
            transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
          }}
          className="touch-target"
          title={isVisuallyCompleted ? 'Mark as To-Do' : 'Mark as Completed'}
          onMouseEnter={(e) => {
            if (!isAnimating) {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = `0 0 0 3px ${statusConfig.color}20`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isAnimating) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = isVisuallyCompleted ? `0 0 0 3px ${statusConfig.color}20` : 'none';
            }
          }}
        >
          {isVisuallyCompleted && (
            <FaCheck 
              size={12} 
              color="white" 
              style={{ 
                opacity: animatingToComplete && isAnimating ? 0 : 1,
                animation: animatingToComplete && isAnimating ? 'fadeIn 0.3s forwards' : 
                           !animatingToComplete && isAnimating ? 'fadeOut 0.3s forwards' : 'none',
              }} 
            />
          )}
        </div>

        {/* Time status with enhanced urgency indicators */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[2],
          padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
          borderRadius: theme.borderRadius.md,
          backgroundColor: timeStatus.urgent ? `${timeStatus.style.color}10` : theme.colors.neutral[50],
          border: `1px solid ${timeStatus.urgent ? `${timeStatus.style.color}30` : theme.colors.neutral[200]}`,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          ...timeStatus.style,
          animation: timeStatus.urgent ? 'pulse 2s ease-in-out infinite' : 'none'
        }}>
          <FaClock size={11} />
          <span>{timeStatus.text}</span>
        </div>
      </div>

      {/* Contact information (when not completed) */}
      {!isVisuallyCompleted && task.contact && (
        <div style={{ 
          marginTop: theme.spacing[2],
          padding: theme.spacing[2],
          backgroundColor: theme.colors.neutral[50],
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors.neutral[200]}`,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.neutral[700]
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
            fontWeight: theme.typography.fontWeight.medium
          }}>
            <FaTasks size={12} />
            <span>Contact: {task.contact.name}</span>
          </div>
        </div>
      )}
    </>
  );
  
  // Generate enhanced quick actions
  const actions = (
    <div 
      style={{ 
        display: 'flex', 
        gap: theme.spacing[2],
        alignItems: 'center',
        opacity: isHovered ? 1 : 0.7,
        transition: 'opacity 0.2s ease'
      }}
    >
      {/* Quick complete button (if not completed) */}
      {!isVisuallyCompleted && (
        <Button
          onClick={handleQuickComplete}
          style={{
            width: '32px',
            height: '32px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            backgroundColor: theme.colors.success[50],
            border: `1px solid ${theme.colors.success[200]}`,
            color: theme.colors.success[600],
            borderRadius: theme.borderRadius.md,
            transition: 'all 0.2s ease'
          }}
          className="touch-target hover-lift-gentle"
          variant="ghost"
          title="Complete task"
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = theme.colors.success[100];
            e.target.style.borderColor = theme.colors.success[300];
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = theme.colors.success[50];
            e.target.style.borderColor = theme.colors.success[200];
          }}
        >
          <FaCheck size={12} />
        </Button>
      )}

      {/* View button */}
      {onView && (
        <Button
          onClick={handleView}
          style={{
            width: '32px',
            height: '32px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            backgroundColor: theme.colors.info[50],
            border: `1px solid ${theme.colors.info[200]}`,
            color: theme.colors.info[600],
            borderRadius: theme.borderRadius.md,
            transition: 'all 0.2s ease'
          }}
          className="touch-target hover-lift-gentle"
          variant="ghost"
          title="View task details"
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = theme.colors.info[100];
            e.target.style.borderColor = theme.colors.info[300];
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = theme.colors.info[50];
            e.target.style.borderColor = theme.colors.info[200];
          }}
        >
          <FaEye size={12} />
        </Button>
      )}

      {/* Edit button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(task);
        }}
        style={{
          width: '32px',
          height: '32px',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          backgroundColor: theme.colors.primary[50],
          border: `1px solid ${theme.colors.primary[200]}`,
          color: theme.colors.primary[600],
          borderRadius: theme.borderRadius.md,
          transition: 'all 0.2s ease'
        }}
        className="touch-target hover-lift-gentle"
        variant="ghost"
        title="Edit task"
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = theme.colors.primary[100];
          e.target.style.borderColor = theme.colors.primary[300];
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = theme.colors.primary[50];
          e.target.style.borderColor = theme.colors.primary[200];
        }}
      >
        <FaEdit size={12} />
      </Button>

      {/* Duplicate button */}
      {onDuplicate && (
        <Button
          onClick={handleDuplicate}
          style={{
            width: '32px',
            height: '32px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            backgroundColor: theme.colors.secondary[50],
            border: `1px solid ${theme.colors.secondary[200]}`,
            color: theme.colors.secondary[600],
            borderRadius: theme.borderRadius.md,
            transition: 'all 0.2s ease'
          }}
          className="touch-target hover-lift-gentle"
          variant="ghost"
          title="Duplicate task"
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = theme.colors.secondary[100];
            e.target.style.borderColor = theme.colors.secondary[300];
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = theme.colors.secondary[50];
            e.target.style.borderColor = theme.colors.secondary[200];
          }}
        >
          <FaCopy size={12} />
        </Button>
      )}

      {/* Delete button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this task?')) {
            onDelete(task.id);
          }
        }}
        style={{
          width: '32px',
          height: '32px',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          backgroundColor: theme.colors.error[50],
          border: `1px solid ${theme.colors.error[200]}`,
          color: theme.colors.error[600],
          borderRadius: theme.borderRadius.md,
          transition: 'all 0.2s ease'
        }}
        className="touch-target hover-lift-gentle"
        variant="ghost"
        title="Delete task"
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = theme.colors.error[100];
          e.target.style.borderColor = theme.colors.error[300];
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = theme.colors.error[50];
          e.target.style.borderColor = theme.colors.error[200];
        }}
      >
        <FaTrash size={12} />
      </Button>
    </div>
  );
  
  // Generate enhanced expanded content with modern styling
  const expandedContent = (
    <>
      {/* Task Description */}
      {task.description && (
        <div style={{ marginBottom: theme.spacing[4] }}>
          <div style={{ 
            fontWeight: theme.typography.fontWeight.semibold, 
            marginBottom: theme.spacing[3],
            color: theme.colors.neutral[700],
            fontSize: theme.typography.fontSize.sm
          }}>
            Description:
          </div>
          <div style={{ 
            backgroundColor: theme.colors.neutral[50], 
            padding: theme.spacing[4], 
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.neutral[200]}`,
            fontSize: theme.typography.fontSize.sm,
            lineHeight: theme.typography.lineHeight.relaxed,
            color: theme.colors.neutral[700]
          }}>
            {task.description}
          </div>
        </div>
      )}
      
      {/* Enhanced Due Date Section */}
      <div style={{ marginBottom: theme.spacing[4] }}>
        <div style={{ 
          fontWeight: theme.typography.fontWeight.semibold, 
          marginBottom: theme.spacing[3],
          color: theme.colors.neutral[700],
          fontSize: theme.typography.fontSize.sm
        }}>
          Due Date:
        </div>
        <div style={{ 
          backgroundColor: 'white', 
          padding: theme.spacing[4], 
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.neutral[200]}`,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[3],
          color: timeStatus.style.color || theme.colors.neutral[700],
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          boxShadow: theme.shadows.xs
        }}>
          <FaClock size={14} />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      </div>

      {/* Priority and Status Details */}
      <div style={{ 
        display: 'flex', 
        gap: theme.spacing[4], 
        marginBottom: theme.spacing[4],
        flexWrap: 'wrap'
      }}>
        {/* Priority Detail */}
        <div style={{ flex: 1, minWidth: '120px' }}>
          <div style={{ 
            fontWeight: theme.typography.fontWeight.semibold, 
            marginBottom: theme.spacing[2],
            color: theme.colors.neutral[700],
            fontSize: theme.typography.fontSize.sm
          }}>
            Priority:
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
            padding: theme.spacing[2],
            borderRadius: theme.borderRadius.md,
            backgroundColor: priorityConfig.backgroundColor,
            border: `1px solid ${priorityConfig.borderColor}`,
            color: priorityConfig.color,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium
          }}>
            <priorityConfig.icon size={12} />
            <span>{task.priority}</span>
          </div>
        </div>

        {/* Status Detail */}
        <div style={{ flex: 1, minWidth: '120px' }}>
          <div style={{ 
            fontWeight: theme.typography.fontWeight.semibold, 
            marginBottom: theme.spacing[2],
            color: theme.colors.neutral[700],
            fontSize: theme.typography.fontSize.sm
          }}>
            Status:
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
            padding: theme.spacing[2],
            borderRadius: theme.borderRadius.md,
            backgroundColor: statusConfig.backgroundColor,
            border: `1px solid ${statusConfig.borderColor}`,
            color: statusConfig.color,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium
          }}>
            <statusConfig.icon size={12} />
            <span>{visualStatus()}</span>
          </div>
        </div>
      </div>
      
      {/* Enhanced Contact Section */}
      {enhancedContact && (
        <div style={{ marginBottom: theme.spacing[4] }}>
          <div style={{ 
            fontWeight: theme.typography.fontWeight.semibold, 
            marginBottom: theme.spacing[3],
            color: theme.colors.neutral[700],
            fontSize: theme.typography.fontSize.sm
          }}>
            Contact:
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.neutral[200]}`,
            boxShadow: theme.shadows.xs,
            overflow: 'hidden'
          }}>
            <MiniContactCard contact={enhancedContact} />
          </div>
        </div>
      )}
      
      {/* Task Metadata */}
      <div style={{ 
        display: 'flex', 
        gap: theme.spacing[4], 
        marginTop: theme.spacing[4],
        paddingTop: theme.spacing[4],
        borderTop: `1px solid ${theme.colors.neutral[200]}`,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.neutral[600]
      }}>
        <div>
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>Created:</span>
          <span style={{ marginLeft: theme.spacing[2] }}>
            {formatDate(task.createdAt)}
          </span>
        </div>
        {task.updatedAt && task.updatedAt !== task.createdAt && (
          <div>
            <span style={{ fontWeight: theme.typography.fontWeight.medium }}>Updated:</span>
            <span style={{ marginLeft: theme.spacing[2] }}>
              {formatDate(task.updatedAt)}
            </span>
          </div>
        )}
      </div>
    </>
  );
  
  // Enhanced card styling with modern effects
  const cardStyle = {
    opacity: isVisuallyCompleted ? 0.85 : 1,
    backgroundColor: isVisuallyCompleted ? theme.colors.neutral[50] : 'white',
    transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `1px solid ${isVisuallyCompleted ? theme.colors.neutral[200] : theme.colors.neutral[150]}`,
    borderLeft: `4px solid ${priorityConfig.color}`,
    boxShadow: isDragging ? theme.shadows.lg : theme.shadows.sm,
    position: 'relative',
    ...(timeStatus.urgent && !isVisuallyCompleted && {
      borderLeft: `4px solid ${theme.colors.error[400]}`,
      boxShadow: `0 0 0 1px ${theme.colors.error[200]}, ${theme.shadows.sm}`,
    }),
  };
  
  // Enhanced title styling
  const titleStyle = {
    textDecoration: isVisuallyCompleted ? 'line-through' : 'none',
    color: isVisuallyCompleted ? theme.colors.neutral[500] : theme.colors.neutral[800],
    transition: 'all 0.3s ease',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.lineHeight.tight,
  };

  // Enhanced CSS animations and styles
  const customStyles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.95); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    @keyframes urgentPulse {
      0%, 100% { 
        box-shadow: 0 0 0 0 ${theme.colors.error[400]}40;
      }
      50% { 
        box-shadow: 0 0 0 8px ${theme.colors.error[400]}10;
      }
    }
    
    .task-card-container {
      container-type: inline-size;
    }
    
    .task-card-container:hover .drag-handle {
      opacity: 1;
    }
    
    .drag-handle {
      opacity: 0.3;
      transition: opacity 0.2s ease;
    }
    
    @container (max-width: 400px) {
      .task-card-responsive {
        flex-direction: column;
        gap: ${theme.spacing[2]};
      }
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <div 
        className={`task-card-container ${className} fade-in-up`}
        style={{
          animation: 'fadeInUp 0.4s ease-out forwards',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <BaseCard
          title={task.title}
          titleStyle={titleStyle}
          headerContent={headerContent}
          actions={actions}
          expandedContent={expandedContent}
          style={cardStyle}
          variant="modern"
          accentColor={priorityConfig.color}
          hover={true}
        />
      </div>
    </>
  );
}