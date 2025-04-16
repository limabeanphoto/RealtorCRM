import { useState } from 'react';
import { FaCheck, FaClock, FaAngleDown, FaAngleUp, FaEdit } from 'react-icons/fa';
import theme from '../../styles/theme';

export default function MiniTaskCard({ 
  task, 
  onStatusChange,
  onEdit
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Animation state for both check/uncheck
  const [animatingToComplete, setAnimatingToComplete] = useState(false); // Direction of animation
  
  // Toggle expanded state
  const toggleExpand = (e) => {
    e.stopPropagation(); // Stop propagation to prevent parent card from collapsing
    setIsExpanded(!isExpanded);
  };
  
  // Format date for display
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
  
  // Get color based on priority
  const getPriorityStyle = (priority) => {
    const styles = {
      'High': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Medium': { backgroundColor: theme.colors.brand.highlight, color: theme.colors.brand.text },
      'Low': { backgroundColor: theme.colors.brand.secondary, color: 'white' }
    };
    
    return styles[priority] || {};
  };
  
  // Calculate time remaining or overdue
  const getTimeStatus = () => {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (task.status === 'Completed') {
      return { text: 'Completed', style: { color: theme.colors.brand.primary } };
    } else if (diffTime < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, style: { color: '#dc3545' } };
    } else if (diffDays === 0) {
      return { text: 'Due today', style: { color: '#ffc107' } };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', style: { color: theme.colors.brand.accent } };
    } else {
      return { text: `Due in ${diffDays} days`, style: { color: theme.colors.brand.text } };
    }
  };
  
  const timeStatus = getTimeStatus();
  
  // Enhanced handle status change with better animations
  const handleStatusChange = (e) => {
    e.stopPropagation(); // Prevent card from toggling
    
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
  
  // For visual display, we need to calculate what the status "looks like" during animation
  const visualStatus = () => {
    if (isAnimating) {
      return animatingToComplete ? 'Completed' : 'Active';
    }
    return task.status;
  };
  
  // Is visually completed
  const isVisuallyCompleted = visualStatus() === 'Completed';
  
  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '0.75rem', 
      borderRadius: theme.borderRadius.sm,
      border: '1px solid #eee',
      marginBottom: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease', // Add transition for the whole card
    }} onClick={toggleExpand}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Task Title and Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(e);
            }}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: `2px solid ${isVisuallyCompleted ? theme.colors.brand.primary : '#ddd'}`,
              backgroundColor: isVisuallyCompleted ? theme.colors.brand.primary : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease', // Add transition for the checkbox
            }}
          >
            {isVisuallyCompleted && (
              <FaCheck 
                size={10} 
                color="white"
                style={{ 
                  opacity: animatingToComplete && isAnimating ? 0 : 1,
                  animation: animatingToComplete && isAnimating ? 'fadeIn 0.3s forwards' : 
                              !animatingToComplete && isAnimating ? 'fadeOut 0.3s forwards' : 'none',
                }}
              />
            )}
          </div>
          
          <div style={{ 
            fontWeight: 'bold',
            textDecoration: isVisuallyCompleted ? 'line-through' : 'none',
            color: isVisuallyCompleted ? theme.colors.brand.text : 'inherit',
            transition: 'all 0.3s ease', // Add transition for the text
          }}>
            {task.title}
          </div>
        </div>
        
        {/* Priority Badge and Expand Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontSize: '0.75rem', 
            ...timeStatus.style 
          }}>
            <FaClock size={10} />
            {timeStatus.text}
          </span>
          
          <span style={{ 
            display: 'inline-block',
            padding: '0.15rem 0.35rem',
            borderRadius: '3px',
            fontSize: '0.7rem',
            ...getPriorityStyle(task.priority)
          }}>
            {task.priority}
          </span>
          
          <div style={{ color: theme.colors.brand.text }}>
            {isExpanded ? <FaAngleUp size={14} /> : <FaAngleDown size={14} />}
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ 
          marginTop: '0.75rem', 
          paddingTop: '0.75rem', 
          borderTop: '1px solid #eee'
        }}>
          {/* Task Details */}
          <div style={{ marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div><strong>Due Date:</strong> {formatDate(task.dueDate)}</div>
            <div><strong>Created:</strong> {formatDate(task.createdAt)}</div>
          </div>
          
          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Description:</div>
              <div style={{ fontSize: '0.9rem' }}>{task.description}</div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.brand.primary, // Lima Bean Green
                color: 'white',
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
              }}
            >
              <FaEdit size={12} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(e);
              }}
              style={{
                backgroundColor: task.status === 'Completed' ? '#6c757d' : theme.colors.brand.primary,
                color: 'white',
                padding: '0.25rem 0.5rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              {task.status === 'Completed' ? 'Mark as Active' : 'Mark as Completed'}
            </button>
          </div>
        </div>
      )}
      
      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}