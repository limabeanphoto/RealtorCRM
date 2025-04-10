import { useState } from 'react';
import { FaCheck, FaClock, FaEdit, FaTrash, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
  
  // Get color based on status
  const getStatusStyle = (status) => {
    const styles = {
      'Open': { backgroundColor: theme.colors.brand.accent, color: 'white' },
      'In Progress': { backgroundColor: theme.colors.brand.highlight, color: theme.colors.brand.text },
      'Completed': { backgroundColor: theme.colors.brand.primary, color: 'white' }
    };
    
    return styles[status] || {};
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
  
  // Handle status change
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    onStatusChange(task.id, newStatus);
  };
  
  return (
    <div style={{ 
      border: '1px solid #e2e8f0', 
      borderRadius: theme.borderRadius.md,
      margin: '0 0 1rem 0',
      backgroundColor: task.status === 'Completed' ? '#f8f9fa' : 'white',
      opacity: task.status === 'Completed' ? 0.8 : 1,
      boxShadow: theme.shadows.sm,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease',
      ':hover': {
        boxShadow: theme.shadows.md
      }
    }}>
      {/* Card Header */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: isExpanded ? '1px solid #ddd' : 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        cursor: 'pointer'
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, task.status === 'Completed' ? 'Open' : 'Completed');
              }}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                border: `2px solid ${task.status === 'Completed' ? theme.colors.brand.primary : '#ddd'}`,
                backgroundColor: task.status === 'Completed' ? theme.colors.brand.primary : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {task.status === 'Completed' && <FaCheck size={12} color="white" />}
            </div>
            
            <h3 style={{ 
              margin: 0, 
              textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
              color: task.status === 'Completed' ? theme.colors.brand.text : theme.colors.brand.primary
            }}>
              {task.title}
            </h3>
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
              display: 'inline-block',
              padding: '0.2rem 0.5rem',
              borderRadius: theme.borderRadius.sm,
              fontSize: '0.8rem',
              ...getStatusStyle(task.status)
            }}>
              {task.status}
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
          
          {!isExpanded && task.contact && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
              Contact: {task.contact.name}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <FaEdit size={12} /> Edit
          </Button>
          
          <Button
            variant="danger"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this task?')) {
                onDelete(task.id);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <FaTrash size={12} /> Delete
          </Button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: theme.colors.brand.text,
            marginLeft: '0.5rem'
          }}>
            {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
          </div>
        </div>
      </div>
      
      {/* Card Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '1rem', backgroundColor: '#f9f9f9' }}>
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
          
          {task.contact && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Contact:</div>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #eee'
              }}>
                <div>{task.contact.name}</div>
                {task.contact.company && <div style={{ color: theme.colors.brand.text }}>{task.contact.company}</div>}
                <div style={{ color: theme.colors.brand.accent }}>{task.contact.phone}</div>
              </div>
            </div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Status:</div>
            <select
              value={task.status}
              onChange={handleStatusChange}
              style={{ 
                padding: '0.5rem',
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #ddd',
                width: '100%',
              }}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Created:</div>
            <div style={{ color: theme.colors.brand.text }}>{formatDate(task.createdAt)}</div>
          </div>
        </div>
      )}
    </div>
  );
}