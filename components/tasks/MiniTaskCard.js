import React from 'react';
import { FaCheck, FaCalendarAlt, FaEdit, FaClock, FaExclamationCircle } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';
import { formatDateToPacificTime } from '../../utils/dateUtils';

const MiniTaskCard = ({ task, onEditTask, onStatusChange }) => {
  // Format date for display using our utility function
  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    
    // Use the utility function that handles Pacific Time
    const formatted = formatDateToPacificTime(dateString);
    
    // Extract just the date part (without time)
    const datePart = formatted.split(',')[0];
    return datePart;
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    // Use the utility function that handles Pacific Time
    const formatted = formatDateToPacificTime(dateString);
    
    // Extract just the time part
    const timePart = formatted.split(',')[1]?.trim() || '';
    return timePart;
  };

  // Check if task is due soon (within 2 days)
  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate);
    const daysDiff = (due - now) / (1000 * 60 * 60 * 24);
    return daysDiff <= 2 && daysDiff >= 0;
  };

  // Check if task is overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Handle status change
  const handleStatusToggle = (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    
    if (onStatusChange) {
      onStatusChange(task.id, task.status === 'Completed' ? 'Active' : 'Completed');
    }
  };

  // Handle edit button click - FIXED to ensure correct task object is passed
  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    e.preventDefault(); // Prevent any default behavior
    
    // Make sure we have a properly formatted task for the edit modal
    const formattedTask = {
      ...task,
      // Ensure dueDate is properly formatted for datetime-local input
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
    };
    
    if (onEditTask && typeof onEditTask === 'function') {
      onEditTask(formattedTask);
    } else {
      console.error('onEditTask is not a function or not provided to MiniTaskCard');
    }
  };

  return (
    <div 
      style={{ 
        backgroundColor: 'white', 
        padding: '0.75rem', 
        borderRadius: theme.borderRadius.sm,
        border: `1px solid ${isOverdue(task.dueDate) ? '#f8d7da' : 
                            isDueSoon(task.dueDate) ? '#fff3cd' : '#eee'}`,
        marginBottom: '0.5rem',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from affecting parent elements
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Task Info */}
        <div style={{ flex: 1, marginRight: '0.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '0.25rem'
          }}>
            {/* Status Checkbox */}
            <div 
              onClick={handleStatusToggle}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${task.status === 'Completed' ? theme.colors.brand.primary : '#ddd'}`,
                backgroundColor: task.status === 'Completed' ? theme.colors.brand.primary : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title={task.status === 'Completed' ? 'Mark as To-Do' : 'Mark as Completed'}
            >
              {task.status === 'Completed' && <FaCheck size={10} color="white" />}
            </div>
            
            {/* Task Title */}
            <strong style={{ 
              textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
              color: task.status === 'Completed' ? theme.colors.brand.text : 'inherit'
            }}>
              {task.title}
            </strong>
          </div>
          
          {/* Due Date */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem', 
            fontSize: '0.9rem', 
            color: theme.colors.brand.text,
            marginBottom: '0.25rem'
          }}>
            <FaCalendarAlt size={12} />
            <span>Due: {formatDate(task.dueDate)} at {formatTime(task.dueDate)}</span>
          </div>
          
          {/* Task Status Badges */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginTop: '0.25rem' 
          }}>
            {isDueSoon(task.dueDate) && !isOverdue(task.dueDate) && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.75rem',
                backgroundColor: '#fff3cd',
                color: '#856404'
              }}>
                <FaClock size={10} />
                Due Soon
              </span>
            )}
            
            {isOverdue(task.dueDate) && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.75rem',
                backgroundColor: '#f8d7da',
                color: '#721c24'
              }}>
                <FaExclamationCircle size={10} />
                Overdue
              </span>
            )}
            
            {task.status === 'Completed' && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.3rem',
                borderRadius: '3px',
                fontSize: '0.75rem',
                backgroundColor: '#d4edda',
                color: '#155724'
              }}>
                <FaCheck size={10} />
                Completed
              </span>
            )}
          </div>
        </div>
        
        {/* Action Button */}
        <Button
          onClick={handleEdit}
          style={{ 
            width: '28px',
            height: '28px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '28px'
          }}
          variant="secondary"
          tooltip="Edit task details"
        >
          <FaEdit size={12} />
        </Button>
      </div>
      
      {/* Task Description (if available) */}
      {task.description && (
        <div style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.9rem',
          backgroundColor: '#f8f9fa',
          padding: '0.5rem',
          borderRadius: theme.borderRadius.sm,
          color: theme.colors.brand.text
        }}>
          {task.description}
        </div>
      )}
    </div>
  );
};

export default MiniTaskCard;