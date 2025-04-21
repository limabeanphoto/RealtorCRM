import { useState, useEffect } from 'react';
import { FaCheck, FaClock, FaEdit, FaTrash, FaTasks } from 'react-icons/fa';
import theme from '../../styles/theme';
import MiniContactCard from '../contacts/MiniContactCard';
import Button from '../common/Button';
import BaseCard from '../common/BaseCard';

// Utility function to format date
const formatDate = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Utility function to get color based on priority
const getPriorityStyle = (priority) => {
  const styles = {
    'High': { backgroundColor: '#f8d7da', color: '#721c24' },
    'Medium': { backgroundColor: theme.colors.brand.highlight, color: theme.colors.brand.text },
    'Low': { backgroundColor: theme.colors.brand.secondary, color: 'white' }
  };
  
  return styles[priority] || {};
};

// Calculate time remaining or overdue
const getTimeStatus = (task) => {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (task.status === 'Completed') {
    return { text: 'Completed', style: { color: theme.colors.brand.primary } };
  } else if (diffTime < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, style: { color: '#dc3545' } };
  } else if (diffDays <= 0) { // Check if less than or equal to zero to handle same day
    return { text: 'Due today', style: { color: '#ffc107' } };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', style: { color: theme.colors.brand.accent } };
  } else {
    return { text: `Due in ${diffDays} days`, style: { color: theme.colors.brand.text } };
  }
};

export default function TaskCard({ 
  task, 
  onStatusChange,
  onDelete,
  onEdit
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingToComplete, setAnimatingToComplete] = useState(false);
  const [enhancedContact, setEnhancedContact] = useState(null);
  
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
  
  // For visual display during animation
  const visualStatus = () => {
    if (isAnimating) {
      return animatingToComplete ? 'Completed' : 'Active';
    }
    return task.status;
  };
  
  // Is visually completed
  const isVisuallyCompleted = visualStatus() === 'Completed';
  
  // Custom styles for square icon buttons
  const iconButtonStyle = {
    width: '32px',
    height: '32px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px'
  };

  // If task data isn't available yet, don't render
  if (!task) {
    return null;
  }

  const timeStatus = getTimeStatus(task);
  
  // Generate the header content for BaseCard
  const headerContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange(e);
          }}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            border: `2px solid ${isVisuallyCompleted ? theme.colors.brand.primary : '#ddd'}`,
            backgroundColor: isVisuallyCompleted ? theme.colors.brand.primary : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease', // Add transition for checkbox
          }}
          title={isVisuallyCompleted ? 'Mark as To-Do' : 'Mark as Completed'}
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
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ 
          display: 'inline-block',
          padding: '0.2rem 0.5rem',
          borderRadius: theme.borderRadius.sm,
          fontSize: '0.8rem',
          ...getPriorityStyle(task.priority)
        }}>
          {task.priority}
        </span>
        
        <span style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.9rem', 
          ...timeStatus.style 
        }}>
          <FaClock size={12} />
          {timeStatus.text}
        </span>
      </div>
      
      {!isVisuallyCompleted && task.contact && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
          Contact: {task.contact.name}
        </div>
      )}
    </>
  );
  
  // Generate the actions for BaseCard
  const actions = (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(task);
        }}
        style={iconButtonStyle}
        variant="secondary"
        tooltip="Edit this task"
      >
        <FaEdit size={14} />
      </Button>
      
      <Button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this task?')) {
            onDelete(task.id);
          }
        }}
        style={iconButtonStyle}
        variant="outline"
        tooltip="Delete this task"
      >
        <FaTrash size={14} style={{ color: '#e74c3c' }}/> {/* Red icon for delete */}
      </Button>
    </>
  );
  
  // Generate the expanded content for BaseCard
  const expandedContent = (
    <>
      {task.description && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Description:</div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '0.75rem', 
            borderRadius: theme.borderRadius.sm,
            border: '1px solid #eee'
          }}>
            {task.description}
          </div>
        </div>
      )}
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Due Date:</div>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '0.75rem', 
          borderRadius: theme.borderRadius.sm,
          border: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: timeStatus.style.color || theme.colors.brand.text,
        }}>
          <FaClock /> {formatDate(task.dueDate)}
        </div>
      </div>
      
      {enhancedContact && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Contact:</div>
          <MiniContactCard contact={enhancedContact} />
        </div>
      )}
      
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Created:</div>
        <div style={{ color: theme.colors.brand.text }}>{formatDate(task.createdAt)}</div>
      </div>
    </>
  );
  
  // Apply different style if task is completed
  const cardStyle = {
    opacity: isVisuallyCompleted ? 0.8 : 1,
    backgroundColor: isVisuallyCompleted ? '#f8f9fa' : 'white',
  };
  
  // Apply different style to task title based on completion
  const titleStyle = {
    textDecoration: isVisuallyCompleted ? 'line-through' : 'none',
    color: isVisuallyCompleted ? theme.colors.brand.text : theme.colors.brand.primary,
    transition: 'all 0.3s ease', // Add transition for text
  };

  // CSS animations
  const customStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <BaseCard
        title={task.title}
        titleStyle={titleStyle}
        headerContent={headerContent}
        actions={actions}
        expandedContent={expandedContent}
        style={cardStyle}
      />
    </>
  );
}